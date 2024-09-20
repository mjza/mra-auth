const rateLimit = require('express-rate-limit');

/**
 * @swagger
 * components:
 *   responses:
 *     ApiRateLimitExceeded:
 *       description: Too many requests
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Too many requests from this IP, please try again after 15 minutes.
 *       headers:
 *         Retry-After:
 *           description: Indicates how long the user should wait before making a new request.
 *           schema:
 *             type: integer
 *             format: int32
 */
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
const apiRequestLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes in milliseconds
    max: 60, // Limit each IP to 30 requests per `window` (here, per 1 minutes)
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
    skip: (req, _) => {
        const developmentToken = req.headers['x-development-token'];
        if (developmentToken) {
            return developmentToken === process.env.X_DEVELOPMENT_TOKEN;
        }
        // Do not skip in production
        return false; 
    }
});

/**
 * Rate limit configuration for the authorization API usage.
 * Limits the number of requests an IP can make in a set time window.
 * 
 * @const
 * @type {rateLimit}
 * @property {number} windowMs - The time frame for calculating the number of requests in milliseconds (15 minutes).
 * @property {number} max - The maximum number of requests allowed per IP in the specified window (100 requests per 15 minutes).
 * @property {string} message - The message returned when the rate limit is exceeded.
 */
const authorizationApiRequestLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes in milliseconds
    max: 100, // Limit each IP to 30 requests per `window` (here, per 15 minutes)
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
    skip: (req, _) => {
        if (process.env.NODE_ENV === 'development') {
            const ip = req.ip || req.connection.remoteAddress;
            return ip === '127.0.0.1' || ip === '::1';
        }
        // Do not skip in production
        return false; 
    }
});

/**
 * @swagger
 * components:
 *   responses:
 *     CreateApiRateLimitExceeded:
 *       description: Too many requests
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Too many registration requests from this IP, please try again after an hour.
 *       headers:
 *         Retry-After:
 *           description: Indicates how long the user should wait before making a new request.
 *           schema:
 *             type: integer
 *             format: int32
 */
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

const registerAccountLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 requests per windowMs
    message: { message: 'Too many registration requests from this IP, please try again after an hour.' },
    skip: (req, _) => {
        const developmentToken = req.headers['x-development-token'];
        if (developmentToken) {
            return developmentToken === process.env.X_DEVELOPMENT_TOKEN;
        }
        // Do not skip in production
        return false; 
    }
});

module.exports = { apiRequestLimiter, authorizationApiRequestLimiter, registerAccountLimiter };