'use strict';

/*
 * Primary file for the API
 *
 */

// Dependencies
const server = require('./lib/server');

const App = {
  init: () => {
    // Start the server
    server.init();
  },
};

App.init();

module.exports = App;
