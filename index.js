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

    // Send the response
    res.end('Hello World\n');

    // Log the request path
    console.log('Request with this payload:', buffer);

  });
});

// Start the server on port 3000
server.listen(3000, () => (console.log('Listening on port 3000.')));
