const request = require('supertest');
const app = require('../app');
const db = require('../utils/database');
const { generateMockUserDB, generateEncryptedObject } = require('../utils/generators');

describe('GET /usernames Endpoint', () => {

    let mockUser, testUser;

    beforeAll(async () => {
        mockUser = await generateMockUserDB();
        // Insert a test user into the database
        testUser = await db.insertUser(mockUser);
    });


    it('should return 200 code', async () => {
        const res = await request(app)
            .get('/usernames')
            .query({
                email: testUser.email
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('If there are any usernames associated with the provided email address, a list of them has been sent to that email address.');
    });

    it('should return 200 code even for incorrect email', async () => {
        const res = await request(app)
            .get('/usernames')
            .query({
                email: 'x' + testUser.email
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('If there are any usernames associated with the provided email address, a list of them has been sent to that email address.');
    });

    it('should return 400 for invalid email', async () => {

        const res = await request(app)
            .get('/usernames')
            .query({
                email: 'xyz'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toBeDefined();        
    });


    // Ensure the pool is closed after all tests
    afterAll(async () => {
        await db.deleteUserByUsername(mockUser.username);
        await db.closePool();
    });
});