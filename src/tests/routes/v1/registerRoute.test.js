const request = require('supertest');
const { createApp, closeApp } = require('../../../app');
const db = require('../../../utils/database');
const { generateMockUserRoute } = require('../../../utils/generators');

describe('Test register route', () => {

  let app, mockUser;

  const headers = {
    'x-development-token': process.env.X_DEVELOPMENT_TOKEN,
  };

  // Utility function to create test requests
  const register = async (data) => await request(app).post('/v1/register').set(headers).send(data);
  const activate = async (data) => await request(app).post('/v1/resend-activation').set(headers).send(data);
  const deregister = async (authToken, params) => await request(app).delete('/v1/deregister').set(headers).set('Authorization', authToken).query(params);

  beforeAll(async () => {
    app = await createApp();
  });

  // Ensure the app resources are closed after all tests
  afterAll(async () => {
    await closeApp();
  });

  describe('Test POST /v1/register endpoint', () => {
    let res;

    // Clean up after each tests
    afterEach(async () => {
      if (res.statusCode === 201) {
        const userId = res.body.userId;
        // Get the test user from the database
        const createdUser = await db.getUserByUserId(userId);
        const inactiveUser = { username: createdUser.username, activationCode: createdUser.activation_code };
        await request(app).post('/v1/activate-by-code').set(headers).send(inactiveUser);
        const login = { usernameOrEmail: mockUser.username, password: mockUser.password };
        res = await request(app).post('/v1/login').set(headers).send(login);
        const authData = res.body;
        res = await deregister(`Bearer ${authData.token}`);
        if (res.statusCode >= 400) {
          await db.deleteUserByUsername(mockUser.username);
          console.log(`Couldn't delete the user: '${mockUser.username}'`);
        }
      }
    });

    it('should return 201 for successful registration', async () => {
      mockUser = generateMockUserRoute();
      res = await register(mockUser);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        message: 'User registered successfully.',
        userId: expect.any(Number)
      });

      // Test to verify if user is actually in the database
      // Use your database querying method here to check
      const userInDb = await db.getUserByUsername(mockUser.username);
      expect(userInDb).toBeDefined();
      expect(userInDb.display_name).toBe(mockUser.username);
    });

    // Test Cases for Username
    it('should return 400 if username is not provided', async () => {
      mockUser = generateMockUserRoute();
      delete mockUser.username;
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username is required.' })])
      );
    });

    it('should return 400 if username is too short', async () => {
      mockUser = generateMockUserRoute();
      mockUser.username = 'test';
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username must be between 5 and 30 characters.' })])
      );
    });

    it('should return 400 if username contains invalid characters', async () => {
      mockUser = generateMockUserRoute();
      mockUser.username = 'user*name';
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username can only contain letters, numbers, and underscores.' })])
      );
    });

    it('should return 400 if username is a reserved word', async () => {
      const reservedUsernames = ['super', 'superdata', 'devhead', 'developer', 'saleshead', 'sales', 'support',
        'admin', 'admindata', 'officer', 'agent', 'enduser', 'public', 'administrator',
        'manager', 'staff', 'employee'];
      mockUser = generateMockUserRoute();
      for (const username of reservedUsernames) {
        mockUser.username = username;
        res = await register(mockUser);
        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ msg: 'Username cannot be a reserved word.' })])
        );
      }
    });

    // Test Cases for Email
    it('should return 400 if email is not provided', async () => {
      mockUser = generateMockUserRoute();
      delete mockUser.email;
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Email is required.' })])
      );
    });

    it('should return 400 if email is invalid', async () => {
      mockUser = generateMockUserRoute();
      mockUser.email = 'invalidemail';
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Invalid email address.' })])
      );
    });

    it('should return 400 if email is not a string', async () => {
      mockUser = generateMockUserRoute();
      mockUser.email = 4;
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Email must be a string.' })])
      );
    });

    it('should return 400 if email is passed as null', async () => {
      mockUser = generateMockUserRoute();
      mockUser.email = null;
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Email must be a string.' })])
      );
    });

    it('should return 400 if email is too long', async () => {
      const longEmail = `${'a'.repeat(256)}@example.com`;
      mockUser = generateMockUserRoute();
      mockUser.email = longEmail;
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Email must be between 5 and 255 characters.' })])
      );
    });

    // Test Cases for Password
    it('should return 400 if password is not provided', async () => {
      mockUser = generateMockUserRoute();
      delete mockUser.password;
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Password is required.' })])
      );
    });

    it('should return 400 if password is too short', async () => {
      mockUser = generateMockUserRoute();
      mockUser.password = 'short';
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Password must be between 8 and 30 characters.' })])
      );
    });

    it('should return 400 if password does not contain uppercase letter', async () => {
      mockUser = generateMockUserRoute();
      mockUser.password = 'password123!';
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Password must contain at least one uppercase letter.' })])
      );
    });

    it('should return 400 if password does not contain digit', async () => {
      mockUser = generateMockUserRoute();
      mockUser.password = 'Password!';
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Password must contain at least one digit.' })])
      );
    });

    it('should return 400 if password does not contain special character', async () => {
      mockUser = generateMockUserRoute();
      mockUser.password = 'Password123';
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Password must contain at least one latin symbol.' })])
      );
    });

    // Test Cases for Display Name
    it('should return 400 if display name is too long', async () => {
      mockUser = generateMockUserRoute();
      mockUser.displayName = 'a'.repeat(51);
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'DisplayName can be a maximum of 50 characters.' })])
      );
    });

    it('should return 400 if display name is not a string', async () => {
      mockUser = generateMockUserRoute();
      mockUser.displayName = 4;
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'DisplayName must be a string.' })])
      );
    });

    it('should return 201 if display name is null', async () => {
      mockUser = generateMockUserRoute();
      mockUser.displayName = null;
      res = await register(mockUser);
      expect(res.statusCode).toBe(201);
    });

    it('should return 201 if display name is an empty string', async () => {
      mockUser = generateMockUserRoute();
      mockUser.displayName = '';
      res = await register(mockUser);
      expect(res.statusCode).toBe(201);
    });

    // Test Cases for loginRedirectURL
    it('should return 400 if loginRedirectURL is invalid', async () => {
      mockUser = generateMockUserRoute();
      mockUser.loginRedirectURL = 'ftp://example.com';
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'The login redirect URL must be a valid URL starting with http:// or https://.' })])
      );
    });

    it('should return 400 if loginRedirectURL is not accessible', async () => {
      mockUser = generateMockUserRoute();
      mockUser.loginRedirectURL = 'https://thisurldoesnotexist1234.com';
      res = await register(mockUser);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'The login redirect URL is not a valid URL.' })])
      );
    });

    it('should return 429 after 5 attempts', async () => {
      mockUser = {
        username: 'te', // Invalid username length
        email: 'testexample.com', // Invalid email
        password: 'pass' // Invalid password
      };

      for (let i = 0; i < 5; i++) {
        res = await request(app).post('/v1/register').send(mockUser);
        expect(res.statusCode).toBe(400);
      }

      res = await request(app).post('/v1/register').send(mockUser);
      expect(res.statusCode).toBe(429);
      expect(res.body.message).toBeDefined();
      expect(res.body.message).toBe('Too many registration requests from this IP, please try again after an hour.');
    });
  });

  describe('Test POST /v1/resend-activation endpoint', () => {
    let res;

    it('should return 400 for missing usernameOrEmail', async () => {
      res = await activate({ loginRedirectURL: 'http://example.com' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username or email is required.' })])
      );
    });

    it('should return 400 for non-string usernameOrEmail', async () => {
      res = await activate({ usernameOrEmail: 12345, loginRedirectURL: 'http://example.com' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username or email must be a string.' })])
      );
    });

    it('should return 400 for invalid email format', async () => {
      res = await activate({ usernameOrEmail: 'invalid@Email', loginRedirectURL: 'http://example.com' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Invalid email address.' })])
      );
    });

    it('should return 400 for short username', async () => {
      res = await activate({ usernameOrEmail: 'abc', loginRedirectURL: 'http://example.com' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username must be between 5 and 30 characters.' })])
      );
    });

    it('should return 400 for invalid username characters', async () => {
      res = await activate({ usernameOrEmail: 'invalid*user', loginRedirectURL: 'http://example.com' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username can only contain letters, numbers, and underscores.' })])
      );
    });

    it('should return 400 for invalid loginRedirectURL format', async () => {
      res = await activate({ usernameOrEmail: 'validUsername', loginRedirectURL: 'invalid-url' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'The login redirect URL must be a valid URL starting with http:// or https://.' })])
      );
    });

    it('should return 400 for non-accessible loginRedirectURL', async () => {
      res = await activate({ usernameOrEmail: 'validUsername', loginRedirectURL: 'https://thisurldoesnotexist1234.com' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'The login redirect URL is not a valid URL.' })])
      );
    });

    it('should return 200 for valid inputs (username)', async () => {
      res = await activate({ usernameOrEmail: 'validUser123', loginRedirectURL: 'http://example.com' });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('A new activation link has been sent if there is a registered user related to the provided email or username.');
    });

    it('should return 200 for valid inputs (email)', async () => {
      res = await activate({ usernameOrEmail: 'a@b.com', loginRedirectURL: 'http://example.com' });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('A new activation link has been sent if there is a registered user related to the provided email or username.');
    });

    it('should return 429 after 6 attempts', async () => {
      // As we hit the maximum requests with this ip,
      // we must wait for 1 hour to make sure rate limit works.
      // But in practice we cannot wait for 1 hour and then do this test.
      for (let i = 0; i < 6; i++) {
        res = await request(app).post('/v1/resend-activation').send({ usernameOrEmail: 'a@b.com', loginRedirectURL: 'http://example.com' });
      }
      expect(res.statusCode).toBe(429);
      expect(res.body.message).toBeDefined();
      expect(res.body.message).toBe('Too many registration requests from this IP, please try again after an hour.');
    });
  });

  describe('Test DELETE /v1/deregister endpoint', () => {
    let res, user, authorization;

    beforeAll(async () => {
      mockUser = generateMockUserRoute();
      res = await register(mockUser);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        message: "User registered successfully.",
        userId: expect.any(Number)
      });
      user = res.body;
      const userId = user.userId;
      // Get the test user from the database
      const createdUser = await db.getUserByUserId(userId);
      const inactiveUser = { username: createdUser.username, activationCode: createdUser.activation_code };
      await request(app).post('/v1/activate-by-code').set(headers).send(inactiveUser);
      const login = { usernameOrEmail: mockUser.username, password: mockUser.password };
      res = await request(app).post('/v1/login').set(headers).send(login);
      const authData = res.body;
      authorization = `Bearer ${authData.token}`;
    });

    it('should return 401 for deregistering with no auth', async () => {
      res = await deregister('');
      expect(res.statusCode).toBe(401);
    });

    it('should return 400 for providing am integer usernamer', async () => {
      res = await deregister(authorization, { username: 4, domain: '0' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username must be between 5 and 30 characters.' })])
      );
    });

    it('should return 400 for providing am integer usernamer', async () => {
      res = await deregister(authorization, { username: 'abcd%', domain: '0' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username can only contain letters, numbers, and underscores.' })])
      );
    });

    it('should return 400 for providing am integer usernamer', async () => {
      res = await deregister(authorization, { username: 'abcd5', domain: 'a1' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Domain must be a string containing only digits.' })])
      );
    });

    it('should return 403 for deregistering other users in a domain', async () => {
      res = await deregister(authorization, { username: 'superuser', domain: '0' });
      expect(res.statusCode).toBe(403);
    });

    it('should return 403 for deregistering other users even without a domain', async () => {
      res = await deregister(authorization, { username: 'superuser' });
      expect(res.statusCode).toBe(403);
    });

    it('should return 429 after 60 attempts', async () => {
      for (let i = 0; i < 60; i++) {
        res = await request(app).delete('/v1/deregister').set('Authorization', authorization).query({ username: 'abcde' });
        expect(res.statusCode).toBe(404);
      }
      res = await request(app).delete('/v1/deregister').set('Authorization', authorization).query({ username: 'abcde' });
      expect(res.statusCode).toBe(429);
      expect(res.body.message).toBeDefined();
      expect(res.body.message).toBe('Too many requests from this IP, please try again after 1 minutes.');
    });

    it('should return 200 for successful deregistration', async () => {
      res = await deregister(authorization);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        message: 'User has been removed successfully.'
      });
    });
  });
});
