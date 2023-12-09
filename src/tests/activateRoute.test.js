const request = require('supertest');
const app = require('../app');
const db = require('../utils/database');
const { generateMockUserDB, generateEncryptedActivationObject } = require('../utils/generators');

describe('GET /activate Endpoint', () => {

  let mockUser;

  beforeAll(async () => {
    mockUser = await generateMockUserDB();
  });

  let testUser;

  beforeEach(async () => {
    // Insert a test user into the database
    testUser = await db.insertUser(mockUser);
  });

  it('should activate a user and return redirect code', async () => {
    const activationObject = generateEncryptedActivationObject(testUser.activation_code, 'https://example.com/login');

    const res = await request(app)
      .get('/activate')
      .query({
        username: testUser.username,
        token: activationObject.token,
        data: activationObject.data
      });

    expect(res.statusCode).toBe(302);
    expect(res.body.message).toBeUndefined();

    // Verify user status in the database
    const isActiveUser = await db.isActiveUser(testUser.username);
    expect(isActiveUser).toBeTruthy();
  });

  it('should activate a user and return 200 code', async () => {
    const activationObject = generateEncryptedActivationObject(testUser.activation_code, '');

    const res = await request(app)
      .get('/activate')
      .query({
        username: testUser.username,
        token: activationObject.token,
        data: activationObject.data
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Account is activated successfully.');

    // Verify user status in the database
    const isActiveUser = await db.isActiveUser(testUser.username);
    expect(isActiveUser).toBeTruthy();
  });

  it('should try to activate an activate user and return 202 code', async () => {
    const activationObject = generateEncryptedActivationObject(testUser.activation_code, '');

    let res = await request(app)
      .get('/activate')
      .query({
        username: testUser.username,
        token: activationObject.token,
        data: activationObject.data
      });

    res = await request(app)
      .get('/activate')
      .query({
        username: testUser.username,
        token: activationObject.token,
        data: activationObject.data
      });

    expect(res.statusCode).toBe(202);
    expect(res.body.message).toBe('Account has been already activated.');

    // Verify user status in the database
    const isActiveUser = await db.isActiveUser(testUser.username);
    expect(isActiveUser).toBeTruthy();
  });

  it('should handle invalid activation link', async () => {
    const res = await request(app)
      .get('/activate')
      .query({
        username: 'invalidFormat',
        token: 'invalidFormat',
        data: 'invalidFormat'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should try to activate with an invalid link and return 404 code', async () => {
    const activationObject = generateEncryptedActivationObject(testUser.activation_code, '');

    const res = await request(app)
      .get('/activate')
      .query({
        username: testUser.username,
        token: activationObject.token,
        data: activationObject.data + '1'
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Activation link is invalid.');

    // Verify user status in the database
    const isActiveUser = await db.isActiveUser(testUser.username);
    expect(isActiveUser).toBeFalsy();
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