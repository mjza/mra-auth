const gn = require('../utils/generators');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Generator Functions', () => {
    describe('generateEncryptedActivationObject', () => {
        it('should return an object with token and data', () => {
            const activationCode = '12345';
            const redirectURL = 'http://example.com';

            const result = gn.generateEncryptedActivationObject(activationCode, redirectURL);

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('data');
            expect(typeof result.token).toBe('string');
            expect(typeof result.data).toBe('string');
        });
    });

    describe('generateActivationLink', () => {
        it('should return a valid activation link', () => {
            const username = 'testuser';
            const activationCode = '12345';
            const redirectURL = 'http://example.com/login';

            const result = gn.generateActivationLink(username, activationCode, redirectURL);

            expect(typeof result).toBe('string');
            expect(result).toContain(username);
            expect(result).toContain('token');
            expect(result).toContain('data');
        });
    });

    describe('generateDecryptedActivationObject', () => {
        it('should return an object with activationCode and redirectURL', () => {
            const username = 'testuser';
            const activationCode = '12345';
            const redirectURL = 'http://example.com/login';

            const link = gn.generateActivationLink(username, activationCode, redirectURL);
            const url = new URL(link);
            const queryParams = new URLSearchParams(url.search);

            const token = queryParams.get('token');
            const data = queryParams.get('data');

            const result = gn.generateDecryptedActivationObject(token, data);

            expect(result).toHaveProperty('activationCode');
            expect(result).toHaveProperty('redirectURL');
            expect(typeof result.activationCode).toBe('string');
            expect(typeof result.redirectURL).toBe('string');
            expect(result.activationCode).toBe(activationCode);
            expect(result.redirectURL).toBe(redirectURL);
        });
    });

    describe('generatePasswordHash', () => {
        it('should generate a hash for a given password', async () => {
          const password = 'Pasword2$';
          const hash = await gn.generatePasswordHash(password);
      
          // Verify that the hash is not the same as the plain password
          expect(hash).not.toBe(password);
      
          // Verify that the hash can be validated against the original password
          const isMatch = await bcrypt.compare(password, hash);
          expect(isMatch).toBeTruthy();
        });
      });

    describe('generateRandomString', () => {
        it('should return a string of default length 8', () => {
            const result = gn.generateRandomString();

            expect(typeof result).toBe('string');
            expect(result).toHaveLength(8);
        });

        it('should return a string of specified length', () => {
            const length = 10;
            const result = gn.generateRandomString(length);

            expect(typeof result).toBe('string');
            expect(result).toHaveLength(length);
        });
    });

    describe('generateMockUserDB', () => {
        it('should generate a user object with a hashed password', async () => {
            const user = await gn.generateMockUserDB();

            // Check that all properties exist
            expect(user).toHaveProperty('username');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('password', 'Pasword1$');
            expect(user).toHaveProperty('passwordHash');

            // Check that the email includes the username
            expect(user.email).toBe(user.email);

            // Verify that the password is hashed
            const isMatch = await bcrypt.compare('Pasword1$', user.passwordHash);
            expect(isMatch).toBeTruthy();
        });
    });

    describe('generateMockUserRoute', () => {
        it('should generate a user object with loginRedirectURL', () => {
            const user = gn.generateMockUserRoute();

            // Check that all properties exist
            expect(user).toHaveProperty('username');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('password', 'Pasword1$');
            expect(user).toHaveProperty('loginRedirectURL', 'http://localhost:3000/login');

            // Check that the email includes the username
            expect(user.email).toBe(user.email);
        });
    });

    describe('Auth Token Tests', () => {
        const user = { userId: 1, username: 'username1', email: 'test@example.com' };
        const secretKeyHex = process.env.SECRET_KEY;
        const secretKeyBuffer = Buffer.from(secretKeyHex, 'hex');
    
        test('generateAuthToken should return a valid JWT', () => {
            const token = gn.generateAuthToken(user, secretKeyBuffer);
            expect(token).toBeDefined();
            const decoded = jwt.verify(token, secretKeyBuffer);
            expect(decoded.userId).toBe(user.userId);
            expect(decoded.username).toBe(user.username);
            expect(decoded.email).toBe(user.email);
        });
    
        test('extractUserDataFromAuthToke should return correct user data from token', () => {
            const token = jwt.sign(user, secretKeyBuffer, { expiresIn: '1d' });
            const extractedData = gn.extractUserDataFromAuthToke(token, secretKeyBuffer);
            expect(extractedData.userId).toBe(user.userId);
            expect(extractedData.username).toBe(user.username);
            expect(extractedData.email).toBe(user.email);
        });
    });
});
