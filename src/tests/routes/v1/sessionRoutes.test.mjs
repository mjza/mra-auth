import request from 'supertest';
import { createApp, closeApp } from '../../../app.mjs';
import { insertUser, activateUser, deleteUserByUsername, isTokenBlacklisted } from '../../../utils/database.mjs';
import { generateMockUserDB, generateRandomString } from '../../../utils/generators.mjs';

describe('Test session endpoints', () => {

    let app;

    const headers = {
        'x-development-token': process.env.X_DEVELOPMENT_TOKEN,
    };

    beforeAll(async () => {
        app = await createApp();
    });

    // Ensure the app resources are closed after all tests
    afterAll(async () => {
        await closeApp();
    });

    describe('Post /v1/login endpoint', () => {
        let mockUser, testUser;

        beforeAll(async () => {
            mockUser = await generateMockUserDB();
            // Insert a test user into the database
            testUser = await insertUser(mockUser);
            var user = { username: testUser.username, activationCode: testUser.activation_code };
            await activateUser(user);
        });

        // Clean up after each tests
        afterAll(async () => {
            await deleteUserByUsername(mockUser.username);
        });

        test('Successful login', async () => {
            const res = await request(app)
                .post('/v1/login')
                .set(headers)
                .send({ usernameOrEmail: mockUser.username, password: mockUser.password });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('exp');
            expect(res.body).toHaveProperty('userId');
            expect(res.body).toHaveProperty('displayName');
            expect(res.body).toHaveProperty('profilePictureUrl');
            expect(res.body).toHaveProperty('isPrivatePicture');
        });

        test('Invalid username', async () => {
            const res = await request(app)
                .post('/v1/login')
                .set(headers)
                .send({ usernameOrEmail: mockUser.username + 'x', password: mockUser.password });

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe('Username or password is incorrect.');
        });

        test('Invalid password', async () => {
            const res = await request(app)
                .post('/v1/login')
                .set(headers)
                .send({ usernameOrEmail: mockUser.username, password: mockUser.password + 'x' });

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe('Username or password is incorrect.');
        });

        test('Incorrect username or password', async () => {
            const res = await request(app)
                .post('/v1/login')
                .set(headers)
                .send({ usernameOrEmail: generateRandomString(4), password: generateRandomString(32) });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        test('Incorrect username or password', async () => {
            const res = await request(app)
                .post('/v1/login')
                .set(headers)
                .send({ usernameOrEmail: 'nonexistentuser', password: 'wrongpassword' });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('/v1/verify_token endpoints', () => {
        let mockUser, testUser, authData, futureTimestamp;

        beforeAll(async () => {
            mockUser = await generateMockUserDB();
            // Insert a test user into the database
            testUser = await insertUser(mockUser);
            var user = { username: testUser.username, activationCode: testUser.activation_code };
            await activateUser(user);
            authData = (await request(app)
                .post('/v1/login')
                .set(headers)
                .send({ usernameOrEmail: mockUser.username, password: mockUser.password })).body;
            const oneDayInMilliseconds = 24 * 60 * 60 * 1000 + 1000; // milliseconds in a day + 1 sec
            const currentTimeInMilliseconds = new Date().getTime(); // current time in milliseconds
            futureTimestamp = Math.floor((currentTimeInMilliseconds + oneDayInMilliseconds) / 1000); // convert to seconds
        });

        afterAll(async () => {
            await deleteUserByUsername(mockUser.username);
        });

        describe('/v1/verify_token endpoint', () => {
            it('should confirm a valid JWT token', async () => {
                // Mock a valid JWT token
                const validToken = `Bearer ${authData.token}`;

                const res = await request(app)
                    .post('/v1/verify_token')
                    .set(headers)
                    .set('Authorization', validToken);

                expect(res.statusCode).toBe(200);
                expect(res.body.userId).toBe(testUser.user_id);
                expect(res.body.username).toBe(testUser.username);
                expect(res.body.email).toBe(testUser.email);
                expect(Number.isInteger(res.body.iat)).toBe(true);
                expect(res.body.iat).toBeGreaterThanOrEqual(0);
                expect(res.body.iat).toBeLessThan(futureTimestamp);
                expect(Number.isInteger(res.body.exp)).toBe(true);
                expect(res.body.exp).toBeGreaterThanOrEqual(0);
                expect(res.body.exp).toBeLessThan(futureTimestamp);
            });

            it('should return 401 as authorization token is missing', async () => {
                const res = await request(app)
                    .post('/v1/verify_token')
                    .set(headers);

                expect(res.statusCode).toEqual(401);
                expect(res.body.message).toEqual('You must provide a valid JWT token.');
            });

            it('should return 401 as authorization token is invalid', async () => {
                const res = await request(app)
                    .post('/v1/verify_token')
                    .set(headers)
                    .set('Authorization', `Bearer ${authData.token}` + 'x');

                expect(res.statusCode).toEqual(401);
                expect(res.body.message).toEqual('Provided JWT token is invalid.');
            });
        });

        describe('/v1/refresh_token endpoint', () => {
            it('should refresh a valid JWT token', async () => {
                // Mock a valid JWT token
                const validToken = `Bearer ${authData.token}`;

                const res = await request(app)
                    .post('/v1/refresh_token')
                    .set(headers)
                    .set('Authorization', validToken);

                expect(res.statusCode).toBe(200);

                const oneDayInMilliseconds = 24 * 60 * 60 * 1000 + 1000; // milliseconds in a day + 1 sec
                const currentTimeInMilliseconds = new Date().getTime(); // current time in milliseconds
                const futureTimestamp = Math.floor((currentTimeInMilliseconds + oneDayInMilliseconds) / 1000); // convert to seconds

                expect(res.body).toHaveProperty('token');
                expect(res.body.userId).toBe(testUser.user_id);
                expect(Number.isInteger(res.body.exp)).toBe(true);
                expect(res.body.exp).toBeGreaterThanOrEqual(0);
                expect(res.body.exp).toBeLessThan(futureTimestamp);

            });

            it('should return 401 as token is missing', async () => {
                const res = await request(app)
                    .post('/v1/refresh_token')
                    .set(headers);

                expect(res.statusCode).toEqual(401);
                expect(res.body.message).toEqual('You must provide a valid JWT token.');
            });

            it('should return 401 as token is invalid', async () => {
                const res = await request(app)
                    .post('/v1/refresh_token')
                    .set(headers)
                    .set('Authorization', `Bearer ${authData.token}` + 'x');

                expect(res.statusCode).toEqual(401);
                expect(res.body.message).toEqual('Provided JWT token is invalid.');
            });
        });
    });

    describe('/v1/logout endpoint', () => {

        let mockUser, testUser, authData;

        beforeAll(async () => {
            mockUser = await generateMockUserDB();
            // Insert a test user into the database
            testUser = await insertUser(mockUser);
            var user = { username: testUser.username, activationCode: testUser.activation_code };
            await activateUser(user);
            authData = (await request(app)
                .post('/v1/login')
                .set(headers)
                .send({ usernameOrEmail: mockUser.username, password: mockUser.password })).body;
        });

        afterAll(async () => {
            await deleteUserByUsername(mockUser.username);
        });

        it('should successfully logout with a valid JWT token', async () => {
            // Mock a valid JWT token
            const validToken = `Bearer ${authData.token}`;

            const res = await request(app)
                .post('/v1/logout')
                .set(headers)
                .set('Authorization', validToken);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toEqual('Successfully logged out.');

            const isBlacklisted = await isTokenBlacklisted(authData.token);
            expect(isBlacklisted).toBe(true);
        });

        it('should return 400 as token is missing', async () => {
            const res = await request(app)
                .post('/v1/logout')
                .set(headers);

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('You must provide a valid JWT token.');
        });

        it('should return 401 as token is invalid', async () => {
            const res = await request(app)
                .post('/v1/logout')
                .set(headers)
                .set('Authorization', `Bearer ${authData.token}` + 'x');

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Provided JWT token is invalid.');
        });
    });



});