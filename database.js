const { Pool } = require('pg');

// Use environment variables to configure the database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

const insertUser = async (user) => {
    const { username, email, passwordHash } = user;
    const insertQuery = `INSERT INTO mra_users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *`;
    try {
      const result = await pool.query(insertQuery, [username, email, passwordHash]);
      return result.rows[0]; // Returns the inserted user
    } catch (error) {
      throw error; // Rethrow the error for the caller to handle
    }
  };

module.exports = {
  query: (text, params) => pool.query(text, params),
  insertUser,
};
