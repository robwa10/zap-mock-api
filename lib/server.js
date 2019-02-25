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

    app.get('/spreadsheet', (req, res) => {
      const spreadsheetData = {
        data: [
          { id: '1234spreadsheet', name: 'Zap Spreadsheet 1' },
          { id: '5678spreadsheet', name: 'Zap Spreadsheet 2' },
        ],
      };
      res.send(spreadsheetData);
    });

    app.listen(port, () =>
      console.log(`Example app listening on port ${port}!`)
    );
  },
};

module.exports = server;
