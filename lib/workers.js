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
const _logs = require('./logs');
const path = require('path');
const url = require('url');

const workers = {
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

  // Log the data gathered during checks, expects the logData to be an object
  log: logData => {
    // Convert the logData to a string
    const logString = JSON.stringify(logData);

    // Determine the name of the log file
    const logFileName = logData.data.id;

    _logs.append(logFileName, logString, err => {
      if (!err) {
        console.log('Log file successfully written.');
      } else {
        console.log('Error writing log file.', logData);
      }
    });
  },

  // Timer to execute the log-rotation process once a day
  logRotationLoop: () => {
    setInterval(() => {
      workers.rotateLogs();
    }, config.logRotationInterval);
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
    const timeOfCheck = Date.now();

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
    newCheckData.lastChecked = timeOfCheck;

    // Log the outcome of the check
    workers.log({ data, outcome, state, alertWarranted, timeOfCheck });

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

  // Rotate/compress the log files
  rotateLogs: () => {
    // List all non compressed log file
    _logs.list(false, (err, logs) => {
      if (!err && logs && logs.length > 0) {
        logs.forEach(logName => {
          const logId = logName.replace('.log', '');
          const newFileId = `${logId}-${Date.now()}`;
          _logs.compress(logId, newFileId, err => {
            if (!err) {
              // Truncate the log
              _logs.truncate(logId, err => {
                if (!err) {
                  console.log('Success truncating log file.');
                } else {
                  console.log('Error truncating log file.', err);
                }
              });
            } else {
              console.log('Error compressing one of the log files.', err);
            }
          });
        });
      } else {
        console.logs('Error: Could not find logs to rotate.');
      }
    });
  },

  init: () => {
    // Execute all the checks immediately on start up
    workers.gatherAllChecks();
    // Call a loop to continue exexuting checks
    workers.loop();
    // Compress all the logs immediately
    workers.rotateLogs();
    // Call the compression loop so logs will be compressed later on
    workers.logRotationLoop();
  },
};

module.exports = workers;
