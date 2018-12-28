/*
 * Primary file for the API
 *
 */

// Dependencies
const http = require('http');
const StringDecoder = require('string_decoder').StringDecoder;
const url = require('url');

// Server responds with a string
const server = http.createServer((req, res) => {

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
    const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to the handler
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      'payload': buffer
    };

    // Route the request to correct handler
    chosenHandler(data, (statusCode, payload) => {
      // Use the handler status code or default to 200
      statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

      // Use the handler payload or an empty object
      payload = typeof(payload) === 'object' ? payload : {};

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload)

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the request path
      console.log('Returning this response:', statusCode, payload);

    });
  });
});

// Start the server on port 3000
server.listen(3000, () => (console.log('Listening on port 3000.')));

// Handlers
const handlers = {
  'sample': (data, callback) => (callback(200, {'name': 'sample handler'})),
  'notFound': (data, callback) => (callback(404))
};

// Define a request router
const router = {
  'sample': handlers.sample
};
