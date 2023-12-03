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

const userTable = process.env.USER_TABLE;

const deleteUserByUsername = async (username) => {
  try {
    const query = `DELETE FROM ${userTable} WHERE username = $1 RETURNING *`; // SQL query to delete user
    const { rows } = await pool.query(query, [username.trim()]);

    if (rows.length === 0) {
      return null; // User not found or not deleted
    }

    return rows[0]; // Return the deleted user data
  } catch (err) {
    throw err; // Rethrow the error for the caller to handle
  }
};


const getUserByUsername = async (username) => {
  try {
    const query = `SELECT * FROM ${userTable} WHERE username = $1`;
    const { rows } = await pool.query(query, [username.trim()]);

    if (rows.length === 0) {
      return null; // User not found
    }

    return rows[0]; // Return the user data
  } catch (err) {
    throw err; // Rethrow the error for the caller to handle
  }
};

const getUserByUsernameOrEmail = async (usernameOrEmail) => {
  try {
    const query = `
    (SELECT * FROM ${userTable} WHERE username = $1) 
     UNION 
    (SELECT * FROM ${userTable} WHERE email = $2)`;
    const { rows } = await pool.query(query, [usernameOrEmail.trim(), usernameOrEmail.trim()]);

    if (rows.length === 0) {
      return null; // User not found
    }

    return rows; // Return the user data
  } catch (err) {
    throw err; // Rethrow the error for the caller to handle
  }
};

const insertUser = async (user) => {
  try {
    const { username, email, passwordHash } = user;
    const insertQuery = `INSERT INTO ${userTable} (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *`;
    const result = await pool.query(insertQuery, [username.trim(), email.trim(), passwordHash.trim()]);
    return result.rows[0]; // Returns the inserted user
  } catch (error) {
    throw error; // Rethrow the error for the caller to handle
  }
};

const isInactiveUser = async (user) => {
  try {
    const { username, activationCode } = user;
    // Check if the user and activation code match
    const checkUserQuery = 
    `SELECT * FROM ${userTable} 
        WHERE 
            created_at < CURRENT_TIMESTAMP - interval '5 days'
        AND confirmation_at is null
        AND username = $1 
        AND activation_code = $2
    `;
    const checkResult = await pool.query(checkUserQuery, [username.trim(), activationCode.trim()]);

    if (checkResult.rows.length > 0) {      
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw error; // Rethrow the error for the caller to handle
  }
};


const activeUser = async (user) => {
  try {
    const { username, activationCode } = user;
    // Check if the user and activation code match
    const checkUserQuery = 
    `SELECT * FROM ${userTable} 
      WHERE 
          created_at < CURRENT_TIMESTAMP - interval '5 days'
      AND confirmation_at is null
      AND username = $1
      AND activation_code = $2
    `;
    const checkResult = await pool.query(checkUserQuery, [username.trim(), activationCode.trim()]);

    if (checkResult.rows.length > 0) {
      // Update the user's activation_code and confirmation_at
      const updateUserQuery = `UPDATE ${userTable} SET activation_code = NULL, confirmation_at = NOW() WHERE username = $1`;
      await pool.query(updateUserQuery, [username.trim()]);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw error; // Rethrow the error for the caller to handle
  }
};

const closePool = async () => {
  await pool.end();
};

module.exports = {
  deleteUserByUsername,
  getUserByUsername,
  getUserByUsernameOrEmail,
  insertUser,
  isInactiveUser,
  activeUser,
  closePool
};
