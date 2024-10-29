import { miscellaneous } from '@reportcycle/mra-utils';
import axios from 'axios';
import pkg from 'jsonwebtoken';
import { promisify } from 'util';
import { getUserByUsername, getUserIdByUsername, isTokenBlacklisted } from './database.mjs';
import { createEventLog, updateEventLog } from './logger.mjs';
const { getCreptoConfig } = miscellaneous;
const { verify } = pkg;

/**
 * Checks if a user does not exist in the database.
 * If the user exists, it rejects the promise with a specific message.
 *
 * @async
 * @param {string} value - The username to check in the database.
 * @returns {Promise<void>} A promise that resolves if the user does not exist, or rejects if the user exists.
 */
const userMustNotExist = async (value, { req }) => {
    // Database logic to check if the user exists
    const user = await getUserByUsername(value);
    if (user) {
        return Promise.reject(req.t('Username already exists.'));
    }
};

export { userMustNotExist };

/**
 * Checks if a user exists in the database.
 * If the user does not exist, it rejects the promise with a specific message.
 *
 * @async
 * @param {string} username - The username to check in the database.
 * @returns {Promise<void>} A promise that resolves if the user exists, or rejects if the user does not exist.
 */
const userMustExist = async (value, { req }) => {
    // Database logic to check if the user exists
    const user = await getUserByUsername(value);
    if (!user) {
        return Promise.reject(req.t('Username does not exist.'));
    }
};

export { userMustExist };

/**
 * @swagger
 * components:
 *   responses:
 *     UnauthorizedAccessInvalidTokenProvided:
 *       description: Unauthorized access - No token provided.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: You must provide a valid JWT token.| Provided JWT token is invalid.
 */
/**
 * Middleware to authenticate a JWT token present in the request header.
 * It verifies the token and adds the user information to the request if the token is valid.
 * Sends a 401 response if the token is not provided or invalid, respectively.
 *
 * @param {Object} req - The request object from Express.js.
 * @param {Object} res - The response object from Express.js.
 * @param {function} next - The next middleware function in the Express.js route.
 */
const authenticateToken = async (req, res, next) => {
    // prevent user injection in req by hackers
    delete req.user;
    // Get the token from the request header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // If no token is provided
    if (token == null) {
        return res.status(401).json({ message: req.t('You must provide a valid JWT token.') });
    }

    try {
        const config = getCreptoConfig();
        const jwtVerify = promisify(verify);
        // Verify JWT Token
        const tokenData = await jwtVerify(token, config.secretKey);
        // check the user is not deleted
        const userId = await getUserIdByUsername(tokenData.username);
        // Check if token is expired in database
        const isExpired = await isTokenBlacklisted(token) || tokenData.userId != userId;
        if (isExpired) {
            return res.status(401).json({ message: req.t('Provided JWT token is invalid.') });
        }
        // Add user information to request
        req.user = { userId: tokenData.userId, username: tokenData.username, email: tokenData.email };
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        updateEventLog(req, { error: 'Error in validating auth token.', details: err });
        // Handle error (token invalid or other errors)
        return res.status(401).json({ message: req.t('Provided JWT token is invalid.') });
    }
};

export { authenticateToken };

/**
 * Middleware to authenticate a JWT token present in the request header.
 * It verifies the token against a secret key, checks for token expiration or blacklisting in the database,
 * and conditionally adds the user information to the request object if the token is valid.
 *
 * If the token is not provided, invalid, expired, or blacklisted, the function does not stop the request processing but
 * sets `req.user` to public user. This allows downstream
 * middleware or route handlers to make decisions based on the authentication status.
 *
 * @param {Object} req - The request object from Express.js, augmented with `user` properties.
 * @param {Object} _ - The response object from Express.js.
 * @param {Function} next - The next middleware function in the Express.js route.
 */
const authenticateUser = async (req, _, next) => {
    // prevent user injection in req by hackers
    delete req.user;
    // Get the token from the request header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    const publicUser = { userId: 0, username: 'public', email: null }
    // If no token is provided
    if (!token) {
        req.user = publicUser;
        next();
    } else {
        try {
            const config = getCreptoConfig();
            //
            const jwtVerify = promisify(verify);
            // Verify JWT Token
            const tokenData = await jwtVerify(token, config.secretKey);
            // check the user is not deleted
            const userId = await getUserIdByUsername(tokenData.username);
            // Check if token is expired in database
            const isExpired = await isTokenBlacklisted(token) || tokenData.userId != userId;
            if (isExpired) {
                req.user = publicUser;
                next();
            } else {
                req.user = { userId: tokenData.userId, username: tokenData.username, email: tokenData.email };
                next();
            }
        } catch (err) {
            updateEventLog(req, { error: 'Error in authenticate user.', details: err });
            req.user = publicUser;
            next();
        }
    }
};

export { authenticateUser };

/**
 * @swagger
 * components:
 *   responses:
 *     UnauthorizedAccessInvalidTokenProvided:
 *       description: Unauthorized access - No token provided.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: You must provide a valid JWT token.
 */
/**
 * Middleware to check if a user is authorized to perform a task.
 *
 * @param {Object} req - The request object from Express.js.
 * @param {Object} res - The response object from Express.js.
 * @param {function} next - The next middleware function in the Express.js route.
 */
const authorizeUser = (extraData) => async (req, res, next) => {
    try {
        // prevent user injection in req by hackers
        delete req.user;
        delete req.roles;
        delete req.conditions;
        //
        const body = {
            dom: extraData.dom,
            obj: extraData.obj,
            act: extraData.act,
            attrs: extraData.attrs
        };

        let authRes;
        if ((process.env.NODE_ENV === 'local-test' || process.env.NODE_ENV === 'test') && req.appInstance) {
            const { default: request } = await import('supertest');
            const response = await request(req.appInstance)
                .post('/v1/authorize')
                .set('Authorization', req.headers['authorization'])
                .send(body);
            if (response.status >= 400) {
                return res.status(response.status).json(response.body);
            }
            authRes = response.body;
        } else {
            try {
                const serviceUrl = process.env.BASE_URL + '/v1/authorize';
                const authHeader = req.headers['authorization'];
                const response = await axios.post(serviceUrl, body, {
                    headers: {
                        Authorization: authHeader
                    }
                });
                authRes = response.data;
            } catch (err) {
                if (err.response) {
                    // Relay the entire response from the external service
                    return res.status(err.response.status).json(err.response.data);
                }
                await updateEventLog(req, { error: 'Error in authorize user.', details: err });
                // Default to a 500 status code if no specific response is available
                return res.sendStatus(500);
            }
        }
        const { user, roles, conditions } = authRes;
        if (!req.logId) {
            const logId = await createEventLog(req, user.userId);
            req.logId = logId;
            req.user = user;
            req.roles = roles;
            req.conditions = conditions;
        } else {
            req.user = user;
            req.roles = roles;
            req.conditions = conditions;
            await updateEventLog(req, { success: 'User has been authorized.', details: authRes });
        }
        next();
    } catch (err) {
        await updateEventLog(req, { error: 'Error in authorize user.', details: err });
        // Default to a 500 status code if no specific response is available
        return res.sendStatus(500);
    }
};

export { authorizeUser };
