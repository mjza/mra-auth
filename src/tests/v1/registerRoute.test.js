const request = require('supertest');
const {createApp, closeApp} = require('../../app');
const db = require('../../utils/database');
const { generateMockUserRoute } = require('../../utils/generators');

describe('POST /v1/register endpoint', () => {

  let app, mockUser;
  beforeAll(async () => {
      app = await createApp();
      mockUser = generateMockUserRoute();
  });

  const invalidMockUser = {
    username: 'te', // Invalid username length
    email: 'testexample.com', // Invalid email
    password: 'pass' // Invalid password
  };

  it('should return 201 for successful registration', async () => {

    const res = await request(app)
      .post('/v1/register')
      .send(mockUser);

    expect(res.statusCode).toBe(201);

    expect(res.body).toEqual({
      message: "User registered successfully",
      userId: expect.any(Number)
    });

    // Test to verify if user is actually in the database
    // Use your database querying method here to check
    const userInDb = await db.getUserByUsername(mockUser.username);
    expect(userInDb).toBeDefined();
    expect(userInDb.display_name).toBe(mockUser.username);
  });

  it('should return 400 for invalid data', async () => {

    const res = await request(app)
      .post('/v1/register')
      .send(invalidMockUser);

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 429 after 5 attempts', async () => {    
    for (let i = 0; i < 6; i++) {
      res = await request(app)
        .post('/v1/register')
        .send(invalidMockUser);
    }

    expect(res.statusCode).toBe(429);
    expect(res.body.message).toBeDefined();
    expect(res.body.message).toBe('Too many accounts created from this IP, please try again after an hour.');
  });

  // Clean up after each tests
  afterEach(async () => {
    await db.deleteUserByUsername(mockUser.username);
  });

  // Ensure the app resources are closed after all tests
  afterAll(async () => {
    await closeApp();
  });

});
