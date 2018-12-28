/*
 * Create and export config variables
 *
 */
'use strict';

const environments = {
  // Staging (default) environment
  'staging': {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'Staging'
  },
  // Production environment
  'production': {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'Production'
  }
};

// Determine which env was called
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Validate env requested is defined, default to staging
const envToExport = typeof(environments[currentEnvironment]) === ' object' ? environments[currentEnvironment] : environments.staging;

module.exports = envToExport;
