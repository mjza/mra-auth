const request = require('supertest');
const { createApp, closeApp } = require('../../app');
const db = require('../../utils/database');
const { generateMockUserDB } = require('../../utils/generators');

describe('GET /usernames Endpoint', () => {

    let app, mockUser, testUser;

    const headers = {
        'x-development-token': process.env.X_DEVELOPMENT_TOKEN,
    };

    beforeAll(async () => {
        app = await createApp();
        mockUser = await generateMockUserDB();
        testUser = await db.insertUser(mockUser);
    });


    it('should return 200 code', async () => {
        const res = await request(app)
            .get('/v1/usernames')
            .set(headers)
            .query({
                email: testUser.email
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('If there are any usernames associated with the provided email address, a list of them has been sent to that email address.');
    });

    it('should return 200 code even for incorrect email', async () => {
        const res = await request(app)
            .get('/v1/usernames')
            .set(headers)
            .query({
                email: 'x' + testUser.email
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('If there are any usernames associated with the provided email address, a list of them has been sent to that email address.');
    });

    it('should return 400 for invalid email', async () => {

        const res = await request(app)
            .get('/v1/usernames')
            .set(headers)
            .query({
                email: 'xyz'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toBeDefined();
    });


    // Ensure the app resources are closed after all tests
    afterAll(async () => {
        await db.deleteUserByUsername(mockUser.username);
        await closeApp();
    });
});