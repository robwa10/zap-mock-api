'use strict';

/*
 * Server related tasks
 *
 */

// Dependencies
const express = require('express');
const handlers = require('./handlers');

const app = express();
const port = process.env.PORT || 3000;

// Define a request router
const router = {
  spreadsheet: handlers.spreadsheet,
  ping: handlers.ping,
  worksheet: handlers.worksheet,
  records: handlers.records,
};

const server = {
  // Init script
  init: () => {
    app.get('/', (req, res) => res.send('Hello World!'));

    app.listen(port, () =>
      console.log(`Example app listening on port ${port}!`)
    );
  },
};

module.exports = server;
