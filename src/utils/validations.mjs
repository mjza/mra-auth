import axios from 'axios';
import { validationResult } from 'express-validator';
import { Agent } from 'https';
import pkg from 'jsonwebtoken';
const { verify } = pkg;
import { promisify } from 'util';
import { getUserByUsername, getUserIdByUsername, isTokenBlacklisted } from './database.mjs';
import { createEventLog, updateEventLog } from './logger.mjs';

const jwtVerify = promisify(verify);

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
        const _ = new URL(inputUrl);
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
        return res.status(401).json({ message: req.t('You must provide a valid JWT token.') });
    }

    try {
        const secretKeyHex = process.env.SECRET_KEY;
        const secretKeyBuffer = Buffer.from(secretKeyHex, 'hex');

        // Verify JWT Token
        const tokenData = await jwtVerify(token, secretKeyBuffer);
        // Check if token is expired in database
        const isExpired = await isTokenBlacklisted(token);
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
            const userId = await getUserIdByUsername(tokenData.username);
            // Check if token is expired in database
            const isExpired = await isTokenBlacklisted(token) || tokenData.userId != userId;
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

/**
 * Middleware to handle and respond to invalid JSON format errors.
 * This middleware captures `SyntaxError` thrown by the `express.json()` middleware
 * when the incoming request contains invalid JSON. It extracts useful information
 * about the error, including the error type, message, and position where the error
 * occurred in the JSON string, and sends a detailed response back to the client.
 *
 * @param {object} err - The error object thrown by `express.json()` when it encounters malformed JSON.
 * @param {object} req - The request object from Express.js containing the client's request data.
 * @param {object} res - The response object from Express.js used to send back the desired HTTP response.
 * @param {function} next - The callback function to pass control to the next middleware function.
 *
 * @returns {void|object} - Sends a 400 error response with details if the error is a `SyntaxError`.
 *                          Otherwise, passes control to the next middleware.
 *
 * @example
 * // Usage as part of the Express middleware stack:
 * app.use(express.json());
 * app.use(checkJSONBody);
 */
const checkJSONBody = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        // Extract relevant details from the error message
        const position = err.message.match(/position (\d+)/)?.[1] || req.t('Unknown');
        const errorSnippet = err.message.split('\n')[0]; // Get first line of the error

        return res.status(400).json({
            message: req.t('Invalid JSON format.'),
            details: {
                type: err.type,
                error: errorSnippet,  // Include the main error message
                position: position,  // Provide position of the error in the JSON string
                hint: req.t('Ensure that all keys and values are properly enclosed in double quotes.')
            }
        });
    }
    next();
};

/**
 * Function to validate an email address format.
 * It uses a regular expression to check if the email follows the standard email format.
 *
 * @param {string} email - The email address to validate.
 * @returns {boolean} - Returns true if the email is valid, otherwise false.
 *
 * @example
 * isValidEmail('test@example.com'); // true
 * isValidEmail('invalid-email'); // false
 */
const isValidEmail = (email) => {
    // Regular expression for basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

export { authenticateToken, authenticateUser, authorizeUser, checkJSONBody, checkRequestValidity, isValidEmail, isValidUrl, testUrlAccessibility, userMustExist, userMustNotExist };
