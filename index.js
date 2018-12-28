/*
 * Primary file for the API
 *
 */

// Dependencies
const http = require('http');

// Server responds with a string
const server = http.createServer((req, res) => (res.end('Hello World\n')));

// Start the server on port 3000
server.listen(3000, () => (console.log('Listening on port 3000.')))
