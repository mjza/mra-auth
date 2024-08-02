const { Sequelize, closeSequelize, fn, col, MraUsers, MraUserDetails, MraTokenBlacklist, MraAuditLogsAuthentication, CasbinRule, MraTables, MraUserCustomers, MraStatuses, MraTickets, MraSubscriptions } = require('../models');
const { decrypt } = require('./converters');

/**
 * Closes the database connection pool.
 */
const closeDBConnections = async () => {
  await closeSequelize();
};

/**
 * Inserts a new token into the blacklist database.
 *
 * @param {Object} tokenData - The token data object { token, expiry } containing token and expiry.
 * @returns {Object} The inserted token data object.
 */
const insertBlacklistToken = async (tokenData) => {
  const { token, expiry } = tokenData;
  if (!token || !token.trim()) {
    return null;
  }

  const insertedToken = await MraTokenBlacklist.create({
    token: token.trim(),
    expiry
  });

  insertedToken.expiry = parseInt(insertedToken.expiry, 10);
  return insertedToken;
};

/**
 * Checks if a token is expired by looking it up in the blacklist table.
 *
 * @param {string} token - The token to check for expiration.
 * @returns {Promise<boolean>} True if the token is expired (present in the blacklist), otherwise false.
 */
const isTokenBlacklisted = async (token) => {
  if (!token || !token.trim())
    return true;
  const tokenCount = await MraTokenBlacklist.count({
    where: {
      token: token.trim(),
    },
  });
  return tokenCount > 0;
};

/**
 * Inserts a new audit log into the database.
 *
 * @param {Object} log - The log object { methodRoute, req, comments, ipAddress, userId } containing methodRoute, req, comment, ipAddress, and userId.
 * @returns {Object} The inserted log object.
 */
const insertAuditLog = async (log) => {
  const { methodRoute, req, comments, ipAddress, userId } = log;
  const insertedLog = await MraAuditLogsAuthentication.create({
    method_route: methodRoute,
    req,
    ip_address: ipAddress,
    comments: comments || '',
    user_id: userId,
  });
  return insertedLog && insertedLog.get({ plain: true });
};

/**
 * Updates an existing audit log in the database.
 *
 * @param {Object} log - The log object { logId, comments } containing logId, methodRoute, req, comment, ipAddress, and userId.
 * @returns {Object} The updated log object.
 */
const updateAuditLog = async (log) => {
  const { logId, comments } = log;
  if (isNaN(logId))
    return null;
  const [updateCount, updatedLogs] = await MraAuditLogsAuthentication.update({
    comments: comments,
  }, {
    where: {
      log_id: logId
    },
    returning: true,
  });

  return updateCount === 0 ? null : updatedLogs[0].get({ plain: true });
};

/**
 * Deletes a test audit log from the database.
 *
 * @param {number} logId - The ID of the log to be deleted.
 * @returns {Object} An object indicating the success of the deletion.
 */
const deleteAuditLog = async (logId) => {
  if (isNaN(logId))
    return { success: false };

  const deleteCount = await MraAuditLogsAuthentication.destroy({
    where: {
      method_route: {
        [Sequelize.Op.like]: 'TEST %',
      },
      log_id: logId
    }
  });
  return { success: deleteCount > 0 };
};

/**
 * Fetches the private profile picture URL for a user from the database using Sequelize models.
 *
 * @param {number} userId - The ID of the user whose private profile picture URL is to be fetched.
 * @returns {Promise<string|null>} The decrypted private profile picture URL if it exists, otherwise null.
 * @throws {Error} If there is an issue fetching data from the database.
 *
 */
async function getUserPrivatePictureUrl(userId) {
  const userDetails = await MraUserDetails.findOne({
    where:{ user_id: userId},
    attributes: ['private_profile_picture_url'],
  });

  if(userDetails) {
    const privateProfilePictureUrl =  userDetails.get({ plain: true }).private_profile_picture_url;
    return privateProfilePictureUrl && decrypt(privateProfilePictureUrl);
  }
  return null;
}

/**
 * Deletes a user from the database based on the provided username.
 *
 * @param {string} username - The username of the user to be deleted.
 * @returns {Object|null} The deleted user object if successful, null if no user was found or deleted.
 */
const deleteUserByUsername = async (username) => {
  if (!username || !username.trim())
    return null;

  const user = await MraUsers.findOne({ where: { username: username.trim().toLowerCase() } });
  if (!user) {
    return null;
  }

  await MraUsers.destroy({
    where: {
      username: username.trim().toLowerCase(),
    },
  });

  return user && user.get({ plain: true });
};

/**
 * Retrieves a user from the database based on the provided username.
 *
 * @param {string} username - The username of the user to retrieve.
 * @returns {Object|null} The user object if found, null otherwise.
 */
const getUserByUsername = async (username) => {
  if (!username || !username.trim()) {
    return null;
  }
  const user = await MraUsers.findOne({
    where: { username: username.trim().toLowerCase() }
  });

  return user && user.get({ plain: true });
};

/**
 * Retrieves a user from the database based on the provided username or email.
 *
 * @param {string} usernameOrEmail - The username or email of the user to retrieve.
 * @returns {Object|null} The user object if found, null otherwise.
 */
const getUserByUsernameOrEmail = async (usernameOrEmail) => {
  if (!usernameOrEmail || !usernameOrEmail.trim())
    return null;
  const users = await MraUsers.findAll({
    where: {
      [Sequelize.Op.or]: [
        { username: usernameOrEmail.trim().toLowerCase() },
        { email: usernameOrEmail.trim().toLowerCase() }
      ]
    }
  });

  if (users.length === 0) {
    return null; // No users found with the given email
  }

  return users && users.map(user => user.get({ plain: true }));
};

/**
 * Retrieves all deactivated but not suspended users from the database
 * based on the provided username or email.
 *
 * @param {string} usernameOrEmail - The username or email of the user to retrieve.
 * @returns {Array<Object>} An array of user objects if found, otherwise an empty array.
 */
const getDeactivatedNotSuspendedUsers = async (usernameOrEmail) => {
  if (!usernameOrEmail || !usernameOrEmail.trim()) return [];

  const users = await MraUsers.findAll({
    attributes: ['username', 'email', 'activation_code', 'display_name'], // Select username and email fields
    where: {
      [Sequelize.Op.and]: [
        {
          [Sequelize.Op.or]: [
            { username: usernameOrEmail.trim().toLowerCase() },
            { email: usernameOrEmail.trim().toLowerCase() }
          ]
        },
        { confirmation_at: null }, // Deactivated users
        { suspended_at: null }     // Not suspended users
      ]
    }
  });

  return users.map(user => user.get({ plain: true }));
};

/**
 * Updates the updated_at timestamp to the current time for a deactivated and not suspended user in the database.
 * It is needed for giving 5 days timeframe to the user to be able to activate their account.
 *
 * @param {string} username - The intended username.
 * @returns {boolean} True if the updated_at timestamp was successfully updated, false otherwise.
 */
const updateUserUpdatedAtToNow = async (username) => {
  if (!username || !username.trim())
    return false;

  // Update the updated_at timestamp to the current time if the activation code matches
  const [updateCount] = await MraUsers.update(
    { updated_at: Sequelize.literal("now()") }, // Set updated_at to the current time
    {
      where: {
        username: username.trim().toLowerCase(),
        confirmation_at: null, // confirmation_at IS NULL
        suspended_at: null ,   // Not suspended users
      },
      returning: true, // This option is specific to PostgreSQL
    }
  );

  return updateCount > 0; // Returns true if at least one row was updated
};


/**
 * Retrieves all usernames from the database based on the provided email.
 *
 * @param {string} email - The email of the user to retrieve.
 * @returns {Object|null} The user object if found, null otherwise.
 */
const getUsernamesByEmail = async (email) => {
  if (!email || !email.trim()) {
    return null;
  }

  // Using Sequelize to find users by email and compute is_activated and is_suspended
  const users = await MraUsers.findAll({
    attributes: [
      'username',
      // Use Sequelize.literal to handle CASE statements
      [Sequelize.literal('CASE WHEN confirmation_at IS NULL THEN FALSE ELSE TRUE END'), 'is_activated'],
      [Sequelize.literal('CASE WHEN suspended_at IS NULL THEN FALSE ELSE TRUE END'), 'is_suspended']
    ],
    where: {
      email: email.trim().toLowerCase(),
      deleted_at: { [Sequelize.Op.is]: null } // Ensure the user is not deleted
    }
  });

  if (users.length === 0) {
    return null; // No users found with the given email
  }

  // Convert Sequelize instances to plain objects
  return users && users.map(user => user.get({ plain: true }));
};

/**
 * Inserts a new user into the database.
 *
 * @param {Object} user - The user object containing username, email, and passwordHash.
 * @returns {Object} The inserted user object.
 */
const insertUser = async (user) => {
  const { username, email, passwordHash, displayName } = user;
  if (!username || !username.trim() || !email || !email.trim() || !passwordHash || !passwordHash.trim())
    return null;

  const newUser = await MraUsers.create({
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    password_hash: passwordHash.trim(),
    display_name: displayName
  });

  return newUser && newUser.get({ plain: true });

};

/**
 * Checks if a user is inactive based on the provided user information.
 *
 * @param {Object} user - The user object containing username and activationCode.
 * @returns {boolean} True if the user is inactive, false otherwise.
 */
const isInactiveUser = async (user) => {
  const { username, activationCode } = user;
  if (!username || !username.trim() || !activationCode || !activationCode.trim())
    return false;

  // Check if the user and activation code match
  const foundUser = await MraUsers.findOne({
    where: {
      username: username.trim().toLowerCase(),
      activation_code: activationCode.trim(),
      confirmation_at: null, // Check if the user hasn't been activated yet
    }
  });

  // Return true if a matching user was found, indicating they are inactive, otherwise false
  return !!foundUser;
};

/**
 * Checks if a user is active based on the provided user information.
 *
 * @param {String} username - The username of the user.
 * @returns {boolean} True if the user is inactive, false otherwise.
 */
const isActiveUser = async (username) => {
  if (!username || !username.trim())
    return false;

  const foundUser = await MraUsers.findOne({
    where: {
      username: username.trim().toLowerCase(),
      confirmation_at: {
        [Sequelize.Op.ne]: null, // confirmation_at IS NOT NULL
      },
      activation_code: null, // activation_code IS NULL
      deleted_at: null, // deleted_at IS NULL
      suspended_at: null, // suspended_at IS NULL
    }
  });

  // Return true if a matching user was found, indicating they are active, otherwise false
  return !!foundUser;
};

/**
 * Checks if an activation link is valid based on the provided user information.
 *
 * @param {Object} user - The user object containing username and activationCode.
 * @returns {boolean} True if the user is inactive, false otherwise.
 */
const isActivationCodeValid = async (user) => {
  const { username, activationCode } = user;
  if (!username || !username.trim() || !activationCode || !activationCode.trim())
    return false;

  // Check if the user and activation code match using Sequelize model
  const foundUser = await MraUsers.findOne({
    where: {
      username: username.trim().toLowerCase(),
      activation_code: activationCode.trim(),
      confirmation_at: null,
      created_at: {
        // Checking if the created_at is within the last 5 days
        [Sequelize.Op.gte]: Sequelize.literal("now() - INTERVAL '5 days'"),
        [Sequelize.Op.lte]: Sequelize.literal("now()"),
      },
    }
  });

  if (foundUser) {
    // Update confirmation_at to current timestamp
    await foundUser.update({
      confirmation_at: Sequelize.literal("now()"),
    });
    return true;
  } else {
    return false;
  }
};

/**
 * Activates a user in the database based on the provided user information.
 *
 * @param {Object} user - The user object containing username and activationCode.
 * @returns {boolean} True if the user was successfully activated, false otherwise.
 */
const activateUser = async (user) => {
  const { username, activationCode } = user;
  if (!username || !username.trim() || !activationCode || !activationCode.trim())
    return false;

  // Update the user if the activation code matches and is within the valid timeframe
  const [updateCount] = await MraUsers.update(
    { activation_code: null }, // Set activation_code to NULL
    {
      where: {
        username: username.trim().toLowerCase(),
        activation_code: activationCode.trim(),
        [Sequelize.Op.or]: [
          {
            created_at: {
              [Sequelize.Op.gte]: Sequelize.literal("now() - INTERVAL '5 days'"), // created_at >= 5 days ago
              [Sequelize.Op.lte]: Sequelize.literal("now()"),   // created_at <= CURRENT_TIMESTAMP
            }
          },
          {
            updated_at: {
              [Sequelize.Op.gte]: Sequelize.literal("now() - INTERVAL '5 days'"), // updated_at >= 5 days ago
              [Sequelize.Op.lte]: Sequelize.literal("now()"),   // updated_at <= CURRENT_TIMESTAMP
            }
          }
        ],
        confirmation_at: null, // confirmation_at IS NULL
      },
      returning: true, // This option is specific to PostgreSQL
    }
  );

  return updateCount > 0; // Returns true if at least one row was updated  
};

/**
 * Generates a reset token for a user and updates it in the database.
 * 
 * This function creates a new reset token, updates the specified user's record in the database,
 * and returns the updated user information including the reset token. It assumes that a reset token
 * generation logic is implemented elsewhere and passed to this function.
 *
 * @param {string} username - The username of the user for whom to generate and set a reset token.
 * @returns {Promise<Object|null>} A promise that resolves to the updated user object containing the 
 *                                 user_id, username, email, and reset_token. Returns null if no user is found.
 */
const generateResetToken = async (username) => {
  if (!username || !username.trim())
    return null;
  // Generate a unique reset token, for example, using a library like uuid
  // Here we're using a static value for demonstration purposes
  const resetToken = '1'; // Consider using a more secure token generation strategy

  // Update the user's reset_token field
  await MraUsers.update(
    { reset_token: resetToken },
    { where: { 
      username: username.trim().toLowerCase() 
    }, 
    returning: true } // 'returning: true' is specific to PostgreSQL
  );

  // Retrieve the updated user details
  const user = await MraUsers.findOne({
    where: { 
      username: username.trim().toLowerCase() 
    },
    attributes: ['user_id', 'username', 'email', 'reset_token', 'display_name'], // Specify the fields to retrieve
  });

  return user && user.get({ plain: true });
}

/**
 * Resets a user's password in the database.
 * 
 * This function updates the password hash of a user in the database, provided that the reset token 
 * is valid and was created within the last 5 days. It also nullifies the reset token after successful 
 * password reset to prevent reuse.
 * 
 * @param {Object} user - An object containing the user's details.
 * @param {string} user.username - The username of the user whose password is to be reset.
 * @param {string} user.resetToken - The reset token for password reset verification.
 * @param {string} user.passwordHash - The new password hash to set for the user.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the password was successfully 
 *                             reset, or `false` if the reset operation failed (e.g., invalid token, 
 *                             token expired, or user not found).
 */
const resetPassword = async (user) => {
  const { username, resetToken, passwordHash } = user;
  if (!username || !username.trim() || !resetToken || !resetToken.trim() || !passwordHash || !passwordHash.trim())
    return false;

  // Use Sequelize model to update the user
  const [updateCount] = await MraUsers.update(
    {
      reset_token: null,
      password_hash: passwordHash.trim()
    },
    {
      where: {
        username: username.trim().toLowerCase(),
        reset_token: resetToken.trim(),
        reset_token_created_at: {
          [Sequelize.Op.gte]: Sequelize.literal("now() - INTERVAL '5 days'"), // created_at >= 5 days ago
          [Sequelize.Op.lte]: Sequelize.literal("now()"),   // created_at <= CURRENT_TIMESTAMP
        },
      },
      returning: true, // Note: 'returning: true' is supported by PostgreSQL
    }
  );

  // The `returning: true` option in a Sequelize `update` (or `create`, `destroy`) call is a feature specific 
  // to PostgreSQL that instructs Sequelize to return the affected rows after the execution of the operation. 
  // In the context of an `UPDATE` operation, this means Sequelize will return the rows that were updated by the query.

  return updateCount > 0; // Returns true if at least one row was updated
};

/**
 * Retrieves user domains.
 * WE DO NOT TEST THIS FUNCTION AS CASBIN IS CONTROLLED BY CASBIN ADAPTER.
 *
 * @param {string} username - The user's unique identifier.
 * @returns {Array} List of user's domains.
 */
async function getUserDomains(username) {
  if (typeof username !== 'string' || username.trim() === '') {
    return [];
  }
  const casbinRules = await CasbinRule.findAll({
    where: {
      ptype: 'g',
      v0: username.trim().toLowerCase()
    },
    attributes: [
      // Use sequelize.fn and sequelize.col to select distinct `v2` values
      [fn('DISTINCT', col('v2')), 'v2']
    ]
  });

  // Map over the casbinRules and return an array of the v2 values
  const domains = casbinRules.map(rule => rule.v2);
  return domains;
}

/**
 * Retrieves a row from the MraTables model based on the provided tableName.
 *
 * This function uses Sequelize to query the MraTables model for a single row matching the specified tableName.
 * It returns a promise that resolves to the model instance if found, or null if no matching row is found.
 *
 * @param {string} tableName - The name of the table to retrieve from the MraTables model.
 * @returns {Promise<Model|null>} A promise that resolves with the found model instance or null if no match is found.
 */
async function getTableByTableName(tableName) {
  const table = await MraTables.findOne({ where: { table_name: tableName } });
  return table && table.get({ plain: true });
}

/**
 * Retrieves valid relationship between a user and a customer from the database.
 * 
 * This function queries the MraUserCustomers table to find one relationship that meet the following criteria:
 * - The relationship is associated with the specified user ID and customer ID.
 * - Both the customer and user have accepted the relationship on or before the current UTC time.
 * - The relationship is valid from a date on or before the current UTC time.
 * - The 'valid_to' date is null, implying that the relationship is currently valid indefinitely.
 * - The 'quit_at' date is null, indicating that the relationship has not been terminated.
 * 
 * The function ensures that the first relationship meeting all these conditions is considered valid.
 * It returns one valid relationship as a plain objects, making it easier to work with
 * outside of Sequelize's model instance context.
 *
 * @param {number} userId - The ID of the user whose relationships are to be retrieved.
 * @param {number} customerId - The ID of the customer involved in the relationships.
 * @returns {Promise<Object>} A promise that resolves to a plain objects,
 * which representing a valid relationship between the specified user and customer.
 */
async function getValidRelationshipByUserCustomer(userId, customerId) {
  const relationship = await MraUserCustomers.findOne({
    where: {
      user_id: userId,
      customer_id: customerId,
      customer_accepted_at: { [Sequelize.Op.lte]: Sequelize.literal("now()") },
      user_accepted_at: { [Sequelize.Op.lte]: Sequelize.literal("now()") },
      valid_from: { [Sequelize.Op.lte]: Sequelize.literal("now()") },
      valid_to: { 
        [Sequelize.Op.or]: [
          { [Sequelize.Op.gte]: Sequelize.literal("now()") },
          null
        ]
      },
      quit_at: null,
      suspend_at: null
    }
  });
  return relationship && relationship.get({ plain: true });
}

/**
 * Fetches a single row identified by the columnName and its value from the specified table.
 * This function dynamically selects the appropriate database model based on the tableName provided.
 *
 * @param {string} tableName - Name of the table from which the row is to be fetched.
 * @param {string} columnName - The column name which is used as an identifier (ID).
 * @param {any} columnValue - The value of the identifier to fetch the correct row.
 *
 * @returns {Promise<Object|null>} - A promise that resolves to the row data fetched from the database, or null if no row is found.
 *
 * @throws {Error} - Throws an error if the table name does not match any known models or if the database operation fails.
 */
async function getRowById(tableName, columnName, columnValue) {
  const model = getModelByTableName(tableName);
  if (!model) {
    throw new Error(`No model found for table name: ${tableName}`);
  }
  return await model.findOne({
    where: {
      [columnName]: columnValue
    },
    raw: true
  });
}

/**
 * Maps the table name to the corresponding ORM model.
 *
 * @param {string} tableName - The name of the table for which the corresponding model is needed.
 *
 * @returns {Model|null} - The ORM model associated with the given table name, or null if no model matches.
 */
function getModelByTableName(tableName) {
  const tableMap = {
    'mra_statuses': MraStatuses,
    'mra_tickets': MraTickets,
    'mra_subscriptions': MraSubscriptions
  };
  return tableMap[tableName] || null;
}


module.exports = {
  closeDBConnections,
  insertBlacklistToken,
  isTokenBlacklisted,
  insertAuditLog,
  updateAuditLog,
  deleteAuditLog,
  deleteUserByUsername,
  getUserPrivatePictureUrl,
  getUserByUsername,
  getUserByUsernameOrEmail,
  getUsernamesByEmail,
  getDeactivatedNotSuspendedUsers,
  updateUserUpdatedAtToNow,
  insertUser,
  isActiveUser,
  isInactiveUser,
  isActivationCodeValid,
  activateUser,
  resetPassword,
  generateResetToken,
  getUserDomains,
  getTableByTableName,
  getValidRelationshipByUserCustomer,
  getRowById
};
