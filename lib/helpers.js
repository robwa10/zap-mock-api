'use strict';

/*
 * Helpers for various tasks
 *
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');

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
};

module.exports = helpers;
