const crypto = require('crypto');
const bcrypt = require('bcrypt');

/**
 * Generates an encrypted activation object containing the activation code and redirect URL.
 * @param {string} activationCode - The activation code to be encrypted.
 * @param {string} redirectURL - The URL where the user will be redirected after activation.
 * @returns {object} An object {token, data} containing the token and encrypted data.
 */
const generateEncryptedActivationObject = (activationCode, redirectURL) => {
    try {
        // Encrypt the activation object using a secret key
        const secretKeyHex = process.env.SECRET_KEY;
        const secretKeyBuffer = Buffer.from(secretKeyHex, 'hex');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', secretKeyBuffer, iv);
        let encryptedActivationObject = cipher.update(JSON.stringify({ activationCode, redirectURL }), 'utf8', 'hex');
        encryptedActivationObject += cipher.final('hex');
        return { token: iv.toString('hex'), data: encryptedActivationObject };
    } catch {
        return { token: '', data: '' };
    }
};

/**
 * Generates an activation link using the username, activation code, and redirect URL.
 * @param {string} username - The username for which the activation link is generated.
 * @param {string} activationCode - The activation code for the user.
 * @param {string} redirectURL - The URL to redirect the user after activation.
 * @returns {string} The generated activation link.
 */
const generateActivationLink = (username, activationCode, redirectURL) => {
    const activationObject = generateEncryptedActivationObject(activationCode, redirectURL);
    // Create the activation link
    const activationLink = `${process.env.BASE_URL}/activate?username=${username}&token=${activationObject.token}&data=${activationObject.data}`;
    return activationLink;
};

/**
 * Decrypts an activation object from the given token and encrypted data.
 * @param {string} token - The token used for decryption (includes IV).
 * @param {string} data - The encrypted data.
 * @returns {object} An object { activationCode, redirectURL } containing the decrypted activation code and redirect URL.
 */
const generateDecryptedActivationObject = (token, data) => {
    try {
        // Convert token (which includes IV) to a buffer
        const iv = Buffer.from(token, 'hex');

        // Decrypt the encrypted data using the secret key and IV
        const secretKeyHex = process.env.SECRET_KEY;
        const secretKeyBuffer = Buffer.from(secretKeyHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', secretKeyBuffer, iv);
        // Decrypt the encryptedActivationObject
        let decryptedActivationObjectHex = decipher.update(data, 'hex', 'utf8');
        decryptedActivationObjectHex += decipher.final('utf8');

        // Parse the JSON back into an object
        const decryptedActivationObject = JSON.parse(decryptedActivationObjectHex);
        return decryptedActivationObject;
    } catch {
        return { activationCode: '', redirectURL: '' };
    }
};

/**
 * Generates a hash for a given password using bcrypt.
 * 
 * @param {string} password - The password to be hashed.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 */
const generatePasswordHash = async (password) => {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    return passwordHash;
};

/**
 * Generates a random string of a specified length.
 * @param {number} [length=8] - The length of the string to generate. Default is 8 characters.
 * @returns {string} A random string of the specified length.
 */
const generateRandomString = (length = 8) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
};

/**
 * Asynchronously generates a mock user object with hashed password.
 * The function generates a random username and uses it to create an email.
 * It also generates a password hash for a predefined password.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing username, email, password, and passwordHash.
 */
const generateMockUserDB = async () => {
    var username = generateRandomString();
    return {
        username: username,
        email: username + '@example.com',
        password: 'Pasword1$',
        passwordHash: await generatePasswordHash('Pasword1$')
    };
};

/**
 * Generates a mock user object for a user route.
 * This function creates a random username and uses it to construct an email.
 * It also sets a predefined password and a login redirect URL.
 * 
 * @returns {Object} An object containing username, email, password, and loginRedirectURL.
 */
const generateMockUserRoute = () => {
    var username = generateRandomString();
    return {
        username: username,
        email: username + '@example.com',
        password: 'Pasword1$',
        loginRedirectURL: 'http://localhost:3000/login'
    }
};

module.exports = { generateRandomString, generateMockUserDB, generateMockUserRoute, generateEncryptedActivationObject, generateActivationLink, generateDecryptedActivationObject, generatePasswordHash };