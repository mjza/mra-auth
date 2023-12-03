const db = require('../db/database');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const userMustNotExist = async (username) => {
    // Database logic to check if the user exists
    const user = await db.getUserByUsername(username);
    if (user) {
        return Promise.reject('Username already exists.');
    }
};

const userMustExist = async (username) => {
    // Database logic to check if the user exists
    const user = await db.getUserByUsername(username);
    if (!user) {
        return Promise.reject('Username does not exist.');
    }
};

const testUrlAccessibility = async function (url) {
    try {
        // Use axios to make a HEAD request to the URL
        await axios.head(url);
        return true; // URL is accessible
    } catch (error) {
        return false; // URL is not accessible
    }
};

const isValidUrl = (inputUrl) => {
    try {
        const parsedUrl = new URL(inputUrl);
        return true;
    } catch (error) {
        return false;
    }
};

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
      return res.status(403).json({ message: 'Provided JWT token is invalid.'});; 
    }

    req.user = user; // Add user information to request
    next(); // Proceed to the next middleware or route handler
  });
};


module.exports = { userMustNotExist, userMustExist, testUrlAccessibility, isValidUrl, authenticateToken };