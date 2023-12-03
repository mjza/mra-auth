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

const usersTable = process.env.USERS_TABLE;
const userDetailsTable = process.env.USER_DETAILS_TABLE;

const deleteUserByUsername = async (username) => {
  const query = `DELETE FROM ${usersTable} WHERE username = $1 RETURNING *`; // SQL query to delete user
  const { rows } = await pool.query(query, [username.trim()]);

  if (rows.length === 0) {
    return null; // User not found or not deleted
  }
  return rows[0]; // Return the deleted user data
};


const getUserByUsername = async (username) => {
  const query = `SELECT * FROM ${usersTable} WHERE username = $1`;
  const { rows } = await pool.query(query, [username.trim()]);

  if (rows.length === 0) {
    return null; // User not found
  }

  return rows[0]; // Return the user data
};

const getUserByUsernameOrEmail = async (usernameOrEmail) => {
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

const insertUser = async (user) => {
  const { username, email, passwordHash } = user;
  const insertQuery = `INSERT INTO ${usersTable} (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *`;
  const result = await pool.query(insertQuery, [username.trim(), email.trim(), passwordHash.trim()]);
  return result.rows[0]; // Returns the inserted user
};

const isInactiveUser = async (user) => {
  const { username, activationCode } = user;
  // Check if the user and activation code match
  const checkUserQuery =
    `SELECT * FROM ${usersTable} 
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
};


const activeUser = async (user) => {
  const { username, activationCode } = user;
  // Check if the user and activation code match
  const checkUserQuery =
    `SELECT * FROM ${usersTable} 
      WHERE 
          created_at < CURRENT_TIMESTAMP - interval '5 days'
      AND confirmation_at is null
      AND username = $1
      AND activation_code = $2
    `;
  const checkResult = await pool.query(checkUserQuery, [username.trim(), activationCode.trim()]);

  if (checkResult.rows.length > 0) {
    // Update the user's activation_code and confirmation_at
    const updateUserQuery = `UPDATE ${usersTable} SET activation_code = NULL, confirmation_at = NOW() WHERE username = $1`;
    await pool.query(updateUserQuery, [username.trim()]);
    return true;
  } else {
    return false;
  }
};

async function getUserDetails(userId) {
  const query = `
    SELECT user_id, first_name, middle_name, last_name, gender_id, TO_CHAR(date_of_birth, 'YYYY-MM-DD') as date_of_birth, profile_picture_url, profile_picture_thumbnail_url 
    FROM ${userDetailsTable} WHERE user_id = $1;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows[0];
}

async function createUserDetails(userDetails) {
  const query = `
    INSERT INTO ${userDetailsTable} (user_id, first_name, middle_name, last_name, gender_id, date_of_birth, profile_picture_url, profile_picture_thumbnail_url, updator)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING user_id, first_name, middle_name, last_name, gender_id, TO_CHAR(date_of_birth, 'YYYY-MM-DD') as date_of_birth, profile_picture_url, profile_picture_thumbnail_url;
  `;
  const values = [userDetails.userId, userDetails.firstName, userDetails.middleName, userDetails.lastName, userDetails.genderId, userDetails.dateOfBirth, userDetails.profilePictureUrl, userDetails.profilePictureThumbnailUrl, userDetails.userId];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function updateUserDetails(userId, userDetails) {
  const query = `
    UPDATE ${userDetailsTable}
    SET first_name = $1, middle_name = $2, last_name = $3, gender_id = $4, date_of_birth = $5, profile_picture_url = $6, profile_picture_thumbnail_url = $7, updator = $8, updated_at = NOW()
    WHERE user_id = $9
    RETURNING first_name, middle_name, last_name, gender_id, TO_CHAR(date_of_birth, 'YYYY-MM-DD') as date_of_birth, profile_picture_url, profile_picture_thumbnail_url;
  `;
  const values = [userDetails.firstName, userDetails.middleName, userDetails.lastName, userDetails.genderId, userDetails.dateOfBirth, userDetails.profilePictureUrl, userDetails.profilePictureThumbnailUrl, userId, userId];
  const { rows } = await pool.query(query, values);
  return rows[0];
}


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
  getUserDetails,
  createUserDetails,
  updateUserDetails,
  closePool
};
