const db = require('../db/database');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { Agent } = require('https');

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
        await axios.head(url, { httpsAgent} );
        return true; // URL is accessible
    } catch (error) {
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
    } catch (error) {
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
 *                 example: You must provide a valid JWT token. | Provided JWT token is invalid.
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
const authenticateToken = (req, res, next) => {  
  // Get the token from the request header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {// If no token is provided
    return res.status(401).json({ message: 'You must provide a valid JWT token.'}); 
  }

  const secretKeyHex = process.env.SECRET_KEY;
  const secretKeyBuffer = Buffer.from(secretKeyHex, 'hex');

  jwt.verify(token, secretKeyBuffer, (err, user) => {
    if (err) {// If token is invalid
      return res.status(401).json({ message: 'Provided JWT token is invalid.'});; 
    }

    req.user = user; // Add user information to request
    next(); // Proceed to the next middleware or route handler
  });
};

module.exports = { userMustNotExist, userMustExist, testUrlAccessibility, isValidUrl, authenticateToken };