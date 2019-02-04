'use strict';

/*
 * Helpers for various tasks
 *
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');

const helpers = {

  // Create a string of random alphanumeric characters
  createRandomString: strLength => {
    strLength = typeof(strLength) === 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
      // Define all characters that could go into a string
      const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let str = '';

      // Construct the string
      for(let i = 1; i <= strLength; i++) {
        // Get a random character
        let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        // Append the character to str
        str += randomCharacter;
      }

      // Return the final string
      return str

    } else {
      return false
    }
  },

  // Create a SHA256 hash
  hash: str => {
    if (typeof(str) === 'string' && str.length > 0) {
      const hmac = crypto.createHmac('sha256', config.hashingSecret);
      const hash = hmac.update(str).digest('hex');
      return hash
    } else {
      return false
    }
  },

  // Parse a JSON string to an object in all cases, without throwing
  parseJsonToObject: function (str) {
    try {
      const obj = JSON.parse(str);
      return obj;
    } catch (e) {
      return {};
    }
  },

  sendTwilioSms: (phone, msg, callback) => {
    // Validate params
    phone = typeof(phone) === 'string' && phone.trim().length === 10 ? phone.trim(): false;
    msg = typeof(msg) === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

    if (phone && msg) {
      // Configure the request payload
      const payload = {
        From: config.twilio.fromPhone,
        To: '+1'+phone,
        Body: msg
      };

      const stringyPayload = querystring.stringify(payload);

      // Configure the request details
      const requestDetails = {
        protocol: 'https:',
        hostname: 'api.twilio.com',
        method: 'POST',
        path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
        auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(stringyPayload),
        }
      };

      // Instantiate the request object
      const req = https.request(requestDetails, res => {
        const status = res.statusCode;
        if (status === 200 || status === 201) {
          callback(false);
        } else {
          callback(`Status code returned was ${status}.`)
        }
      });

      // Bind to an error event
      req.on('error', e => callback(e));

      // Add the payload
      req.write(stringyPayload);

      // End the request
      req.end();

    } else {
      callback('Supplied parameters are missing or invalid.')
    }
  }
};

module.exports = helpers;
