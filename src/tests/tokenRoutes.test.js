const request = require('supertest');
const app = require('../app');
const db = require('../utils/database');
const { generateMockUserDB } = require('../utils/generators');

describe('/*_token endpoints', () => {
    let mockUser, testUser, authData, futureTimestamp;

    beforeAll(async () => {
        mockUser = await generateMockUserDB();
        // Insert a test user into the database
        testUser = await db.insertUser(mockUser);
        var user = { username: testUser.username, activationCode: testUser.activation_code };
        await db.activeUser(user);
        authData = (await request(app)
            .post('/login')
            .send({ usernameOrEmail: mockUser.username, password: mockUser.password })).body;
        const oneDayInMilliseconds = 24 * 60 * 60 * 1000 + 1000; // milliseconds in a day + 1 sec
        const currentTimeInMilliseconds = new Date().getTime(); // current time in milliseconds
        futureTimestamp = Math.floor((currentTimeInMilliseconds + oneDayInMilliseconds) / 1000); // convert to seconds
    });

    // Ensure the pool is closed after all tests
    afterAll(async () => {
        await db.deleteUserByUsername(mockUser.username);
        await db.closePool();
    });

    describe('/parse_token endpoint', () => {
        it('should parse a valid JWT token', async () => {
            // Mock a valid JWT token
            const validToken = `Bearer ${authData.token}`;

            const res = await request(app)
                .get('/parse_token')
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

        it('should return 401 as token is missing', async () => {
            const res = await request(app).get('/parse_token');

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('You must provide a valid JWT token.');
        });

        it('should return 401 as token is invalid', async () => {
            const res = await request(app).get('/parse_token').set('Authorization', `Bearer ${authData.token}` + 'x');

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Provided JWT token is invalid.');
        });
    });

    describe('/refresh_token endpoint', () => {
        it('should refresh a valid JWT token', async () => {
            // Mock a valid JWT token
            const validToken = `Bearer ${authData.token}`;

            const res = await request(app)
                .post('/refresh_token')
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
            const res = await request(app).post('/refresh_token');

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('You must provide a valid JWT token.');
        });

        it('should return 401 as token is invalid', async () => {
            const res = await request(app).post('/refresh_token').set('Authorization', `Bearer ${authData.token}` + 'x');

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Provided JWT token is invalid.');
        });
    });
});