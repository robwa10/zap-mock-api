'use strict';

/*
 * Library for storing and rotating log files
 *
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const lib = {
  baseDir: path.join(__dirname, '/../.logs/'),

  // Append a string to a file; create if it doesn't exist.
  append: (fileName, str, callback) => {
    // Open the file
    fs.open(`${lib.baseDir}${fileName}.log`, 'a', (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // Append to the file and close it
        fs.appendFile(fileDescriptor, `${str}\n`, err => {
          if (!err) {
            fs.close(fileDescriptor, err => {
              if (!err) {
                callback(false);
              } else {
                callback('Error closing file that was being appended.');
              }
            });
          } else {
            callback('Error appending to file.');
          }
        });
      } else {
        callback('Could not open file for appending.');
      }
    });
  },

  compress: (logId, newFileId, callback) => {
    const sourceFile = `${logId}.log`;
    const destFile = `${newFileId}.gz.b64`;

    // Read the source file
    fs.readFile(`${lib.baseDir}${sourceFile}`, 'utf8', (err, inputString) => {
      if (!err && inputString) {
        // Compress the data using gzip
        zlib.gzip(inputString, (err, buffer) => {
          if (!err && buffer) {
            // Send the compressed data to the destination file
            fs.open(
              `${lib.baseDir}${destFile}`,
              'wx',
              (err, fileDescriptor) => {
                if (!err && fileDescriptor) {
                  // Write to the destination file
                  fs.writeFile(
                    fileDescriptor,
                    buffer.toString('base64'),
                    err => {
                      if (!err) {
                        fs.close(fileDescriptor, err => {
                          if (!err) {
                            callback(false);
                          } else {
                            callback(err);
                          }
                        });
                      } else {
                        callback(err);
                      }
                    }
                  );
                } else {
                  callback(err);
                }
              }
            );
          } else {
            callback(err);
          }
        });
      } else {
        callback(err);
      }
    });
  },

  // Decompress the contents of a .gz.b64 file into a string variable
  decompress: (fileId, callback) => {
    const fileName = `${fileId}.gz.b64`;
    fs.readFile(`${lib.baseDir}${fileName}`, 'utf8', (err, str) => {
      if (!err && str) {
        // Decompress the data
        const inputBuffer = Buffer.from(str, 'base64');
        zlib.unzip(inputBuffer, (err, outputBuffer) => {
          if (!err && outputBuffer) {
            const string = outputBuffer.toString();
            callback(false, string);
          } else {
            callback(err);
          }
        });
      } else {
        callback(err);
      }
    });
  },

  // List all the logs, optionally include the compressed logs
  list: (includeCompressedLogs, callback) => {
    fs.readdir(lib.baseDir, (err, data) => {
      if (!err && data && data.length > 0) {
        let trimmedFileNames = [];
        data.forEach(fileName => {
          // Add the .log files
          if (fileName.indexOf('.log') > -1) {
            trimmedFileNames.push(fileName.replace('.log', ''));
          }

          // Add on the .gz files
          if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
            trimmedFileNames.push(fileName.replace('.gz.b64', ''));
          }
        });
        callback(false, trimmedFileNames);
      } else {
        callback(false);
      }
    });
  },

  // Truncating log files
  truncate: (logId, callback) => {
    fs.truncate(`${lib.baseDir}${logId}.log`, 0, err => {
      if (!err) {
        callback(false);
      } else {
        callback(err);
      }
    });
  },
};

module.exports = lib;
