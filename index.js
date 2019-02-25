'use strict';

/*
 * Primary file for the API
 *
 */

// Dependencies
const server = require('./server');

const App = {
  init: () => {
    // Start the server
    server.init();
  },
};

App.init();

module.exports = App;
