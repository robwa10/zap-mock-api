/*
 * Create and export config variables
 *
 */
'use strict';

const environments = {
  // Staging (default) environment
  'staging': {
    'port': 3000,
    'envName': 'Staging'
  },
  // Production environment
  'production': {
    'port': 5000,
    'envName': 'Production'
  }
};

// Determine which env was called
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Validate env requested is defined, default to staging
const envToExport = typeof(environments[currentEnvironment]) === ' object' ? environments[currentEnvironment] : environments.staging;

module.exports = envToExport;
