const jwt = require('jsonwebtoken');
const axios = require('axios');
const { Agent } = require('https');
const { promisify } = require('util');
const { validationResult } = require('express-validator');
const jwtVerify = promisify(jwt.verify);
const db = require('./database');
const { createEventLog, updateEventLog } = require('./logger');

/**
 * Checks if a user does not exist in the database.
 * If the user exists, it rejects the promise with a specific message.
 *
 * @async
 * @param {string} username - The username to check in the database.
 * @returns {Promise<void>} A promise that resolves if the user does not exist, or rejects if the user exists.
 */
const userMustNotExist = async (username) => {
    // Database logic to check if the user exists
    const user = await db.getUserByUsername(username);
    if (user) {
        return Promise.reject('Username already exists.');
    }
};

/**
 * Checks if a user exists in the database.
 * If the user does not exist, it rejects the promise with a specific message.
 *
 * @async
 * @param {string} username - The username to check in the database.
 * @returns {Promise<void>} A promise that resolves if the user exists, or rejects if the user does not exist.
 */
const userMustExist = async (username) => {
    // Database logic to check if the user exists
    const user = await db.getUserByUsername(username);
    if (!user) {
        return Promise.reject('Username does not exist.');
    }
};

/**
 * Tests if a given URL is accessible by making a HEAD request.
 *
 * @async
 * @param {string} url - The URL to test for accessibility.
 * @returns {Promise<boolean>} True if the URL is accessible, false otherwise.
 */
const testUrlAccessibility = async function (url) {
    try {
        // Create a new instance of the HTTPS agent with keepAlive set to false
        const httpsAgent = new Agent({ keepAlive: false });
        // Use axios to make a HEAD request to the URL
        await axios.head(url, { httpsAgent });
        return true; // URL is accessible
    } catch (err) {
        return false; // URL is not accessible
    }
};

/**
 * Validates whether the given input is a well-formed URL.
 *
 * @param {string} inputUrl - The URL to validate.
 * @returns {boolean} True if the input is a valid URL, false otherwise.
 */
const isValidUrl = (inputUrl) => {
    try {
        const parsedUrl = new URL(inputUrl);
        return true;
    } catch (err) {
        return false;
    }
};

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
    if (req.user) {
        next();
    }
    // Get the token from the request header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // If no token is provided
    if (token == null) {
        return res.status(401).json({ message: 'You must provide a valid JWT token.' });
    }

    try {
        const secretKeyHex = process.env.SECRET_KEY;
        const secretKeyBuffer = Buffer.from(secretKeyHex, 'hex');

        // Verify JWT Token
        const tokenData = await jwtVerify(token, secretKeyBuffer);
        // Check if token is expired in database
        const isExpired = await db.isTokenBlacklisted(token);
        if (isExpired) {
            return res.status(401).json({ message: 'Provided JWT token is invalid.' });
        }

        // Add user information to request
        req.user = { userId: tokenData.userId, username: tokenData.username, email: tokenData.email };
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        updateEventLog(req, { error: 'Error in validating auth token.', details: err });
        // Handle error (token invalid or other errors)
        return res.status(401).json({ message: 'Provided JWT token is invalid.' });
    }
};

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
 * @param {Object} res - The response object from Express.js.
 * @param {Function} next - The next middleware function in the Express.js route.
 */
const authenticateUser = async (req, res, next) => {
    if (req.user) {
        next();
    }
    // Get the token from the request header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // If no token is provided
    if (!token) {
        req.user = { userId: 0, username: 'public', email: null };
        next();
    } else {
        try {
            const secretKeyHex = process.env.SECRET_KEY;
            const secretKeyBuffer = Buffer.from(secretKeyHex, 'hex');

            // Verify JWT Token
            const tokenData = await jwtVerify(token, secretKeyBuffer);
            const userId = await db.getUserIdByUsername(tokenData.username);
            // Check if token is expired in database
            const isExpired = await db.isTokenBlacklisted(token) || tokenData.userId != userId;
            if (isExpired) {
                req.user = { userId: 0, username: 'public', email: null };
                next();
            } else {
                req.user = { userId: tokenData.userId, username: tokenData.username, email: tokenData.email };
                next();
            }
        } catch (err) {
            updateEventLog(req, { error: 'Error in validating auth token.', details: err });
            req.user = { userId: 0, username: 'public', email: null };
            next();
        }
    }
};

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
        const body = {
            dom: extraData.dom,
            obj: extraData.obj,
            act: extraData.act,
            attrs: extraData.attrs
        };

        const serviceUrl = process.env.BASE_URL + '/v1/authorize';

        const authHeader = req.headers['authorization'];

        const response = await axios.post(serviceUrl, body, {
            headers: {
                Authorization: authHeader
            }
        });

        const { user, roles, conditions } = response.data;
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
            await updateEventLog(req, { success: 'User has been authorized.', details: response.data });
        }
        next();
    } catch (error) {
        await updateEventLog(req, { error: 'Error in authorize user.', details: error });
        if (error.response) {
            // Relay the entire response from the external service
            return res.status(error.response.status).json(error.response.data);
        }
        // Default to a 500 status code if no specific response is available
        return res.sendStatus(500);
    }
};

/**
 * Middleware to validate request data using validationResult.
 * It checks if the request meets the validation criteria set by previous validation middlewares.
 * If the validation fails, it sends a 400 status code with the validation errors.
 * Otherwise, it passes control to the next middleware function in the stack.
 *
 * @param {object} req - The request object from Express.js containing the client's request data.
 * @param {object} res - The response object from Express.js used to send back the desired HTTP response.
 * @param {function} next - The callback function to pass control to the next middleware function.
 */
const checkRequestValidity = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = { userMustNotExist, userMustExist, testUrlAccessibility, isValidUrl, authenticateToken, authenticateUser, authorizeUser, checkRequestValidity };