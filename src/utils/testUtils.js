function generateRandomString(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let username = '';

    for (let i = 0; i < length; i++) {
        username += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return username;
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

module.exports = {generateRandomString, mockUserDB, mockUserRoute};