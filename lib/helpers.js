'use strict';

/*
 * Helpers for various tasks
 *
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');

const helpers = {

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
