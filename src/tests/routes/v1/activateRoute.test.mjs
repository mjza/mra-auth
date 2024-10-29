import request from 'supertest';
import { isActiveUser as _isActiveUser, deleteUserByUsername, getUserByUserId, insertUser } from '../../../utils/database.mjs';
import { generateEncryptedObject, generateMockUserDB } from '../../../utils/generators.mjs';

describe('Test activate route', () => {

  const app = global.__APP__;

  const headers = {
    'x-development-token': process.env.X_DEVELOPMENT_TOKEN,
  };

  const activate = async (data) => await request(app).get('/v1/activate').set(headers).query(data);
  const activateByCode = async (data) => await request(app).post('/v1/activate-by-code').set(headers).send(data);

  describe('GET /v1/activate Endpoint', () => {
    let mockUser, testUser, activationObject;

    beforeEach(async () => {
      // Insert a test user into the database
      mockUser = await generateMockUserDB();
      testUser = await insertUser(mockUser);
      activationObject = generateEncryptedObject(testUser.activation_code, '');
    });

    // Clean up after each tests
    afterEach(async () => {
      await deleteUserByUsername(mockUser.username);
    });

    it('should activate a user and return 302 as a redirect code', async () => {
      activationObject = generateEncryptedObject(testUser.activation_code, 'https://example.com/login');

      const res = await activate({
        username: testUser.username,
        token: activationObject.token,
        data: activationObject.data
      });

      expect(res.statusCode).toBe(302);
      expect(res.body.message).toBeUndefined();

      // Verify user status in the database
      const isActiveUser = await _isActiveUser(testUser.username);
      expect(isActiveUser).toBeTruthy();
    });

    it('should activate a user and return 200 code', async () => {
      const res = await activate({
        username: testUser.username,
        token: activationObject.token,
        data: activationObject.data
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Account is activated successfully.');

      // Verify user status in the database
      const isActiveUser = await _isActiveUser(testUser.username);
      expect(isActiveUser).toBeTruthy();
    });

    it('should try to activate an activated user with redirect url and return 302 as a redirect code', async () => {
      activationObject = generateEncryptedObject(testUser.activation_code, 'https://example.com/login');

      let res = await activate({
        username: testUser.username,
        token: activationObject.token,
        data: activationObject.data
      });

      expect(res.statusCode).toBe(302);
      expect(res.body.message).toBeUndefined();

      // Verify user status in the database
      const isActiveUser = await _isActiveUser(testUser.username);
      expect(isActiveUser).toBeTruthy();

      res = await activate({
        username: testUser.username,
        token: activationObject.token,
        data: activationObject.data
      });

      expect(res.statusCode).toBe(302);
      expect(res.body.message).toBeUndefined();
    });

    it('should try to activate an activated user without redirect url and return 202 code', async () => {
      let res = await activate({
        username: testUser.username,
        token: activationObject.token,
        data: activationObject.data
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Account is activated successfully.');

      res = await activate({
        username: testUser.username,
        token: activationObject.token,
        data: activationObject.data
      });

      expect(res.statusCode).toBe(202);
      expect(res.body.message).toBe('Account has been already activated.');

      // Verify user status in the database
      const isActiveUser = await _isActiveUser(testUser.username);
      expect(isActiveUser).toBeTruthy();
    });

    it('should handle invalid activation link', async () => {
      const res = await activate({
        username: 'invalidFormat',
        token: 'invalidFormat',
        data: 'invalidFormat'
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should try to activate with exchanged token and data and return 400 code', async () => {
      const res = await activate({
        username: testUser.username,
        token: activationObject.data,
        data: activationObject.token
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Invalid token format.' })])
      );
    });

    it('should try to activate with an invalid link and return 404 code', async () => {
      const res = await activate({
        username: testUser.username,
        token: activationObject.token,
        data: activationObject.data + '1'
      });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Activation link is invalid.');

      // Verify user status in the database
      const isActiveUser = await _isActiveUser(testUser.username);
      expect(isActiveUser).toBeFalsy();
    });

    it('should return 400 for missing username', async () => {
      const res = await activate({
        token: activationObject.token,
        data: activationObject.data
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username is required.' })])
      );
    });

    it('should return 400 for short username', async () => {
      const res = await activate({
        username: 'abc',
        token: activationObject.token,
        data: activationObject.data
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username must be between 5 and 30 characters.' })])
      );
    });

    it('should return 400 for invalid username characters', async () => {
      const res = await activate({
        username: 'invalid*user',
        token: activationObject.token,
        data: activationObject.data
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username can only contain letters, numbers, and underscores.' })])
      );
    });

    it('should return 400 for non-existent username', async () => {
      const res = await activate({
        username: 'nonexistentuser',
        token: activationObject.token,
        data: activationObject.data
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username does not exist.' })])
      );
    });

    it('should return 400 for missing token', async () => {
      const res = await activate({
        username: testUser.username,
        data: activationObject.data
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Token is required.' })])
      );
    });

    it('should return 400 for short token', async () => {
      const res = await activate({
        username: testUser.username,
        token: 'shortToken',
        data: activationObject.data
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Invalid token format.' })])
      );
    });

    it('should return 400 for short token', async () => {
      const res = await activate({
        username: testUser.username,
        token: activationObject.token + 'G',
        data: activationObject.data
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Token must be a hexadecimal string.' })])
      );
    });

    it('should return 400 for missing token', async () => {
      const res = await activate({
        username: testUser.username,
        token: activationObject.token
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Data is required.' })])
      );
    });

    it('should return 400 for short token', async () => {
      const res = await activate({
        username: testUser.username,
        token: activationObject.token,
        data: 'shortData'
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Invalid data format.' })])
      );
    });

    it('should return 400 for short token', async () => {
      const res = await activate({
        username: testUser.username,
        token: activationObject.token,
        data: activationObject.data + 'G'
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Data must be a hexadecimal string.' })])
      );
    });
  });

  describe('POST /v1/activate-by-code Endpoint', () => {
    let mockUser, testUser, activationCode;

    beforeEach(async () => {
      // Insert a test user into the database
      mockUser = await generateMockUserDB();
      testUser = await insertUser(mockUser);
      const createdUser = await getUserByUserId(testUser.user_id);
      activationCode = createdUser.activation_code;
    });

    // Clean up after each test
    afterEach(async () => {
      await deleteUserByUsername(mockUser.username);
    });

    it('should activate a user and return 200 code', async () => {
      const res = await activateByCode({
        username: testUser.username,
        activationCode: activationCode
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Account is activated successfully.');

      // Verify user status in the database
      const isActiveUser = await _isActiveUser(testUser.username);
      expect(isActiveUser).toBeTruthy();
    });

    it('should return 400 for invalid activation code', async () => {
      const res = await activateByCode({
        username: testUser.username,
        activationCode: activationCode.slice(0, -1) + '1'
      });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Activation code is invalid.');

      // Verify user status in the database
      const isActiveUser = await _isActiveUser(testUser.username);
      expect(isActiveUser).toBeFalsy();
    });

    it('should return 400 for missing username', async () => {
      const res = await activateByCode({
        activationCode: activationCode
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username is required.' })])
      );
    });

    it('should return 400 for non string username', async () => {
      const res = await activateByCode({
        username: 4,
        activationCode: activationCode
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username must be a string.' })])
      );
    });

    it('should return 400 for short username', async () => {
      const res = await activateByCode({
        username: 'abc',
        activationCode: activationCode
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username must be between 5 and 30 characters.' })])
      );
    });

    it('should return 400 for invalid username characters', async () => {
      const res = await activateByCode({
        username: 'invalid*user',
        activationCode: activationCode
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username can only contain letters, numbers, and underscores.' })])
      );
    });

    it('should return 400 for non-existent username', async () => {
      const res = await activateByCode({
        username: 'nonexistentuser',
        activationCode: activationCode
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'Username does not exist.' })])
      );
    });

    it('should return 400 for missing activation code', async () => {
      const res = await activateByCode({
        username: testUser.username
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'ActivationCode is required.' })])
      );
    });

    it('should return 400 for non string activation code', async () => {
      const res = await activateByCode({
        username: testUser.username,
        activationCode: true
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'ActivationCode must be a string.' })])
      );
    });

    it('should return 400 for short activation code', async () => {
      const res = await activateByCode({
        username: testUser.username,
        activationCode: 'shortActivationCode'
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ msg: 'ActivationCode is invalid.' })])
      );
    });

    it('should return 202 for already activated user', async () => {
      // First activation
      await activateByCode({
        username: testUser.username,
        activationCode: activationCode
      });

      // Try to activate again
      const res = await activateByCode({
        username: testUser.username,
        activationCode: activationCode
      });

      expect(res.statusCode).toBe(202);
      expect(res.body.message).toBe('Account has been already activated.');

      // Verify user status in the database
      const isActiveUser = await _isActiveUser(testUser.username);
      expect(isActiveUser).toBeTruthy();
    });
  });
});
