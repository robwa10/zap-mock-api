'use strict';

/*
 * Request Handlers
 *
 */

// Dependencies
const config = require('./config');
const helpers = require('./helpers');

// Handlers
const handlers = {
  notFound: (data, callback) => callback(404),
  ping: (data, callback) => callback(200),
  records: (data, callback) => {
    const acceptableMethods = ['GET'];
    if (acceptableMethods.indexOf(data.method) > -1) {
      handlers._records[data.method](data, callback);
    } else {
      callback(405);
    }
  },
  worksheet: (data, callback) => {
    const acceptableMethods = ['GET'];
    if (acceptableMethods.indexOf(data.method) > -1) {
      handlers._worksheet[data.method](data, callback);
    } else {
      callback(405);
    }
  },
  spreadsheet: (data, callback) => {
    const acceptableMethods = ['GET'];
    if (acceptableMethods.indexOf(data.method) > -1) {
      handlers._spreadsheet[data.method](data, callback);
    } else {
      callback(405);
    }
  },
};

handlers._records = {
  // GET
  // Required data: id
  // Optional data: none
  GET: (data, callback) => {
    const records = {
      records: [
        {
          id: 'stanleegenecolan',
          fields: { Email: 'steverodgers@marvel.com', Name: 'Captain America' },
          created: '1941-03-01T00:00:00.000Z',
        },
        {
          id: 'joesimonjackkirby',
          fields: { Email: 'mar-vell@marvel.com', Name: 'Captain Marvel' },
          created: '1967-12-01T00:00:00.000Z',
        },
      ],
    };
    // Check that the id is valid
    const id =
      typeof data.queryStringObject.id === 'string' &&
      data.queryStringObject.id.trim().length === 13
        ? data.queryStringObject.id.trim()
        : false;

    if (id) {
      if (id === '1234worksheet' || id === '5678worksheet') {
        callback(200, records);
      } else {
        callback(404, { Error: 'Incorrect Worksheet id.' });
      }
    } else {
      callback(400, { Error: 'Missing required Worksheet id.' });
    }
  },
};

handlers._worksheet = {
  // GET
  // Required data: id
  // Optional data: none
  GET: (data, callback) => {
    const worksheetData = {
      data: [
        { id: '1234worksheet', name: 'Zap Worksheet 1' },
        { id: '5678worksheet', name: 'Zap Worksheet 2' },
      ],
    };

    // Check that the id is valid
    const id =
      typeof data.queryStringObject.id === 'string' &&
      data.queryStringObject.id.trim().length === 15
        ? data.queryStringObject.id.trim()
        : false;

    if (id) {
      if (id === '1234spreadsheet' || id === '5678spreadsheet') {
        callback(200, worksheetData);
      } else {
        callback(404, { Error: 'Incorrect spreadsheet id.' });
      }
    } else {
      callback(400, { Error: 'Missing required spreadsheet id.' });
    }
  },
};

handlers._spreadsheet = {
  // Users - GET
  // Required data: none
  // Optional data: none
  GET: (data, callback) => {
    const spreadsheetData = {
      data: [
        { id: '1234spreadsheet', name: 'Zap Spreadsheet 1' },
        { id: '5678spreadsheet', name: 'Zap Spreadsheet 2' },
      ],
    };
    callback(200, spreadsheetData);
  },
};

// Export Handlers
module.exports = handlers;
