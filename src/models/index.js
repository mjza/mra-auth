'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const initModels = require('./init-models');

/**
 * Stream for logging Sequelize messages to a file.
 */
const logStream = fs.createWriteStream(path.join(__dirname, '../../logs/sequelize.log'), { flags: 'a' });

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
    ssl: process.env.NODE_ENV !== 'development' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
  },
  logging: process.env.NODE_ENV === 'development' ? logToFileStream : false,
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
  closeSequelize,
};
