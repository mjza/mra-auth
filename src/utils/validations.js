const db = require('./database');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { Agent } = require('https');
const { promisify } = require('util');
const jwtVerify = promisify(jwt.verify);
const { recordErrorLog } = require('../routes/v1/auditLogMiddleware');

/**
 * @swagger
 * components:
 *   responses:
 *     UserMustNotExistError:
 *         description: Invalid request parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: field
 *                       value:
 *                         type: string
 *                         example: usernameX
 *                       msg:
 *                         type: string
 *                         example: Username already exists.
 *                       path:
 *                         type: string
 *                         example: username
 *                       location:
 *                         type: string
 *                         example: query
 */
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
 * @swagger
 * components:
 *   responses:
 *     UserMustExistError:
 *         description: Invalid request parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: field
 *                       value:
 *                         type: string
 *                         example: usernameX
 *                       msg:
 *                         type: string
 *                         example: Username does not exist.
 *                       path:
 *                         type: string
 *                         example: username
 *                       location:
 *                         type: string
 *                         example: query
 */
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
        req.user = {userId: tokenData.userId, username: tokenData.username, email: tokenData.email}; 
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        recordErrorLog(req, { error: 'Error in validating auth token.', details: err});
        // Handle error (token invalid or other errors)
        return res.status(401).json({ message: 'Provided JWT token is invalid.' });
    }
};

module.exports = { userMustNotExist, userMustExist, testUrlAccessibility, isValidUrl, authenticateToken };