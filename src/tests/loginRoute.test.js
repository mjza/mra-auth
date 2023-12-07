const request = require('supertest');
const app = require('../app');
const db = require('../db/database');
const { generateMockUserDB, generateRandomString } = require('../utils/generators');

describe('Post /login endpoint', () => {
    let mockUser;

    beforeAll(async () => {
        mockUser = await generateMockUserDB();
    });

    let testUser;

    beforeEach(async () => {
        // Insert a test user into the database
        testUser = await db.insertUser(mockUser);
        var user = { username: testUser.username, activationCode: testUser.activation_code };
        await db.activeUser(user);
    });

    test('Successful login', async () => {
        const response = await request(app)
            .post('/login')
            .send({ usernameOrEmail: mockUser.username, password: mockUser.password });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    test('Invalid username', async () => {
        const response = await request(app)
            .post('/login')
            .send({ usernameOrEmail: mockUser.username + 'x', password: mockUser.password });

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Username or password is incorrect');
    });

    test('Invalid password', async () => {
        const response = await request(app)
            .post('/login')
            .send({ usernameOrEmail: mockUser.username, password: mockUser.password + 'x' });

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Username or password is incorrect');
    });

    test('Incorrect username or password', async () => {
        const response = await request(app)
            .post('/login')
            .send({ usernameOrEmail: generateRandomString(4), password: generateRandomString(32) });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('errors');
    });

    test('Incorrect username or password', async () => {
        const response = await request(app)
            .post('/login')
            .send({ usernameOrEmail: 'nonexistentuser', password: 'wrongpassword' });

        expect(response.statusCode).toBe(401);
    });








    // Clean up after each tests
    afterEach(async () => {
        await db.deleteUserByUsername(mockUser.username);
    });

    // Ensure the pool is closed after all tests
    afterAll(async () => {
        await db.closePool();
    });
});