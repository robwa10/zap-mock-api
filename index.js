'use strict';

/*
 * Primary file for the API
 *
 */

// Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');

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
