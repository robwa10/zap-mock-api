'use strict';

/*
 * Create and export config variables
 *
 */

const environments = {
  // Staging (default) environment
  staging: {
    checksInterval: 1000 * 60,
    envName: 'Staging',
    hashingSecret: 'thisIsASecrect',
    httpPort: 3000,
    httpsPort: 3001,
    maxChecks: 5,
    twilio: {
      accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
      authToken: '9455e3eb3109edc12e3d8c92768f7a67',
      fromPhone: '+15005550006',
    },
  },
  // Production environment
  production: {
    checksInterval: 1000 * 60,
    envName: 'Production',
    hashingSecret: 'thisIsAlsoASecrect',
    httpPort: 5000,
    httpsPort: 5001,
    maxChecks: 5,
    twilio: {
      accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
      authToken: '9455e3eb3109edc12e3d8c92768f7a67',
      fromPhone: '+15005550006',
    },
  },
};

// Determine which env was called
const currentEnvironment =
  typeof process.env.NODE_ENV === 'string'
    ? process.env.NODE_ENV.toLowerCase()
    : '';

// Validate env requested is defined, default to staging
const envToExport =
  typeof environments[currentEnvironment] === ' object'
    ? environments[currentEnvironment]
    : environments.staging;

module.exports = envToExport;
