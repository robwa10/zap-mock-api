'use strict';

/*
 * Server related tasks
 *
 */

// Dependencies
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const http = require('http');
const https = require('https');
const path = require('path');
const StringDecoder = require('string_decoder').StringDecoder;
const url = require('url');

const httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
};

// Define a request router
const router = {
  checks: handlers.checks,
  ping: handlers.ping,
  tokens: handlers.tokens,
  users: handlers.users,
};

const server = {
  // Unified server logic
  unifiedServer: (req, res) => {
    // Get the url and parse it
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    const queryStringObject = parsedUrl.query;

    // Get the HTTP method
    const method = req.method.toUpperCase();

    // Get the headers as an object
    const headers = req.headers;

    // Get the payload
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', data => {
      buffer += decoder.write(data);
    });
    req.on('end', () => {
      buffer += decoder.end();

      // Choose the handler. Default to notFound
      const chosenHandler =
        typeof router[trimmedPath] !== 'undefined'
          ? router[trimmedPath]
          : handlers.notFound;

      // Construct the data object to send to the handler
      const data = {
        trimmedPath,
        queryStringObject,
        method,
        headers,
        payload: helpers.parseJsonToObject(buffer),
      };

      // Route the request to correct handler
      chosenHandler(data, (statusCode, payload) => {
        // Use the handler status code or default to 200
        statusCode = typeof statusCode === 'number' ? statusCode : 200;

        // Use the handler payload or an empty object
        payload = typeof payload === 'object' ? payload : {};

        // Convert the payload to a string
        const payloadString = JSON.stringify(payload);

        // Return the response
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(payloadString);

        // Log the request path
        console.log('Returning this response:', statusCode, payload);
      });
    });
  },

  // Instantiate the HTTP server
  httpServer: http.createServer((req, res) => {
    server.unifiedServer(req, res);
  }),

  // Instantiate the HTTPS server
  httpsServer: https.createServer(httpsServerOptions, (req, res) => {
    server.unifiedServer(req, res);
  }),

  // Init script
  init: () => {
    // Start the HTTP server
    server.httpServer.listen(config.httpPort, () =>
      console.log(`Listening on port ${config.httpPort}.`)
    );

    // Start the HTTPS server
    server.httpsServer.listen(config.httpsPort, () =>
      console.log(`Listening on port ${config.httpsPort}.`)
    );
  },
};

module.exports = server;
