const request = require('supertest');
const app = require('../app');
const db = require('../db/database');

describe('POST /register', () => {
  it('should return 201 for successful registration', async () => {
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!'
    };

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
    const mockUser = {
      username: 'te', // Invalid username length
      email: 'testexample.com', // Invalid email
      password: 'pass' // Invalid password
    };

    const response = await request(app)
      .post('/register')
      .send(mockUser);

    expect(response.statusCode).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  // Clean up after tests
  afterEach(async () => {
    await db.deleteUserByUsername('testuser');
  });

});
