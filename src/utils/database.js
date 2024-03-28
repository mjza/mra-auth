const { mra_users, mra_gender_types, mra_user_details, mra_token_blacklist, mra_audit_logs_authentication } = require('../models');

const { Pool } = require('pg');

// Use environment variables to configure the database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'development' ? false : {
    rejectUnauthorized: false
  }
});

const logsTable = process.env.LOGS_TABLE;
const usersTable = process.env.USERS_TABLE;
const userDetailsTable = process.env.USER_DETAILS_TABLE;
const genderTypesTable = process.env.GENDER_TYPES_TABLE;
const tokensTable = process.env.TOKENS_TABLE;

/**
 * Inserts a new token into the blacklist database.
 *
 * @param {Object} tokenData - The token data object { token, expiry } containing token and expiry.
 * @returns {Object} The inserted token data object.
 */
const insertBlacklistToken = async (tokenData) => {
  const { token, expiry } = tokenData;
  if (!token || !token.trim())
    return null;
  const query = `INSERT INTO ${tokensTable} (token, expiry) VALUES ($1, $2) RETURNING *`;
  const { rows } = await pool.query(query, [token, expiry]);

  const insertedData = rows[0];
  insertedData.expiry = parseInt(insertedData.expiry, 10);

  return insertedData;
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
  const query = `SELECT 1 FROM ${tokensTable} WHERE token = $1`;
  const { rows } = await pool.query(query, [token]);

  return rows.length > 0;
};

/**
 * Inserts a new audit log into the database.
 *
 * @param {Object} log - The log object { methodRoute, req, comments, ipAddress, userId } containing methodRoute, req, comment, ipAddress, and userId.
 * @returns {Object} The inserted log object.
 */
const insertAuditLog = async (log) => {
  const { methodRoute, req, comments, ipAddress, userId } = log;
  const query = `INSERT INTO ${logsTable} (method_route, req, ip_address, comments, user_id) VALUES ($1, $2, $3, COALESCE($4, ''), $5) RETURNING *`;
  const { rows } = await pool.query(query, [methodRoute, req, ipAddress, comments, userId]);
  return rows[0];
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
  const query = `UPDATE ${logsTable} SET comments = $1 WHERE log_id = $2 RETURNING log_id, comments`;
  const { rows } = await pool.query(query, [comments, logId]);
  return rows[0];
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
  const query = `DELETE FROM ${logsTable} WHERE method_route LIKE 'TEST %' AND log_id = $1`;
  const result = await pool.query(query, [logId]);
  return { success: result.rowCount > 0 };
};


/**
 * Deletes a user from the database based on the provided username.
 *
 * @param {string} username - The username of the user to be deleted.
 * @returns {Object|null} The deleted user object if successful, null if no user was found or deleted.
 */
const deleteUserByUsername = async (username) => {
  if (!username || !username.trim())
    return null;
  const query = `DELETE FROM ${usersTable} WHERE username = $1 RETURNING *`; // SQL query to delete user
  const { rows } = await pool.query(query, [username.trim()]);

  if (rows.length === 0) {
    return null; // User not found or not deleted
  }
  return rows[0]; // Return the deleted user data
};

/**
 * Retrieves a user from the database based on the provided username.
 *
 * @param {string} username - The username of the user to retrieve.
 * @returns {Object|null} The user object if found, null otherwise.
 */
/*
const getUserByUsername = async (username) => {
  if (!username || !username.trim())
    return null;
  const query = `SELECT * FROM ${usersTable} WHERE username = $1`;
  const { rows } = await pool.query(query, [username.trim()]);

  if (rows.length === 0) {
    return null; // User not found
  }

  return rows[0]; // Return the user data
};
*/
const getUserByUsername = async (username) => {
  if (!username || !username.trim()) {
    return null;
  }

  const user = await mra_users.findOne({
    where: { username: username.trim() }
  });

  return user; // This will return the user instance or null if not found
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
  const query = `
    (SELECT * FROM ${usersTable} WHERE username = $1) 
     UNION 
    (SELECT * FROM ${usersTable} WHERE email = $2)`;
  const { rows } = await pool.query(query, [usernameOrEmail.trim(), usernameOrEmail.trim()]);

  if (rows.length === 0) {
    return null; // User not found
  }

  return rows; // Return the user data
};

/**
 * Retrieves all usernames from the database based on the provided email.
 *
 * @param {string} email - The email of the user to retrieve.
 * @returns {Object|null} The user object if found, null otherwise.
 */
const getUsernamesByEmail = async (email) => {
  if (!email || !email.trim())
    return null;
  const query = `
    SELECT username, 
           CASE 
             WHEN confirmation_at IS NULL THEN FALSE 
             ELSE TRUE 
           END AS is_activated,
           CASE 
             WHEN suspended_at IS NULL THEN FALSE 
             ELSE TRUE 
           END AS is_suspended
    FROM ${usersTable} 
    WHERE 
      deleted_at IS NULL AND
      email = $1`;
  const { rows } = await pool.query(query, [email.trim()]);

  if (rows.length === 0) {
    return null; // User not found
  }

  return rows; // Return the user data
};

/**
 * Inserts a new user into the database.
 *
 * @param {Object} user - The user object containing username, email, and passwordHash.
 * @returns {Object} The inserted user object.
 */
const insertUser = async (user) => {
  const { username, email, passwordHash } = user;
  if (!username || !username.trim() || !email || !email.trim() || !passwordHash || !passwordHash.trim())
    return null;
  const insertQuery = `INSERT INTO ${usersTable} (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *`;
  const { rows } = await pool.query(insertQuery, [username.trim(), email.trim(), passwordHash.trim()]);
  return rows && rows[0]; // Returns the inserted user
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
  const checkUserQuery =
    `SELECT * FROM ${usersTable} 
        WHERE 
            confirmation_at IS NULL AND
            username = $1 AND 
            activation_code = $2
    `;

  const checkResult = await pool.query(checkUserQuery, [username.trim(), activationCode.trim()]);

  if (checkResult.rows.length > 0) {
    return true;
  } else {
    return false;
  }
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

  // Check if the user and activation code match
  const checkUserQuery =
    `SELECT * FROM ${usersTable} 
        WHERE 
            confirmation_at IS NOT NULL AND
            activation_code IS NULL AND
            deleted_at IS NULL AND
	          suspended_at IS NULL AND
            username = $1            
    `;

  const checkResult = await pool.query(checkUserQuery, [username.trim()]);

  if (checkResult.rows.length > 0) {
    return true;
  } else {
    return false;
  }
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
  // Check if the user and activation code match
  const checkUserQuery =
    `SELECT * FROM ${usersTable} 
        WHERE
            created_at >= (CURRENT_TIMESTAMP - interval '5 days') AND
            created_at <= CURRENT_TIMESTAMP AND 
            confirmation_at IS NULL AND
            username = $1 AND 
            activation_code = $2
    `;

  const checkResult = await pool.query(checkUserQuery, [username.trim(), activationCode.trim()]);

  if (checkResult.rows.length > 0) {
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
  // Check if the user and activation code match
  const updateUserQuery = `UPDATE ${usersTable} 
                            SET activation_code = NULL 
                            WHERE
                              created_at >= (CURRENT_TIMESTAMP - interval '5 days') AND
                              created_at <= CURRENT_TIMESTAMP AND
                              confirmation_at IS NULL AND
                              username = $1 AND
                              activation_code = $2
                            RETURNING *  
                          `;

  const checkResult = await pool.query(updateUserQuery, [username.trim(), activationCode.trim()]);
  return checkResult && checkResult.rows.length > 0;
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
  const query = `UPDATE ${usersTable} SET reset_token = '1' WHERE username = $1 RETURNING user_id, username, email, reset_token`;
  const { rows } = await pool.query(query, [username]);
  return rows && rows[0];
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
  const query = `UPDATE ${usersTable} 
                 SET reset_token = null, password_hash = $1 
                 WHERE 
                    reset_token_created_at >= (CURRENT_TIMESTAMP - interval '5 days') AND
                    reset_token_created_at <= CURRENT_TIMESTAMP AND
                    username = $2 AND 
                    reset_token = $3 
                 RETURNING *`;
  const { rows } = await pool.query(query, [passwordHash.trim(), username.trim(), resetToken.trim()]);
  return rows && rows.length > 0;
};

/**
 * Retrieves user details from the database based on the provided userId.
 *
 * @param {number} userId - The user's unique identifier.
 * @returns {Object} The user details object.
 */
async function getUserDetails(userId) {
  if (isNaN(userId))
    return null;
  const query = `
    SELECT u.user_id, u.first_name, u.middle_name, u.last_name, u.gender_id, g.gender_name, u.date_of_birth, u.profile_picture_url, u.profile_picture_thumbnail_url, u.creator, u.created_at, u.updator, u.updated_at
    FROM ${userDetailsTable} u 
    INNER JOIN ${genderTypesTable} g ON u.gender_id = g.gender_id
    WHERE u.user_id = $1;
  `;
  const { rows } = await pool.query(query, [userId]);
  return undefined === rows[0] ? null : rows[0];
}

/**
 * Creates new user details in the database.
 *
 * @param {Object} userDetails - The user details object.
 * @returns {Object} The created user details object.
 */
async function createUserDetails(userDetails) {
  const query = `
  WITH updated AS (
    INSERT INTO ${userDetailsTable} (user_id, first_name, middle_name, last_name, gender_id, date_of_birth, profile_picture_url, profile_picture_thumbnail_url, display_name, public_profile_picture_thumbnail_url, creator)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING user_id, first_name, middle_name, last_name, gender_id, date_of_birth as date_of_birth, profile_picture_url, profile_picture_thumbnail_url, display_name, public_profile_picture_thumbnail_url, creator, created_at, updator, updated_at
    )
  SELECT u.user_id, u.first_name, u.middle_name, u.last_name, u.gender_id, g.gender_name, u.date_of_birth, u.profile_picture_url, u.profile_picture_thumbnail_url, u.display_name, u.public_profile_picture_thumbnail_url, u.creator, u.created_at, u.updator, u.updated_at
  FROM updated u
  INNER JOIN ${genderTypesTable} g ON u.gender_id = g.gender_id;
  `;
  const values = [userDetails.userId, userDetails.firstName, userDetails.middleName, userDetails.lastName, userDetails.genderId, userDetails.dateOfBirth, userDetails.profilePictureUrl, userDetails.profilePictureThumbnailUrl, userDetails.displayName, userDetails.publicProfilePictureThumbnailUrl, userDetails.creator];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Updates user details in the database based on the provided userId and userDetails.
 *
 * @param {number} userId - The user's unique identifier.
 * @param {Object} userDetails - The new user details object.
 * @returns {Object} The updated user details object.
 */
async function updateUserDetails(userId, userDetails) {
  const query = `
  WITH updated AS (
      UPDATE ${userDetailsTable}
      SET first_name = $1, middle_name = $2, last_name = $3, gender_id = $4, date_of_birth = $5, profile_picture_url = $6, profile_picture_thumbnail_url = $7, display_name = $8, public_profile_picture_thumbnail_url = $9, updator = $10
      WHERE user_id = $11
      RETURNING user_id, first_name, middle_name, last_name, gender_id, date_of_birth as date_of_birth, profile_picture_url, profile_picture_thumbnail_url, display_name, public_profile_picture_thumbnail_url, creator, created_at, updator, updated_at
    )
  SELECT u.user_id, u.first_name, u.middle_name, u.last_name, u.gender_id, g.gender_name, u.date_of_birth, u.profile_picture_url, u.profile_picture_thumbnail_url, u.display_name, u.public_profile_picture_thumbnail_url, u.creator, u.created_at, u.updator, u.updated_at
  FROM updated u
  INNER JOIN ${genderTypesTable} g ON u.gender_id = g.gender_id;  
  `;
  const values = [userDetails.firstName, userDetails.middleName, userDetails.lastName, userDetails.genderId, userDetails.dateOfBirth, userDetails.profilePictureUrl, userDetails.profilePictureThumbnailUrl, userDetails.displayName, userDetails.publicProfilePictureThumbnailUrl, userId, userId];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Retrieves user domains.
 *
 * @param {string} username - The user's unique identifier.
 * @returns {Array} List of user's domains.
 */
async function getUserDomains(username) {
  if (typeof username !== 'string' || username.trim() === '') {
    return [];
  }
  const query = `
    SELECT v2
    FROM casbin_rule
    WHERE ptype = 'g' AND v0 = $1
  `;
  const { rows } = await pool.query(query, [username]);
  
  // Map over the rows and return an array of the v2 values
  const domains = rows.map(row => row.v2);
  return domains;
}

/**
 * Closes the database connection pool.
 */
const closePool = async () => {
  await pool.end();
};

module.exports = {
  insertBlacklistToken,
  isTokenBlacklisted,
  insertAuditLog,
  updateAuditLog,
  deleteAuditLog,
  deleteUserByUsername,
  getUserByUsername,
  getUserByUsernameOrEmail,
  getUsernamesByEmail,
  insertUser,
  isActiveUser,
  isInactiveUser,
  isActivationCodeValid,
  activateUser,
  resetPassword,
  generateResetToken,
  getUserDetails,
  createUserDetails,
  updateUserDetails,
  getUserDomains,
  closePool
};
