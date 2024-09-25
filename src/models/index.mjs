'use strict';

import { createWriteStream, existsSync, truncateSync, writeFileSync } from 'fs';
import { join } from 'path';
import { env } from 'process';
import { Sequelize, col, fn, where } from 'sequelize';
import initModels from './init-models.mjs';
/**
 * Stream for logging Sequelize messages to a file.
 */
const filePath = join(process.cwd(), 'logs/sequelize.log');
try {
  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'local-test') {
    if (!existsSync(filePath)) {
      writeFileSync(filePath, '');
    } else {
      truncateSync(filePath, 0);
    }
  }
} catch (err) {
  console.error('Error creating or truncating log file:', err);
}
const logStream = createWriteStream(filePath, { flags: 'a' });

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
const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  dialect: 'postgres',
  dialectOptions: {
    useUTC: true, // for reading from database
    ssl: env.NODE_ENV !== 'development' && env.NODE_ENV !== 'local-test' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
  },
  timezone: '+00:00', // for writing to database
  logging: env.NODE_ENV === 'development' || env.NODE_ENV === 'local-test' ? logToFileStream : false,
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

const {
  CasbinRule,
  MraActions,
  MraAdvisorCustomers,
  MraAuditLogsAuthentication,
  MraConditionFields,
  MraConditionTypes,
  MraContactCategories,
  MraContactInformation,
  MraContactTypes,
  MraCurrencyCodes,
  MraCustomerTypes,
  MraCustomers,
  MraDiscountInterval,
  MraDiscountTypes,
  MraGenderTypes,
  MraNotificationTypes,
  MraNotifications,
  MraPaymentDetails,
  MraPaymentMethods,
  MraPosts,
  MraRoles,
  MraStatuses,
  MraSubscriptionCodeOfCustomers,
  MraSubscriptionInterval,
  MraSubscriptionModelOptions,
  MraSubscriptionModels,
  MraSubscriptionOptions,
  MraSubscriptions,
  MraTables,
  MraTcAcceptance,
  MraTcTypes,
  MraTermsAndConditions,
  MraTicketAssignments,
  MraTicketCategories,
  MraTicketComments,
  MraTicketHistory,
  MraTicketReactionTypes,
  MraTicketReactions,
  MraTickets,
  MraTokenBlacklist,
  MraTransitionConditions,
  MraUserCities,
  MraUserCustomers,
  MraUserDetails,
  MraUsers,
  MragCaAddresses,
  MragCities,
  MragCountries,
  MragWofCaGeojson,
  MragWofCaNames,
  MragWofCaSpr,
  MragWofGeometryTypes,
  MragWofNameContexts,
  MragWofPlaceTypes,
} = models;

/**
 * Closes the Sequelize database connection.
 * @returns {Promise<void>} A promise that resolves when the connection is closed.
 */
async function closeSequelize() {
  await sequelize.close();
}

export {
  //
  CasbinRule,
  MraActions,
  MraAdvisorCustomers,
  MraAuditLogsAuthentication,
  MraConditionFields,
  MraConditionTypes,
  MraContactCategories,
  MraContactInformation,
  MraContactTypes,
  MraCurrencyCodes,
  MraCustomerTypes,
  MraCustomers,
  MraDiscountInterval,
  MraDiscountTypes,
  MraGenderTypes,
  MraNotificationTypes,
  MraNotifications,
  MraPaymentDetails,
  MraPaymentMethods,
  MraPosts,
  MraRoles,
  MraStatuses,
  MraSubscriptionCodeOfCustomers,
  MraSubscriptionInterval,
  MraSubscriptionModelOptions,
  MraSubscriptionModels,
  MraSubscriptionOptions,
  MraSubscriptions,
  MraTables,
  MraTcAcceptance,
  MraTcTypes,
  MraTermsAndConditions,
  MraTicketAssignments,
  MraTicketCategories,
  MraTicketComments,
  MraTicketHistory,
  MraTicketReactionTypes,
  MraTicketReactions,
  MraTickets,
  MraTokenBlacklist,
  MraTransitionConditions,
  MraUserCities,
  MraUserCustomers,
  MraUserDetails,
  MraUsers,
  MragCaAddresses,
  MragCities,
  MragCountries,
  MragWofCaGeojson,
  MragWofCaNames,
  MragWofCaSpr,
  MragWofGeometryTypes,
  MragWofNameContexts,
  MragWofPlaceTypes, Sequelize, closeSequelize, col, fn, sequelize, where
};

