'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');

const logStream = fs.createWriteStream(path.join(__dirname, '../../logs/sequelize.log'), { flags: 'a' });
function logToFileStream(msg) {
  logStream.write(msg + '\n');
}

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'development' ? false : { rejectUnauthorized: false }
  },
  logging: process.env.NODE_ENV === 'development' ? logToFileStream : false
});

const initModels = require('./init-models');
const models = initModels(sequelize);

module.exports = {
  ...models,
  sequelize,
  Sequelize,
};