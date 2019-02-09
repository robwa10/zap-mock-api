'use strict';

/*
 * Worker related tasks
 *
 */

// Dependencies
const config = require('./config');
const _data = require('./data');
const fs = require('fs');
const helpers = require('./helpers');
const http = require('http');
const https = require('https');
const path = require('path');
const url = require('url');

const workers = {
  // Lookup all checks, get their data, send to validator
  gatherAllChecks: () => {
    // Get all the checks
    _data.list('checks', (err, checks) => {
      if (!err && checks && checks.length > 0) {
        checks.forEach(check => {
          // Read in the check data
          _data.read('checks', check, (err, originalCheckData) => {
            if (!err && originalCheckData) {
              // Pass data to check validator
              workers.validateCheckData(originalCheckData);
            } else {
              console.log('Error reading one of the check data.');
            }
          });
        });
      } else {
        console.log('Error: Could not find any checks to process.');
      }
    });
  },

  // Timer to execute the worker-process once per minute
  loop: () => {
    setInterval(() => {
      workers.gatherAllChecks();
    }, config.checksInterval);
  },

  // Sanity checking the check data
  validateCheckData: data => {
    // Validate all incoming data
    data = typeof data === 'object' && data !== null ? data : {};
    data.id =
      typeof data.id === 'string' && data.id.trim().length === 20
        ? data.id.trim()
        : false;
    data.userPhone =
      typeof data.userPhone === 'string' && data.userPhone.trim().length === 10
        ? data.userPhone.trim()
        : false;
    data.protocol =
      typeof data.protocol === 'string' &&
      ['http', 'https'].indexOf(data.protocol) > -1
        ? data.protocol.trim()
        : false;
    data.url =
      typeof data.url === 'string' && data.url.trim().length > 0
        ? data.url.trim()
        : false;
    data.method =
      typeof data.method === 'string' &&
      ['POST', 'GET', 'PUT', 'DELETE'].indexOf(data.method) > -1
        ? data.method.trim()
        : false;
    data.successCodes =
      typeof data.successCodes === 'object' &&
      data.successCodes instanceof Array &&
      data.successCodes.length > 0
        ? data.successCodes
        : false;
    data.timeoutSeconds =
      typeof data.timeoutSeconds === 'number' &&
      data.timeoutSeconds % 1 === 0 &&
      data.timeoutSeconds >= 1 &&
      data.timeoutSeconds <= 5
        ? data.timeoutSeconds
        : false;

    // Set the keys that may not be set
    data.state =
      typeof data.state === 'string' && ['up', 'down'].indexOf(data.state) > -1
        ? data.state.trim()
        : 'down';
    data.lastChecked =
      typeof data.lastChecked === 'number' && data.lastChecked > 0
        ? data.lastChecked
        : false;

    // If checks are good pass the data along
    if (
      data.id &&
      data.userPhone &&
      data.protocol &&
      data.url &&
      data.method &&
      data.successCodes &&
      data.timeoutSeconds
    ) {
      workers.performCheck(data);
    } else {
      console.log(
        'Error: One of the checks is not properly formatted, skipping it.',
        data
      );
    }
  },

  // Perform the check and send the data and outcome on
  performCheck: data => {
    // Prepare the intial check outcome
    let checkOutcome = {
      error: false,
      responseCode: false,
    };

    // Mark the outcome has not been sent yet
    let outcomeSent = false;

    // Parse the hostname and path
    const parsedUrl = url.parse(`${data.protocol}://www.${data.url}`, true);
    const hostname = parsedUrl.hostname;
    const path = parsedUrl.path; // Use path to get querystring

    const requestDetails = {
      protocol: `${data.protocol}:`,
      hostname,
      method: data.method.toUpperCase(),
      path,
      timeout: data.timeoutSeconds * 1000,
    };

    // Instantiate the request object
    const _moduleToUse = data.protocol === 'http' ? http : https;
    const req = _moduleToUse.request(requestDetails, res => {
      const status = res.statusCode;

      // Update the checkOutcome
      checkOutcome.responseCode = status;

      if (!outcomeSent) {
        workers.processCheckOutcome(data, checkOutcome);
        outcomeSent = true;
      }
    });

    // Bind to the error event
    req.on('error', e => {
      // Update the checkOutcome and pass data along
      checkOutcome.error = {
        error: true,
        value: e,
      };
      if (!outcomeSent) {
        workers.processCheckOutcome(data, checkOutcome);
        outcomeSent = true;
      }
    });

    // Bind to the timeout event
    req.on('timeout', e => {
      // Update the checkOutcome and pass data along
      checkOutcome.error = {
        error: true,
        value: 'timeout',
      };
      if (!outcomeSent) {
        workers.processCheckOutcome(data, checkOutcome);
        outcomeSent = true;
      }
    });

    // End the request
    req.end();
  },

  // Process the outcome, update data as needed, send an alert to the user
  // Accomodate the first check without sending the user an alert
  processCheckOutcome: (data, outcome) => {
    // Decide if check up or down
    const state =
      !outcome.error &&
      outcome.responseCode &&
      data.successCodes.indexOf(outcome.responseCode) > -1
        ? 'up'
        : 'down';

    // Decide if we should send an alert
    const alertWarranted =
      data.lastChecked && data.state !== state ? true : false;

    // Update the check data
    const newCheckData = data;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    // Save the updates
    _data.update('checks', newCheckData.id, newCheckData, err => {
      if (!err) {
        // If needed send the new check data to the next phase in the process
        if (alertWarranted) {
          workers.alertUserToStatusChange(newCheckData);
        } else {
          console.log('Check outcome has not changed');
        }
      } else {
        console.log('Error trying to save updates to one of the checks.');
      }
    });
  },

  alertUserToStatusChange: data => {
    const msg = `Alert: Your check for ${data.method} ${data.protocol}://www.${
      data.url
    } is currently ${data.state}.`;

    helpers.sendTwilioSms(data.userPhone, msg, err => {
      if (!err) {
        console.log('Successful alert: ', msg);
      } else {
        console.log('Error: Could not send sms alert to check id: ', data.id);
      }
    });
  },

  init: () => {
    // Execute all the checks immediately on start up
    workers.gatherAllChecks();
    // Call a loop to continue exexuting checks
    workers.loop();
  },
};

module.exports = workers;
