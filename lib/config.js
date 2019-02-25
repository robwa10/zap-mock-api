'use strict';

/*
 * Create and export config variables
 *
 */

const environments = {
  // Staging (default) environment
  staging: {
    envName: 'Staging',
    hashingSecret: 'thisIsASecrect',
    httpPort: 3000,
    httpsPort: 3001,
  },
  // Production environment
  production: {
    envName: 'Production',
    hashingSecret: 'thisIsAlsoASecrect',
    httpPort: 5000,
    httpsPort: 5001,
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
