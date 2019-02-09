/*
 * Primary file for the API
 *
 */

'use strict';

// Dependencies
const server = require('./lib/server');
const workers = require('./lib/server');

const App = {
  init: () => {
    // Start the server
    server.init();

    // Start the background workers
    workers.init();
  },
};

App.init();

module.exports = App;
