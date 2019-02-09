'use strict';

/*
 * Library for stroring and editing data
 *
 */

// Dependencies
const fs = require('fs');
const helpers = require('../lib/helpers');
const path = require('path');

const lib = {
  // Base directory of the data folder
  baseDir: path.join(__dirname, '/../.data/'),

  // Write data to a file
  create: (dir, filename, data, callback) => {
    // Open the file for writing
    fs.open(
      `${lib.baseDir}${dir}/${filename}.json`,
      'wx',
      (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
          // Convert data to a string
          const stringData = JSON.stringify(data);

          // Write to file and close
          fs.writeFile(fileDescriptor, stringData, err => {
            if (!err) {
              fs.close(fileDescriptor, err => {
                if (!err) {
                  callback(false);
                } else {
                  callback('Error closing new file.');
                }
              });
            } else {
              callback('Error writing new file.');
            }
          });
        } else {
          callback('Could not create a new file, it may already exist.');
        }
      }
    );
  },

  // Read data from a file
  read: (dir, filename, callback) => {
    fs.readFile(
      `${lib.baseDir}${dir}/${filename}.json`,
      'utf8',
      (err, data) => {
        if (!err && data) {
          const parsedData = helpers.parseJsonToObject(data);
          callback(false, parsedData);
        } else {
          callback(err, data);
        }
      }
    );
  },

  // Update a file with new data
  update: (dir, filename, data, callback) => {
    // Open the file for writing
    fs.open(
      `${lib.baseDir}${dir}/${filename}.json`,
      'r+',
      (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
          // Convert data to a string
          const stringData = JSON.stringify(data);

          // Truncate the contents
          fs.truncate(fileDescriptor, err => {
            if (!err) {
              // Write to the file and close it
              fs.writeFile(fileDescriptor, stringData, err => {
                if (!err) {
                  fs.close(fileDescriptor, err => {
                    if (!err) {
                      callback(false);
                    } else {
                      callback('Error closing file.');
                    }
                  });
                } else {
                  callback('Error writing to existing file.');
                }
              });
            } else {
              callback('Error truncating file.');
            }
          });
        } else {
          callback('Could not open the file for updating, it may not exist.');
        }
      }
    );
  },

  // Delete a file
  delete: (dir, filename, callback) => {
    fs.unlink(`${lib.baseDir}${dir}/${filename}.json`, err => {
      if (!err) {
        callback(false);
      } else {
        callback('Error deleting file.');
      }
    });
  },

  // List all items in a directory
  list: (dir, callback) => {
    fs.readdir(`${lib.baseDir}${dir}/`, (err, data) => {
      if (!err && data && data.length > 0) {
        let trimmedFileName = [];
        data.forEach(fileName => {
          trimmedFileName.push(fileName.replace('.json', ''));
        });
        callback(false, trimmedFileName);
      } else {
        callback(err, data);
      }
    });
  },
};

module.exports = lib;
