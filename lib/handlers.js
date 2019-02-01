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
  tokens: (data, callback) => {
    const acceptableMethods = ["POST", "GET", "PUT", "DELETE"];
    if (acceptableMethods.indexOf(data.method) > -1) {
      handlers._tokens[data.method](data, callback);
    } else {
      callback(405);
    }
  },
  users: (data, callback) => {
    const acceptableMethods = ["POST", "GET", "PUT", "DELETE"];
    if (acceptableMethods.indexOf(data.method) > -1) {
      handlers._users[data.method](data, callback);
    } else {
      callback(405);
    }
  }
};


// Tokens handler submethods
handlers._tokens = {

  // POST
  // Required data: phone, password
  // Optional data: none
  POST: (data, callback) => {
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

    if (phone && password) {
      // Lookup the user who matches the phone number
      _data.read('users', phone, (err, userData) => {
        if (!err && userData) {
          // Hash the sent password and compare with stored password
          const hashedPassword = helpers.hash(password);
          if (hashedPassword === userData.hashedPassword) {
            // If valid, create a new token. Set expiration date to one hour in the future.
            const tokenId = helpers.createRandomString(20);
            const expires = Date.now() + 1000 * 60 * 60;
            const tokenObject = {
              phone,
              id: tokenId,
              expires
            };
            // Store the token
            _data.create('tokens', tokenId, tokenObject, err => {
              if (!err) {
                callback(200, tokenObject);
              } else {
                callback(500, {'Error': 'Server error creating token.'});
              }
            })
          } else {
            callback(400, {'Error': 'Password invalid.'});
          }
        } else {
          callback(404, {'Error': 'User not found.'});
        }
      });
    } else {
      callback(400, {'Error': 'Missing required fields.'});
    }
  },

  // GET
  // Required data: id
  // Optional data: none
  GET: (data, callback) => {
    // Check that the id is valid
    const id = typeof(data.queryStringObject.id) === 'string' &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id.trim()
      : false;

      if (id) {
        // Lookup the token
        _data.read('tokens', id, (err, tokenData) => {
          if (!err && tokenData) {
            callback(200, tokenData);
          } else {
            callback(404);
          }
        });
      } else {
        callback(400, {'Error': 'Missing required field.'})
      }
  },

  // PUT
  // Required data: id, extend
  // Optional data: none
  PUT: (data, callback) => {
    const id = typeof(data.payload.id) === 'string' &&
    data.payload.id.trim().length === 20
      ? data.payload.id.trim()
      : false;
    const extend = typeof(data.payload.extend) === 'boolean' &&
    data.payload.extend === true
      ? true
      : false;

    if (id && extend) {
      // Lookup the token
      _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
          // Check the token isn't expired
          if (tokenData.expires > Date.now()) {
            // Set the expiration an hour from now
            tokenData.expires = Date.now() + 1000 * 60 * 60;

            //Store the new expiry date
            _data.update('tokens', id, tokenData, err => {
              if (!err) {
                callback(200);
              } else {
                callback(500, {'Error': 'Could not update token expiration.'})
              }
            });
          } else {
            callback(400, {'Error': 'The token has expired.'})
          }
        } else {
          callback(400, {'Error': 'Specified token does not exist.'});
        }
      });
    } else {
      callback(400, {'Error': 'Missing required field(s) or payload invalid.'});
    }
  },

  // DELETE
  // Required data: id
  // Optional data: none
  DELETE: (data, callback) => {
    // Check that the id is valid
    const id = typeof(data.queryStringObject.id) === 'string' &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id.trim()
      : false;
      if (id) {
        // Lookup the user
        _data.read('tokens', id, (err, userData) => {
          if (!err && userData) {
            _data.delete('tokens', id, err => {
              if (!err) {
                callback(200);
              } else {
                callback(500, { 'Error': 'Could not delete token.'})
              }
            });
          } else {
            callback(404, {'Error': 'Token not found.'});
          }
        });
      } else {
        callback(400, {'Error': 'Missing required field.'})
      }
  },

  // Token verification method
  verifyToken: (id, phone, callback) => {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      !err && tokenData
        // Check that the token is for the given user and has not expired
        ? tokenData.phone === phone && tokenData.expires > Date.now()
          ? callback(true)
          : callback(false)
        : callback(false);
    });
  }
};



/*
 * Users handler submethods
 *
 */

// Container for users submethods
handlers._users = {};

// Users - GET
// Required data: phone
// Optional data: none
handlers._users.GET = (data, callback) => {
  // Check that the phone is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' &&
  data.queryStringObject.phone.trim().length === 10
    ? data.queryStringObject.phone.trim()
    : false;

  if (phone) {
    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
    // Verify the token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, tokenIsValid => {
      if (tokenIsValid) {
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
        callback(403, {'Error': 'Token invalid.'});
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
handlers._users.PUT = (data, callback) => {
  // Get the token from the headers
  const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

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

    // Verify the token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, tokenIsValid => {
      if (tokenIsValid) {

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
        callback(403, {'Error': 'Token invalid.'});
      }
    });
  } else {
    callback(400, { 'Error': "Missing required fields." });
  }
};

// Users - DELETE
// Required field: phone
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.DELETE = (data, callback) => {
  // Get the token from the headers
  const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

  // Verify the token is valid for the phone number
  handlers._tokens.verifyToken(token, phone, tokenIsValid => {
    if (tokenIsValid) {
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
    } else {
      callback(403, {'Error': 'Token invalid.'});
    }
  });
};

// Export Handlers
module.exports = handlers;
