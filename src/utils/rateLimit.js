const rateLimit = require('express-rate-limit');

/**
 * Rate limit configuration for the general API usage.
 * Limits the number of requests an IP can make in a set time window.
 * 
 * @const
 * @type {rateLimit}
 * @property {number} windowMs - The time frame for calculating the number of requests in milliseconds (15 minutes).
 * @property {number} max - The maximum number of requests allowed per IP in the specified window (100 requests per 15 minutes).
 * @property {string} message - The message returned when the rate limit is exceeded.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
    max: 10, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

/**
 * Rate limit configuration specifically for creating new accounts.
 * Limits the number of account creation attempts per IP in a set time window.
 * 
 * @const
 * @type {rateLimit}
 * @property {number} windowMs - The time frame for calculating the number of account creation requests in milliseconds (1 hour).
 * @property {number} max - The maximum number of account creation requests allowed per IP in the specified window (5 requests per hour).
 * @property {string} message - The message returned when the rate limit for account creation is exceeded.
 */

const createAccountLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many accounts created from this IP, please try again after an hour'
});

module.exports = { apiLimiter, createAccountLimiter };