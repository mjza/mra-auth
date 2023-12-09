const { userMustNotExist, userMustExist, testUrlAccessibility, isValidUrl, authenticateToken } = require('../utils/validations');
const db = require('../utils/database');
const { generateMockUserDB, generateRandomString, generateAuthToken } = require('../utils/generators');

describe('Test validation functions', () => {

    describe('User Existence Checks', () => {
        let mockUser;

        beforeAll(async () => {
            mockUser = await generateMockUserDB();
        });

        beforeEach(async () => {
            // Insert a test user into the database
            await db.insertUser(mockUser);
        });

        afterEach(async () => {
            // Clean up the test user from the database
            await db.deleteUserByUsername(mockUser.username);
        });

        const strangeUserName = generateRandomString(30);

        test('userMustNotExist should reject if user exists', async () => {
            await expect(userMustNotExist(mockUser.username)).rejects.toEqual('Username already exists.');
        });

        test('userMustNotExist should resolve if user does not exist', async () => {
            await expect(userMustNotExist(strangeUserName)).resolves.toBeUndefined();
        });

        test('userMustExist should resolve if user exists', async () => {
            await expect(userMustExist(mockUser.username)).resolves.toBeUndefined();
        });

        test('userMustExist should reject if user does not exist', async () => {
            await expect(userMustExist(strangeUserName)).rejects.toEqual('Username does not exist.');
        });

        // Ensure the pool is closed after all tests
        afterAll(async () => {
            await db.closePool();
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
            const req = { headers: { authorization: `Bearer ${invalidToken}` } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Provided JWT token is invalid.' });
        });

        test('authenticateToken sends 401 if no token is provided', async () => {
            const req = { headers: { authorization: 'Bearer' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'You must provide a valid JWT token.' });
        });

        test('authenticateToken sends 401 if no auth header is provided', async () => {
            const req = { headers: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'You must provide a valid JWT token.' });
        });

    });
});