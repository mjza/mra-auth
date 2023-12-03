const db = require('../db/database');
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

module.exports = { userMustNotExist, userMustExist, testUrlAccessibility, isValidUrl };