import { genSalt, hash } from 'bcrypt';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import { getCreptoConfig } from './miscellaneous.mjs';

/**
 * Generates an encrypted activation/reset object containing the activation/reset code and redirect URL.
 * @param {string} code - The code/token to be encrypted.
 * @param {string} redirectURL - The URL where the user will be redirected after activation.
 * @returns {object} An object {token, data} containing the token and encrypted data.
 */
const generateEncryptedObject = (code, redirectURL) => {
    try {
        const config = getCreptoConfig();
        // Encrypt the activation object using a secret key        
        const iv = randomBytes(16);
        const cipher = createCipheriv(config.algorithm, config.secretKey, iv);
        let encryptedObject = cipher.update(JSON.stringify({ code, redirectURL }), 'utf8', 'hex');
        encryptedObject += cipher.final('hex');
        return { token: iv.toString('hex'), data: encryptedObject };
    } catch {
        return { token: '', data: '' };
    }
};

export { generateEncryptedObject };

/**
 * Decrypts an activation/reset object from the given token and encrypted data.
 * @param {string} token - The token used for decryption (includes IV).
 * @param {string} data - The encrypted data.
 * @returns {object} An object { code, redirectURL } containing the decrypted activation code and redirect URL.
 */
const generateDecryptedObject = (token, data) => {
    try {
        const config = getCreptoConfig();
        // Convert token (which includes IV) to a buffer
        const iv = Buffer.from(token, 'hex');
        // Decrypt the encrypted data using the secret key and IV
        const decipher = createDecipheriv(config.algorithm, config.secretKey, iv);
        // Decrypt the encryptedObject
        let decryptedObjectHex = decipher.update(data, 'hex', 'utf8');
        decryptedObjectHex += decipher.final('utf8');
        // Parse the JSON back into an object
        const decryptedObject = JSON.parse(decryptedObjectHex);
        return decryptedObject;
    } catch {
        return { code: '', redirectURL: '' };
    }
};

export { generateDecryptedObject };

/**
 * Generates an activation link using the username, activation code, and redirect URL.
 * @param {string} username - The username for which the activation link is generated.
 * @param {string} activationCode - The code/token for the user.
 * @param {string} redirectURL - The URL to redirect the user after activation.
 * @returns {string} The generated activation link.
 */
const generateActivationLink = (username, activationCode, redirectURL) => {
    const activationObject = generateEncryptedObject(activationCode, redirectURL);
    // Create the activation link
    const activationLink = `${process.env.BASE_URL}/v1/activate?username=${username}&token=${activationObject.token}&data=${activationObject.data}`;
    return activationLink;
};

export { generateActivationLink };

/**
 * Generates a reset password link using the username, reset token, and redirect URL.
 * @param {string} username - The username for which the activation link is generated.
 * @param {string} resetToken - The code/token for the user.
 * @param {string} redirectURL - The URL to redirect the user after activation.
 * @returns {string} The generated reset password link.
 */
const generateResetPasswordLink = (username, resetToken, redirectURL) => {
    const resetObject = generateEncryptedObject(resetToken);
    // Create the activation link
    const passwordResetLink = `${redirectURL}?username=${username}&token=${resetObject.token}&data=${resetObject.data}`;
    return passwordResetLink;
};

export { generateResetPasswordLink };

/**
 * Generates an authentication token for a user.
 * 
 * @param {object} user - The user object containing user details.
 * @returns {string} A JWT token encoded with the user's information.
 *
 * @example
 * const user = { userId: 123, username: 'johndoe', email: 'john@example.com' };
 * const token = generateAuthToken(user);
 */
const generateAuthToken = (user) => {
    try {
        const config = getCreptoConfig();
        const token = sign({ userId: user.userId, username: user.username, email: user.email }, config.secretKey, { expiresIn: '1d' });
        return token;
    } catch {
        return null;
    }
};

export { generateAuthToken };

/**
 * Extracts user data from a given JWT token.
 * 
 * @param {string} token - The JWT token to be decoded.
 * @returns {object} An object (i.e., { userId, username, email }) containing the userId, username, and email. 
 * 
 * @example
 * const token = '...'; // JWT token
 * const userData = extractUserDataFromAuthToke(token);
 */
const extractUserDataFromAuthToke = (token) => {
    try {
        const config = getCreptoConfig();
        const decodedToken = verify(token, config.secretKey);
        return decodedToken;
    } catch {
        return null;
    }
};

export { extractUserDataFromAuthToke };

/**
 * Decodes a JSON Web Token (JWT) and returns its payload as a JSON object.
 * 
 * This function splits the JWT into its constituent parts, decodes the Base64-encoded payload,
 * and then parses it into a JSON object. It's designed to handle the decoding process and
 * does not validate the token's signature. The function safely handles errors and returns
 * `null` if decoding fails.
 *
 * @param {string} token - The JWT string to be decoded.
 * @returns {object|null} The decoded payload as a JSON object, or `null` if decoding fails.
 * 
 * @example
 * // Typical usage
 * const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
 * const decodedPayload = parseJwt(token);
 * console.log(decodedPayload);
 */
const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
};

export { parseJwt };

/**
 * Generates a hash for a given password using bcrypt.
 * 
 * @param {string} password - The password to be hashed.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 */
const generatePasswordHash = async (password) => {
    // Hash the password
    const salt = await genSalt(10);
    const passwordHash = await hash(password, salt);
    return passwordHash;
};

export { generatePasswordHash };

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

export { generateRandomString };

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
        email: 'info@example.com',
        password: 'Password1$',
        passwordHash: await generatePasswordHash('Password1$')
    };
};

export { generateMockUserDB };

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
        email: 'info@example.com',
        password: 'Password1$',
        loginRedirectURL: 'http://example.com/'
    }
};

export { generateMockUserRoute };

