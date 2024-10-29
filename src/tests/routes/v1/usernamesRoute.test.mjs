import request from 'supertest';
import { deleteUserByUsername, insertUser } from '../../../utils/database.mjs';
import { generateMockUserDB } from '../../../utils/generators.mjs';

describe('GET /usernames Endpoint', () => {

    let mockUser, testUser;

    const app = global.__APP__;

    const headers = {
        'x-development-token': process.env.X_DEVELOPMENT_TOKEN,
    };

    beforeAll(async () => {
        mockUser = await generateMockUserDB();
        testUser = await insertUser(mockUser);
    });

    afterAll(async () => {
        await deleteUserByUsername(mockUser.username);
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

});
