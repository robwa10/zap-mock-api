/*
 * Request Handlers
 *
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");

// Handlers
const handlers = {
  notFound: (data, callback) => callback(404),
  ping: (data, callback) => callback(200),
  users: (data, callback) => {
    const acceptableMethods = ["POST", "GET", "PUT", "DELETE"];
    if (acceptableMethods.indexOf(data.method) > -1) {
      handlers._users[data.method](data, callback);
    } else {
      callback(405);
    }
  }
};

// Container for users submethods
handlers._users = {};

// Users - GET
// Required data: phone
// Optional data: none
// @TODO Only let authed user access only their object
handlers._users.GET = (data, callback) => {
  // Check that the phone is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' &&
  data.queryStringObject.phone.trim().length === 10
    ? data.queryStringObject.phone.trim()
    : false;
    if (phone) {
      // Lookup the user
      _data.read('users', phone, (err, userData) => {
        if (!err && userData) {
          // Remove hashed password
          delete userData.hashedPassword;
          callback(200, userData);
        } else {
          callback(404, { 'Error': 'User not found.' });
        }
      });
    } else {
      callback(400, {'Error': 'Missing required field.'})
    }
};

// Users - POST
// Required data: password, lastName, phone, tosAgreement
// Optional data: none
handlers._users.POST = (data, callback) => {
  // Check that all required fields are filled out correctly
  const firstName =
    typeof data.payload.firstName === "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName === "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone.trim()
      : false;

  const password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  const tosAgreement =
    typeof data.payload.tosAgreement === "boolean" &&
    data.payload.tosAgreement === true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the user doesn't already exist
    _data.read("users", phone, (err, data) => {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);

        // Create the user object
        if (hashedPassword) {
          const userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            "tosAgreement": true,
          };

          // Store the user
          _data.create("users", phone, userObject, (err) => {
            if (!err) {
              callback(200, { firstName, lastName, phone });
            } else {
              console.log(err);
              callback(500, {"Error" : "Could not create the new user."})
            }
          });
        } else {
          callback(500, {"Error": "Could not hash the password."})
        }

      } else {
        // User already exists
        callback(400, { "Error": "User with that phone number already exists." });
      }
    });
  } else {
    callback(400, { "Error": "Missing required fields." });
  }
};

// Users - PUT
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO Only let authed user access only their object
handlers._users.PUT = (data, callback) => {
  // Check for the required field
  const phone = typeof(data.payload.phone) === 'string' &&
  data.payload.phone.trim().length === 10
    ? data.payload.phone.trim()
    : false;

  // Check for optional fields
  const firstName =
    typeof data.payload.firstName === "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName === "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  // Error if the phone is invalid
  if (phone) {
    // Error if nothing is sent to update
    if (firstName || lastName || password) {
      // Lookup the user
      _data.read('users', phone, (err, userData) => {
        if (!err && userData) {
          // Update the fields
          if (firstName) {
            userData.firstName = firstName;
          }
          if (lastName) {
            userData.lastName = lastName;
          }
          if (password) {
            userData.hashedPassword = helpers.hash(password);
          }

          // Store the new data
          _data.update('users', phone, userData, err => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {'Error': 'Server error.'});
            }
          });
        } else {
          callback(404, {'Error': 'The specified user does not exist.'})
        }
      });
    } else {
      callback(400, { 'Error': "Missing fields to update." });
    }
  } else {
    callback(400, { 'Error': "Missing required fields." });
  }
};

// Users - DELETE
// Required field: phone
// @TODO Only let authed user access only their object
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.DELETE = (data, callback) => {
  // Check phone is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' &&
  data.queryStringObject.phone.trim().length === 10
    ? data.queryStringObject.phone.trim()
    : false;
    if (phone) {
      // Lookup the user
      _data.read('users', phone, (err, userData) => {
        if (!err && userData) {
          _data.delete('users', phone, err => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { 'Error': 'Could not delete user.'})
            }
          });
        } else {
          callback(404, {'Error': 'User not found.'});
        }
      });
    } else {
      callback(400, {'Error': 'Missing required field.'})
    }
};

// Export Handlers
module.exports = handlers;
