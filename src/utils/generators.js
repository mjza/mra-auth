const crypto = require('crypto');

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
 * Generates a random string of a specified length.
 * @param {number} [length=8] - The length of the string to generate. Default is 8 characters.
 * @returns {string} A random string of the specified length.
 */
function generateRandomString(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
}

// Mock data
const mockUserDB = {
    username: generateRandomString(),
    email: generateRandomString() + '@example.com',
    passwordHash: '$2b$10$3mNQEYa8JkvoHOcBBgSGeedoH2Bj.eGgbYH6mqcWDFargA0yF90SG'
};

// Mock data
const mockUserRoute = {
    username: generateRandomString(),
    email: generateRandomString() + '@example.com',
    password: 'Pasword1$',
    "loginRedirectURL": "http://localhost:3000/login"
};

module.exports = { generateRandomString, mockUserDB, mockUserRoute, generateEncryptedActivationObject, generateActivationLink, generateDecryptedActivationObject };