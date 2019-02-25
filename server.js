'use strict';

/*
 * Server related tasks
 *
 */

// Dependencies
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

const apiRoutes = {
  helpText:
    'This is a lightweight API for using when learning how to build a Zapier CLI app. Only GET requests are allowed. All requiredData or optionalData is assumed to be query params.',
  endpoints: {
    spreadsheet: {
      endpoint: '/spreadsheet',
      requiredData: 'none',
      optionalData: 'none',
      returns: 'An array of objects.',
    },
    worksheet: {
      endpoint: '/worksheet',
      requiredData: ['id'],
      optionalData: 'none',
      returns: 'An array of objects.',
    },
    records: {
      endpoint: '/records',
      requiredData: ['id'],
      optionalData: 'none',
      returns: 'An array of objects.',
    },
  },
};

const server = {
  // Init script
  init: () => {
    app.get('/', (req, res) => res.send(apiRoutes));

    app.get('/spreadsheet', (req, res) => {
      const spreadsheetData = {
        data: [
          { id: '1234spreadsheet', name: 'Zap Spreadsheet 1' },
          { id: '5678spreadsheet', name: 'Zap Spreadsheet 2' },
        ],
      };
      res.send(spreadsheetData);
    });

    app.get('/worksheet', (req, res) => {
      const worksheetData = {
        data: [
          { id: '1234worksheet', name: 'Zap Worksheet 1' },
          { id: '5678worksheet', name: 'Zap Worksheet 2' },
        ],
      };

      const id = req.query.id;

      if (id) {
        if (id === '1234spreadsheet' || id === '5678spreadsheet') {
          res.send(worksheetData);
        } else {
          res.status(404);
          res.send({ Error: 'Spreadsheet not found.' });
        }
      } else {
        res.status(400);
        res.send({ Error: 'Missing required spreadsheet id.' });
      }
    });

    app.get('/records', (req, res) => {
      const records = {
        records: [
          {
            id: 'stanleegenecolan',
            fields: {
              Email: 'steverodgers@marvel.com',
              Name: 'Captain America',
            },
            created: '1941-03-01T00:00:00.000Z',
          },
          {
            id: 'joesimonjackkirby',
            fields: { Email: 'mar-vell@marvel.com', Name: 'Captain Marvel' },
            created: '1967-12-01T00:00:00.000Z',
          },
        ],
      };

      const id = req.query.id;

      if (id) {
        if (id === '1234worksheet' || id === '5678worksheet') {
          res.send(records);
        } else {
          res.status(404);
          res.send({ Error: 'Worksheet not found.' });
        }
      } else {
        res.status(400);
        res.send({ Error: 'Missing required worksheet id.' });
      }
    });

    app.listen(port, () =>
      console.log(`Example app listening on port ${port}!`)
    );
  },
};

module.exports = server;
