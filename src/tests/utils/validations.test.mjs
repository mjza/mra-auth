import express, { json } from 'express';
import { body, query } from 'express-validator';
import i18next, { use } from 'i18next';
import Backend from 'i18next-fs-backend';
import { join } from 'path';
import request from 'supertest';
import { closeDBConnections, deleteUserByUsername, insertBlacklistToken, insertUser } from '../../utils/database.mjs';
import { generateAuthToken, generateMockUserDB, generateRandomString, parseJwt } from '../../utils/generators.mjs';
import { authenticateToken, authenticateUser, checkJSONBody, checkRequestValidity, isValidEmail, isValidUrl, testUrlAccessibility, userMustExist, userMustNotExist } from '../../utils/validations.mjs';

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

    describe('testUrlAccessibility', () => {
        test('testUrlAccessibility returns true for an accessible URL', async () => {
            await expect(testUrlAccessibility('https://www.example.com')).resolves.toBeTruthy();
        });

        // This test might be less reliable as it depends on an external service being down
        test('testUrlAccessibility returns false for an inaccessible URL', async () => {
            await expect(testUrlAccessibility('https://thisurldoesnotexist1234.com')).resolves.toBeFalsy();
        });
    });

    describe('isValidUrl', () => {
        test('should return true for a valid URL', () => {
            expect(isValidUrl('https://www.example.com')).toBeTruthy();
        });

        test('should return false for an invalid URL', () => {
            expect(isValidUrl('not a url')).toBeFalsy();
        });
    });

    describe('isValidEmail', () => {
        test('should return true for a valid email', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
        });

        test('should return true for a valid email with numbers and symbols', () => {
            expect(isValidEmail('user.name+123@example.co.uk')).toBe(true);
        });

        test('should return true for a valid email with subdomains', () => {
            expect(isValidEmail('user@sub.domain.example.com')).toBe(true);
        });

        test('should return false for an email without "@" symbol', () => {
            expect(isValidEmail('invalidEmail.com')).toBe(false);
        });

        test('should return false for an email without domain', () => {
            expect(isValidEmail('user@')).toBe(false);
        });

        test('should return false for an email without local part', () => {
            expect(isValidEmail('@example.com')).toBe(false);
        });

        test('should return false for an email without a top-level domain', () => {
            expect(isValidEmail('user@example')).toBe(false);
        });

        test('should return false for an email with invalid characters', () => {
            expect(isValidEmail('user@exa$mple.com')).toBe(false);
        });

        test('should return false for an email with spaces', () => {
            expect(isValidEmail('user @example.com')).toBe(false);
        });

        test('should return false for an email with consecutive dots in domain', () => {
            expect(isValidEmail('user@example..com')).toBe(false);
        });

        test('should return false for an email with special characters in domain', () => {
            expect(isValidEmail('user@exa*mple.com')).toBe(false);
        });

        test('should return false for an email with multiple "@" symbols', () => {
            expect(isValidEmail('user@@example.com')).toBe(false);
        });
    });

    describe('checkJSONBody', () => {
        let app;

        beforeEach(() => {
            app = express();

            // Mock the translation function for req.t in middleware
            app.use((req, res, next) => {
                Object.assign(req, { ...i18next }); // Attach the entire i18next instance to the req object
                next();
            });

            // Built-in middleware for parsing JSON and URL-encoded bodies
            app.use(json());

            // Add the middleware to handle JSON body errors
            app.use(checkJSONBody);

            // Dummy route for testing
            app.post('/test', (_, res) => {
                res.status(200).json({ message: 'Success' });
            });
        });

        test('should return 400 with proper error details for invalid JSON', async () => {
            const response = await request(app)
                .post('/test')
                .set('Content-Type', 'application/json')
                .send("{ invalidJSON: 'true' }"); // Invalid JSON without quotes around the key

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Invalid JSON format.',
                details: {
                    type: 'entity.parse.failed',
                    error: expect.any(String),
                    position: '2',
                    hint: 'Ensure that all keys and values are properly enclosed in double quotes.'
                }
            });
        });

        test('should call next middleware for valid JSON', async () => {
            const response = await request(app)
                .post('/test')
                .set('Content-Type', 'application/json')
                .send({ validJSON: true });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Success' });
        });
    });

    describe('checkRequestValidity', () => {
        let app;

        beforeEach(() => {
            app = express();

            // Middleware to parse JSON bodies
            app.use(json());

            // Sample route with validation rules
            app.post('/btest',
                // Validation rules using express-validator
                body('email').isEmail().withMessage('Invalid email format.'),
                body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
                checkRequestValidity, // Middleware to check validation results
                (_, res) => {
                    res.status(200).json({ message: 'Valid request' });
                }
            );

            // Sample route with query validation rules
            app.get('/qtest',
                // Validation rules for query parameters using express-validator
                query('age').isInt({ min: 1 }).withMessage('Age must be a positive integer.'),
                query('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters long.'),
                checkRequestValidity, // Middleware to check validation results
                (_, res) => {
                    res.status(200).json({ message: 'Valid query parameters' });
                }
            );
        });

        test('should return 400 with validation errors for invalid input', async () => {
            const response = await request(app)
                .post('/btest')
                .set('Content-Type', 'application/json')
                .send({ email: 'invalid-email', password: '123' }); // Invalid email and short password

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                errors: [
                    { msg: 'Invalid email format.', path: 'email', location: 'body', type: 'field', value: 'invalid-email' },
                    { msg: 'Password must be at least 6 characters long.', path: 'password', type: 'field', location: 'body', value: '123' }
                ]
            });
        });

        // Body validation tests for /btest
        test('should call next middleware for valid input', async () => {
            const response = await request(app)
                .post('/btest')
                .set('Content-Type', 'application/json')
                .send({ email: 'test@example.com', password: '123456' }); // Valid email and password

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Valid request' });
        });

        test('should return 400 for missing fields', async () => {
            const response = await request(app)
                .post('/btest')
                .set('Content-Type', 'application/json')
                .send({}); // Missing both email and password

            expect(response.status).toBe(400);
            expect(response.body.errors.length).toBe(2); // Expecting two validation errors
        });

        // Query validation tests for /qtest
        test('should return 400 with validation errors for invalid query input', async () => {
            const response = await request(app)
                .get('/qtest')
                .set('Content-Type', 'application/json')
                .query({ age: -5, name: 'A' }); // Invalid age and short name

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                errors: [
                    { msg: 'Age must be a positive integer.', path: 'age', type: 'field', location: 'query', value: '-5' },
                    { msg: 'Name must be at least 2 characters long.', path: 'name', type: 'field', location: 'query', value: 'A' }
                ]
            });
        });

        test('should return 200 for valid query input', async () => {
            const response = await request(app)
                .get('/qtest')
                .set('Content-Type', 'application/json')
                .query({ age: 30, name: 'John' }); // Valid age and name

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Valid query parameters' });
        });

        test('should return 400 for missing query parameters', async () => {
            const response = await request(app)
                .get('/qtest')
                .set('Content-Type', 'application/json')
                .query({}); // Missing both age and name query parameters

            expect(response.status).toBe(400);
            expect(response.body.errors.length).toBe(2); // Expecting two validation errors
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