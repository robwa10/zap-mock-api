/*
 * Primary file for the API
 *
 */

// Dependencies
const http = require('http');
const url = require('url');

// Server responds with a string
const server = http.createServer((req, res) => {

  // Get the url and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Send the response
  res.end('Hello World\n');

  // Log the request path
  console.log('Request received on path: ' + trimmedPath);

});

// Start the server on port 3000
server.listen(3000, () => (console.log('Listening on port 3000.')));
