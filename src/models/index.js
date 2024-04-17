'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, fn, col, where } = require('sequelize');
const process = require('process');
const initModels = require('./init-models');
const filePath = path.join(__dirname, '../../logs/sequelize.log');

/**
 * Stream for logging Sequelize messages to a file.
 */
try {
  if (process.env.NODE_ENV === 'development') {
    fs.truncateSync(filePath, 0);
  }
} catch (err) {
  console.error('Error truncating file:', err);
}
const logStream = fs.createWriteStream(filePath, { flags: 'a' });

/**
 * Logs a message to the sequelize log file.
 * @param {string} msg - The message to log.
 */
function logToFileStream(msg) {
  logStream.write(msg + '\n');
}

/**
 * Sequelize instance configured for the application database.
 */
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  dialectOptions: {
    useUTC: true, // for reading from database
    ssl: process.env.NODE_ENV !== 'development' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
  },
  timezone: '+00:00', // for writing to database
  logging: process.env.NODE_ENV === 'development' ? logToFileStream : false,
  hooks: {
    afterConnect: (connection, config) => {
      return new Promise((resolve, reject) => {
        connection.query("SET TIME ZONE 'UTC';", (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  },
});

/**
 * Database models initialized with Sequelize.
 */
const models = initModels(sequelize);

/**
 * Closes the Sequelize database connection.
 * @returns {Promise<void>} A promise that resolves when the connection is closed.
 */
async function closeSequelize() {
  await sequelize.close();
}


module.exports = {
  ...models,
  sequelize,
  Sequelize,
  fn,
  col,
  where,
  closeSequelize,
};
