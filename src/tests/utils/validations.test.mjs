import i18next, { use } from 'i18next';
import Backend from 'i18next-fs-backend';
import { join } from 'path';
import { closeDBConnections, deleteUserByUsername, insertBlacklistToken, insertUser } from '../../utils/database.mjs';
import { generateAuthToken, generateMockUserDB, generateRandomString, parseJwt } from '../../utils/generators.mjs';
import { authenticateToken, authenticateUser, userMustExist, userMustNotExist } from '../../utils/validations.mjs';

describe('Test validation functions', () => {

    // For translations it is needed to init the i18next
    beforeAll(async () => {
        // Initialize i18next for testing without the full app
        await use(Backend).init({
            fallbackLng: 'en',
            preload: ['en'], // Preload the necessary languages
            backend: {
                loadPath: join(process.cwd(), '/src/locales/{{lng}}.json'), // Path to translation files
            }
        });
    });

    // Ensure the app resources are closed after all tests
    afterAll(async () => {
        await closeDBConnections();
    });

    describe('userMustNotExist, userMustExist', () => {
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

    describe('authenticateToken', () => {

        let mockUser, testUser, user, validToken;
        const invalidToken = 'thisIsAnInvalidToken';
        const oldToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQwLCJ1c2VybmFtZSI6InVzZW5hbWUyIiwiZW1haWwiOiJtYWhkaS5qYnpAZ21haWwuY29tIiwiaWF0IjoxNzAxNzYxMDM4LCJleHAiOjE3MDE4NDc0Mzh9.hewZldHmLoQRC-bVYq8zwlaPqcSqJIyWLFA4FQ34efY';
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        beforeAll(async () => {
            mockUser = await generateMockUserDB();
            // Insert a test user into the database
            testUser = await insertUser(mockUser);
            user = { userId: testUser.user_id, username: testUser.username, email: testUser.email };
            validToken = generateAuthToken(user);
        });

        afterAll(async () => {
            // Clean up the test user from the database
            await deleteUserByUsername(mockUser.username);
        });

        test('authenticateToken sends 401 if no token is provided', async () => {
            const req = { ...i18next, headers: { authorization: 'Bearer' } };
            const next = jest.fn();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'You must provide a valid JWT token.' });
        });

        test('authenticateToken sends 401 if no auth header is provided', async () => {
            const req = { ...i18next, headers: {} };
            const next = jest.fn();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'You must provide a valid JWT token.' });
        });

        test('authenticateToken authenticates a valid token', async () => {
            const req = { headers: { authorization: `Bearer ${validToken}` } };
            const next = jest.fn((_) => {
                // This is the next middleware where we check the req.user
                expect(req.user).toEqual(user);
            });

            await authenticateToken(req, res, next);

            // Check if next was called without an error
            expect(next).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalledWith(expect.anything()); // Ensures next() is called without an error
        });

        test('authenticateToken sends 401 if expired token is provided', async () => {

            const tokenData = parseJwt(validToken);

            // Insert the token into the blacklist
            await insertBlacklistToken({ token: validToken, expiry: tokenData.exp });

            const req = { ...i18next, headers: { authorization: `Bearer ${validToken}` } };
            const next = jest.fn();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Provided JWT token is invalid.' });
            expect(next).not.toHaveBeenCalled();
        });

        test('authenticateToken sends 401 if invalid token is provided', async () => {
            const req = { ...i18next, headers: { authorization: `Bearer ${invalidToken}` } };
            const next = jest.fn();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Provided JWT token is invalid.' });
            expect(next).not.toHaveBeenCalled();
        });

        test('authenticateToken sends 401 if old token is provided', async () => {
            const req = { ...i18next, headers: { authorization: `Bearer ${oldToken}` } };
            const next = jest.fn();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Provided JWT token is invalid.' });
            expect(next).not.toHaveBeenCalled();
        });



    });

    describe('authenticateUser', () => {

        let mockUser, testUser, user, validToken;

        const publicUser = { userId: 0, username: 'public', email: null };
        const invalidToken = 'thisIsAnInvalidToken';
        const oldToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQwLCJ1c2VybmFtZSI6InVzZW5hbWUyIiwiZW1haWwiOiJtYWhkaS5qYnpAZ21haWwuY29tIiwiaWF0IjoxNzAxNzYxMDM4LCJleHAiOjE3MDE4NDc0Mzh9.hewZldHmLoQRC-bVYq8zwlaPqcSqJIyWLFA4FQ34efY';
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        beforeAll(async () => {
            mockUser = await generateMockUserDB();
            // Insert a test user into the database
            testUser = await insertUser(mockUser);
            user = { userId: testUser.user_id, username: testUser.username, email: testUser.email };
            validToken = generateAuthToken(user);
        });

        afterAll(async () => {
            // Clean up the test user from the database
            await deleteUserByUsername(mockUser.username);
        });

        test('authenticateUser authenticates a valid token', async () => {
            const req = { headers: { authorization: `Bearer ${validToken}` } };
            const next = jest.fn((_) => {
                expect(req.user).toEqual(user);
            });

            await authenticateUser(req, res, next);

            // Check if next was called without an error
            expect(next).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalledWith(expect.anything()); // Ensures next() is called without an error
        });

        test('authenticateUser authenticates as a public user if expired token is provided', async () => {

            const tokenData = parseJwt(validToken);

            // Insert the token into the blacklist
            await insertBlacklistToken({ token: validToken, expiry: tokenData.exp });

            const req = { ...i18next, headers: { authorization: `Bearer ${validToken}` } };
            const next = jest.fn((_) => {
                expect(req.user).toEqual(publicUser);
            });

            await authenticateUser(req, res, next);

            // Check if next was called without an error
            expect(next).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalledWith(expect.anything()); // Ensures next() is called without an error
        });

        test('authenticateUser authenticates as a public user if invalid token is provided', async () => {
            const req = { ...i18next, headers: { authorization: `Bearer ${invalidToken}` } };
            const next = jest.fn((_) => {
                expect(req.user).toEqual(publicUser);
            });

            await authenticateUser(req, res, next);

            // Check if next was called without an error
            expect(next).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalledWith(expect.anything()); // Ensures next() is called without an error
        });

        test('authenticateUser authenticates as a public user if old token is provided', async () => {
            const req = { ...i18next, headers: { authorization: `Bearer ${oldToken}` } };
            const next = jest.fn((_) => {
                expect(req.user).toEqual(publicUser);
            });

            await authenticateUser(req, res, next);

            // Check if next was called without an error
            expect(next).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalledWith(expect.anything()); // Ensures next() is called without an error
        });

        test('authenticateUser authenticates as a public user if no token is provided', async () => {
            const req = { ...i18next, headers: { authorization: 'Bearer' } };
            const next = jest.fn((_) => {
                expect(req.user).toEqual(publicUser);
            });

            await authenticateUser(req, res, next);

            // Check if next was called without an error
            expect(next).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalledWith(expect.anything()); // Ensures next() is called without an error
        });

        test('authenticateUser authenticates as a public user if no auth header is provided', async () => {
            const req = { ...i18next, headers: {} };
            const next = jest.fn((_) => {
                expect(req.user).toEqual(publicUser);
            });

            await authenticateUser(req, res, next);

            // Check if next was called without an error
            expect(next).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalledWith(expect.anything()); // Ensures next() is called without an error
        });
    });
});
