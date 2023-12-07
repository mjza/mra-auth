const crypto = require('crypto');

// returns a object {token, data}
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

// returns string 
const generateActivationLink = (username, activationCode, redirectURL) => {
    const activationObject = generateEncryptedActivationObject(activationCode, redirectURL);
    // Create the activation link
    const activationLink = `${process.env.BASE_URL}/activate?username=${username}&token=${activationObject.token}&data=${activationObject.data}`;
    return activationLink;
};

// returns a object const { activationCode, redirectURL }
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

function generateRandomString(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
}

const mockUserDB = {
    username: generateRandomString(),
    email: generateRandomString() + '@example.com',
    passwordHash: '$2b$10$3mNQEYa8JkvoHOcBBgSGeedoH2Bj.eGgbYH6mqcWDFargA0yF90SG'
};

const mockUserRoute = {
    username: generateRandomString(),
    email: generateRandomString() + '@example.com',
    password: 'Pasword1$',
    "loginRedirectURL": "http://localhost:3000/login"
};

module.exports = { generateRandomString, mockUserDB, mockUserRoute, generateEncryptedActivationObject, generateActivationLink, generateDecryptedActivationObject };