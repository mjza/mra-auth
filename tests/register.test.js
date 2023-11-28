const request = require('supertest');
const app = require('../app');
const bcrypt = require('bcrypt');

// Mock database operations
const db = require('../db/database'); // Adjust the path to your database file
jest.mock('../db/database');

describe('POST /register', () => {
  it('should return 201 for successful registration', async () => {
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!'
    };

    // Mock insertUser function to mimic database operation
    db.insertUser.mockResolvedValue({ insertId: 1 });

    const response = await request(app)
      .post('/register')
      .send(mockUser);

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({ message: "User registered successfully", userId: 1 });
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

});
