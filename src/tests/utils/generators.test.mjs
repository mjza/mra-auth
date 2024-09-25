import { compare } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { extractUserDataFromAuthToke, generateActivationLink, generateAuthToken, generateDecryptedObject, generateEncryptedObject, generateMockUserDB, generateMockUserRoute, generatePasswordHash, generateRandomString, generateResetPasswordLink, parseJwt } from '../../utils/generators.mjs';

describe('Generator Functions', () => {
    describe('generateEncryptedObject', () => {
        it('should return an object with token and data', () => {
            const activationCode = '12345';
            const redirectURL = 'http://example.com';

            const result = generateEncryptedObject(activationCode, redirectURL);

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('data');
            expect(typeof result.token).toBe('string');
            expect(typeof result.data).toBe('string');
        });
    });

    describe('generateActivationLink', () => {
        it('should return a valid activation link', () => {
            const username = 'testuser';
            const code = '12345';
            const redirectURL = 'http://example.com/login';

            const result = generateActivationLink(username, code, redirectURL);

            expect(typeof result).toBe('string');
            expect(result).toContain('/activate');
            expect(result).toContain(username);
            expect(result).toContain('token');
            expect(result).toContain('data');
        });
    });

    describe('generateResetPasswordLink', () => {
        it('should return a valid activation link', () => {
            const username = 'testuser';
            const resetToken = '12345';
            const redirectURL = 'http://example.com/new_password';

            const result = generateResetPasswordLink(username, resetToken, redirectURL);

            expect(typeof result).toBe('string');
            expect(result).toContain(username);
            expect(result).toContain('token');
            expect(result).toContain('data');
        });
    });

    describe('generateDecryptedObject', () => {
        it('should return an object with code and redirectURL', () => {
            const username = 'testuser';
            const code = '12345';
            const redirectURL = 'http://example.com/login';

            const link = generateActivationLink(username, code, redirectURL);
            const url = new URL(link);
            const queryParams = new URLSearchParams(url.search);

            const token = queryParams.get('token');
            const data = queryParams.get('data');

            const result = generateDecryptedObject(token, data);

            expect(result).toHaveProperty('code');
            expect(result).toHaveProperty('redirectURL');
            expect(typeof result.code).toBe('string');
            expect(typeof result.redirectURL).toBe('string');
            expect(result.code).toBe(code);
            expect(result.redirectURL).toBe(redirectURL);
        });
    });

    describe('generatePasswordHash', () => {
        it('should generate a hash for a given password', async () => {
            const password = 'Pasword2$';
            const hash = await generatePasswordHash(password);

            // Verify that the hash is not the same as the plain password
            expect(hash).not.toBe(password);

            // Verify that the hash can be validated against the original password
            const isMatch = await compare(password, hash);
            expect(isMatch).toBeTruthy();
        });
    });

    describe('generateRandomString', () => {
        it('should return a string of default length 8', () => {
            const result = generateRandomString();

            expect(typeof result).toBe('string');
            expect(result).toHaveLength(8);
        });

        it('should return a string of specified length', () => {
            const length = 10;
            const result = generateRandomString(length);

            expect(typeof result).toBe('string');
            expect(result).toHaveLength(length);
        });
    });

    describe('generateMockUserDB', () => {
        it('should generate a user object with a hashed password', async () => {
            const user = await generateMockUserDB();

            // Check that all properties exist
            expect(user).toHaveProperty('username');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('password', 'Password1$');
            expect(user).toHaveProperty('passwordHash');

            // Check that the email includes the username
            expect(user.email).toBe(user.email);

            // Verify that the password is hashed
            const isMatch = await compare('Password1$', user.passwordHash);
            expect(isMatch).toBeTruthy();
        });
    });

    describe('generateMockUserRoute', () => {
        it('should generate a user object with loginRedirectURL', () => {
            const user = generateMockUserRoute();

            // Check that all properties exist
            expect(user).toHaveProperty('username');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('password', 'Password1$');
            expect(user).toHaveProperty('loginRedirectURL', 'http://example.com/');

            // Check that the email includes the username
            expect(user.email).toBe(user.email);
        });
    });

    describe('Auth Token Tests', () => {
        const user = { userId: 1, username: 'username1', email: 'test@example.com' };
        const secretKeyHex = process.env.SECRET_KEY;
        const secretKeyBuffer = Buffer.from(secretKeyHex, 'hex');

        test('generateAuthToken should return a valid JWT', () => {
            const token = generateAuthToken(user, secretKeyBuffer);
            expect(token).toBeDefined();
            const decoded = verify(token, secretKeyBuffer);
            expect(decoded.userId).toBe(user.userId);
            expect(decoded.username).toBe(user.username);
            expect(decoded.email).toBe(user.email);
        });

        test('extractUserDataFromAuthToke should return correct user data from token', () => {
            const token = sign(user, secretKeyBuffer, { expiresIn: '1d' });
            const extractedData = extractUserDataFromAuthToke(token, secretKeyBuffer);
            expect(extractedData.userId).toBe(user.userId);
            expect(extractedData.username).toBe(user.username);
            expect(extractedData.email).toBe(user.email);
        });

        test('parseJwt should return a valid json object', () => {
            const token = generateAuthToken(user, secretKeyBuffer);
            const extractedData = parseJwt(token);

            const oneDayInMilliseconds = 24 * 60 * 60 * 1000 + 1000; // milliseconds in a day + 1 sec
            const currentTimeInMilliseconds = new Date().getTime(); // current time in milliseconds
            const futureTimestamp = Math.floor((currentTimeInMilliseconds + oneDayInMilliseconds) / 1000); // convert to seconds

            expect(extractedData.userId).toBe(user.userId);
            expect(extractedData.username).toBe(user.username);
            expect(extractedData.email).toBe(user.email);
            expect(Number.isInteger(extractedData.iat)).toBe(true);            
            expect(extractedData.iat).toBeGreaterThanOrEqual(0);
            expect(extractedData.iat).toBeLessThan(futureTimestamp);
            expect(Number.isInteger(extractedData.exp)).toBe(true);
            expect(extractedData.exp).toBeGreaterThanOrEqual(0);
            expect(extractedData.exp).toBeLessThan(futureTimestamp);

        });
    });
});
