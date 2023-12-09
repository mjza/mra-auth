const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const secretKeyHex = process.env.SECRET_KEY;
const secretKey = Buffer.from(secretKeyHex, 'hex');

/**
 * Encrypts a given text using AES-256-CTR encryption algorithm.
 * 
 * @param {string} text - The text to be encrypted.
 * @param {Buffer} [iv] - The initialization vector. If not provided, a random 16-byte IV is generated.
 * @returns {string} A base64 encoded string representing the encrypted text. Returns the original text if an error occurs.
 */
const encrypt = (text, iv) => {
    try {
        iv = iv != null ? iv : crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
        const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
        const hashObject = { iv: iv.toString('hex'), content: encrypted.toString('hex') };
        const jsonString = JSON.stringify(hashObject);
        const base64String = Buffer.from(jsonString).toString('base64');
        return base64String;
    } catch {
        return text;
    }
};

/**
 * Decrypts a base64 encoded string that was encrypted using the encrypt function.
 * 
 * @param {string} base64String - A base64 encoded string representing the encrypted text.
 * @returns {string} The decrypted text. Returns the original base64 string if an error occurs during decryption.
 */
const decrypt = (base64String) => {
    try {
        const jsonString = Buffer.from(base64String, 'base64').toString('utf-8');
        const hashObject = JSON.parse(jsonString);
        const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hashObject.iv, 'hex'));
        const decrpyted = Buffer.concat([decipher.update(Buffer.from(hashObject.content, 'hex')), decipher.final()]);
        return decrpyted.toString();
    } catch {
        return base64String;
    }
};

/**
 * Encrypts all string values within an object.
 * 
 * @param {Object} obj - The object whose string values are to be encrypted.
 * @param {Buffer} [iv] - The initialization vector for encryption. If not provided, a random 16-byte IV is generated.
 * @returns {Object} A new object with all string values encrypted. Non-string values are copied as is.
 */
const encryptObjectItems = (obj, iv) => {
    const convertedObject = {};

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'string') {
                convertedObject[key] = encrypt(obj[key], iv);
            } else {
                convertedObject[key] = obj[key];
            }
        }
    }

    return convertedObject;
};

/**
 * Decrypts all string values within an object that were encrypted using encryptObjectItems.
 * 
 * @param {Object} obj - The object with encrypted string values.
 * @returns {Object} A new object with all string values decrypted. Non-string values are copied as is.
 */
const decryptObjectItems = (obj) => {
    const convertedObject = {};

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'string') {
                convertedObject[key] = decrypt(obj[key]);
            } else {
                convertedObject[key] = obj[key];
            }
        }
    }

    return convertedObject;
};

/**
 * Converts the keys of an object from snake_case to lowerCamelCase.
 * 
 * @param {Object} obj - The object whose keys need to be converted.
 * @returns {Object} A new object with all keys in lowerCamelCase.
 */
const toLowerCamelCase = (obj) => {
    const convertedObject = {};

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            convertedObject[camelCaseKey] = obj[key];
        }
    }

    return convertedObject;
};

/**
 * Extracts key information from the Express request object and returns it as a JSON string.
 * Handles circular references in the object structure to ensure proper JSON serialization.
 * 
 * @param {object} req - The Express request object.
 * @returns {string} A JSON string representing key information from the request object.
 *
 * @example
 * app.use((req, res, next) => {
 *   const requestData = extractRequestData(req);
 *   console.log(requestData); // Logs serialized request data
 *   next();
 * });
 * 
 * The function selectively extracts data such as HTTP method, URL, headers, body, query parameters,
 * IP address, and more. It's designed to be used in middleware for logging or auditing purposes.
 * Note: Ensure that any middleware required for populating these fields (like body-parser for `req.body`, 
 * or cookie-parser for `req.cookies`) is set up in your Express application.
 */
function convertRequestData(req) {
    const requestData = {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.body, // Make sure you have body-parser middleware if you need this
        query: req.query,
        params: req.params,
        ip: req.ip,
        hostname: req.hostname,
        protocol: req.protocol,
        path: req.path,
        cookies: req.cookies, // Requires cookie-parser middleware if used
    };

    // Handling circular structures in JSON stringify
    const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return;
                }
                seen.add(value);
            }
            return value;
        };
    };

    return JSON.stringify(requestData, getCircularReplacer());
}


module.exports = { toLowerCamelCase, encrypt, decrypt, encryptObjectItems, decryptObjectItems, convertRequestData};
