const request = require('supertest');
const app = require('../app');
const db = require('../db/database');
const { generateMockUserRoute } = require('../utils/generators');



describe('POST /register endpoint', () => {
  const mockUser = generateMockUserRoute();

  const invalidMockUser = {
    username: 'te', // Invalid username length
    email: 'testexample.com', // Invalid email
    password: 'pass' // Invalid password
  };

  it('should return 201 for successful registration', async () => {

    const response = await request(app)
      .post('/register')
      .send(mockUser);

    expect(response.statusCode).toBe(201);

    expect(response.body).toEqual({
      message: "User registered successfully",
      userId: expect.any(Number)
    });

    // Test to verify if user is actually in the database
    // Use your database querying method here to check
    const userInDb = await db.getUserByUsername(mockUser.username);
    expect(userInDb).toBeDefined();
  });

  it('should return 400 for invalid data', async () => {

    const response = await request(app)
      .post('/register')
      .send(invalidMockUser);

    expect(response.statusCode).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('should return 429 after 5 attempts', async () => {
    var response;
    
    for (let i = 0; i < 6; i++) {
      response = await request(app)
        .post('/register')
        .send(invalidMockUser);
    }

    expect(response.statusCode).toBe(429);
    expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Too many accounts created from this IP, please try again after an hour');
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
