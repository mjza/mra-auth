import { userMustNotExist, userMustExist, testUrlAccessibility, isValidUrl, authenticateToken } from '../../utils/validations.mjs';
import { closeDBConnections, insertUser, deleteUserByUsername } from '../../utils/database.mjs';
import { generateMockUserDB, generateRandomString, generateAuthToken } from '../../utils/generators.mjs';
import Backend from 'i18next-fs-backend';
import i18next, { use } from 'i18next';
import { join } from 'path';

describe('Test validation functions', () => {

    // For translations it is needed to init the i18next
    beforeAll(async () => {
        // Initialize i18next for testing without the full app
        await use(Backend).init({
            fallbackLng: 'en',
            preload: ['en'], // Preload the necessary languages
            backend: {
                loadPath: join(__dirname, '../locales/{{lng}}.json'), // Path to translation files
            }
        });
    });

    // Ensure the app resources are closed after all tests
    afterAll(async () => {
        await closeDBConnections();
    });

    describe('User Existence Checks', () => {
        let mockUser;

        beforeAll(async () => {
            mockUser = await generateMockUserDB();
        });

        beforeEach(async () => {
            // Insert a test user into the database
            await insertUser(mockUser);
        });

        afterEach(async () => {
            // Clean up the test user from the database
            await deleteUserByUsername(mockUser.username);
        });

        const strangeUserName = generateRandomString(30);

        test('userMustNotExist should reject if user exists', async () => {
            await expect(userMustNotExist(mockUser.username, { req: i18next })).rejects.toEqual('Username already exists.');
        });

        test('userMustNotExist should resolve if user does not exist', async () => {
            await expect(userMustNotExist(strangeUserName, { req: i18next })).resolves.toBeUndefined();
        });

        test('userMustExist should resolve if user exists', async () => {
            await expect(userMustExist(mockUser.username, { req: i18next })).resolves.toBeUndefined();
        });

        test('userMustExist should reject if user does not exist', async () => {
            await expect(userMustExist(strangeUserName, { req: i18next })).rejects.toEqual('Username does not exist.');
        });
    });

    describe('URL Tests', () => {
        test('testUrlAccessibility returns true for an accessible URL', async () => {
            await expect(testUrlAccessibility('https://www.example.com')).resolves.toBeTruthy();
        });

        // This test might be less reliable as it depends on an external service being down
        test('testUrlAccessibility returns false for an inaccessible URL', async () => {
            await expect(testUrlAccessibility('https://thisurldoesnotexist1234.com')).resolves.toBeFalsy();
        });

        test('should return true for a valid URL', () => {
            expect(isValidUrl('https://www.example.com')).toBeTruthy();
        });

        test('should return false for an invalid URL', () => {
            expect(isValidUrl('not a url')).toBeFalsy();
        });
    });

    describe('Token Authentication Middleware', () => {
        const validToken = generateAuthToken({ userId: 1, username: 'username1', email: 'test@example.com' });
        const invalidToken = 'thisIsAnInvalidToken';

        // ToDo Old token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQwLCJ1c2VybmFtZSI6InVzZW5hbWUyIiwiZW1haWwiOiJtYWhkaS5qYnpAZ21haWwuY29tIiwiaWF0IjoxNzAxNzYxMDM4LCJleHAiOjE3MDE4NDc0Mzh9.hewZldHmLoQRC-bVYq8zwlaPqcSqJIyWLFA4FQ34efY' 

        test('authenticateToken authenticates a valid token', async () => {
            const req = { headers: { authorization: `Bearer ${validToken}` } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            await authenticateToken(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('authenticateToken sends 403 if invalid token is provided', async () => {
            const req = { ...i18next, headers: { authorization: `Bearer ${invalidToken}` } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Provided JWT token is invalid.' });
        });

        test('authenticateToken sends 401 if no token is provided', async () => {
            const req = { ...i18next, headers: { authorization: 'Bearer' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'You must provide a valid JWT token.' });
        });

        test('authenticateToken sends 401 if no auth header is provided', async () => {
            const req = { ...i18next, headers: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'You must provide a valid JWT token.' });
        });

    });

});