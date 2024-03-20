const request = require('supertest');
const app = require('../../app');
const db = require('../../utils/database');
const { generateMockUserDB } = require('../../utils/generators');

describe('/user_details endpoints', () => {
    let mockUser, testUser, authData, userDetails;

    beforeAll(async () => {
        mockUser = await generateMockUserDB();
        // Insert a test user into the database
        testUser = await db.insertUser(mockUser);
        var user = { username: testUser.username, activationCode: testUser.activation_code };
        await db.activateUser(user);
        authData = (await request(app)
            .post('/v1/login')
            .send({ usernameOrEmail: mockUser.username, password: mockUser.password })).body;
        userDetails = {
            userId: testUser.user_id,
            firstName: 'string1',
            middleName: 'string2',
            lastName: 'string3',
            genderId: 1,
            dateOfBirth: '2023-12-07',
            profilePictureUrl: 'http://example.com/123',
            profilePictureThumbnailUrl: 'http://example.com/124'
        };
    });

    // Ensure the pool is closed after all tests
    afterAll(async () => {
        await db.deleteUserByUsername(mockUser.username);
        await db.closePool();
    });

    describe('GET /user_details before creation', () => {
        it('should return 404 as user details has not yet defined', async () => {
            const res = await request(app).get('/v1/user_details').set('Authorization', `Bearer ${authData.token}`);
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('User details not found');
        });
    });

    describe('PUT /user_details/:userId after creation', () => {
        it('should return 404 as user details has not yet defined', async () => {
            const res = await request(app).put(`/v1/user_details/${userDetails.userId}`).send(userDetails).set('Authorization', `Bearer ${authData.token}`);

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('There is no record for this user in the user details table.');
        });
    });

    describe('POST /user_details', () => {

        it('should not create user details for other user', async () => {
            const copy = { ...userDetails };
            copy.userId = 2147483647;
            const res = await request(app)
            .post('/v1/user_details')
            .send(copy)
            .set('Authorization', `Bearer ${authData.token}`);

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toEqual('Unauthorized to create details for other users.');
        });

        it('should create user details', async () => {
            const res = await request(app)
            .post('/v1/user_details')
            .send(userDetails)
            .set('Authorization', `Bearer ${authData.token}`);

            expect(res.statusCode).toEqual(201);
            expect(res.body).not.toBeNull();
            expect(res.body.firstName).toBe(userDetails.firstName);
            expect(res.body.middleName).toBe(userDetails.middleName);
            expect(res.body.lastName).toBe(userDetails.lastName);
            expect(res.body.genderId).toBe(userDetails.genderId);
            expect(res.body.genderName).toBe('Female');
            expect(res.body.dateOfBirth).toBe(userDetails.dateOfBirth);
            expect(res.body.profilePictureUrl).toBe(userDetails.profilePictureUrl);
            expect(res.body.profilePictureThumbnailUrl).toBe(userDetails.profilePictureThumbnailUrl);
            expect(res.body.updator).toBeUndefined();
            expect(res.body.updatedAt).toBeUndefined();
        });

        it('should return 401 as token is missing', async () => {
            const res = await request(app)
            .post('/v1/user_details')
            .send(userDetails);

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('You must provide a valid JWT token.');
        });

        it('should return 401 as token is invalid', async () => {
            const res = await request(app)
            .post('/v1/user_details')
            .send(userDetails)
            .set('Authorization', `Bearer ${authData.token}` + 'x');

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Provided JWT token is invalid.');
        });

        it('should not create user details for other user', async () => {
            const copy = { ...userDetails };
            copy.userId++;
            const res = await request(app)
            .post('/v1/user_details')
            .send(copy)
            .set('Authorization', `Bearer ${authData.token}`);

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toEqual('Unauthorized to create details for other users.');
        });

        it('should returns 422 as the entity exists', async () => {
            const res = await request(app)
            .post('/v1/user_details')
            .send(userDetails).set('Authorization', `Bearer ${authData.token}`);

            expect(res.statusCode).toEqual(422);
            expect(res.body.message).toEqual('A record exists for the current user in the user details table.');
        });
    });

    describe('GET /user_details after creation', () => {
        it('should return 200 as user details has been defined already', async () => {
            const res = await request(app).get('/v1/user_details').set('Authorization', `Bearer ${authData.token}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).not.toBeNull();
            expect(res.body.firstName).toBe(userDetails.firstName);
            expect(res.body.middleName).toBe(userDetails.middleName);
            expect(res.body.lastName).toBe(userDetails.lastName);
            expect(res.body.genderId).toBe(userDetails.genderId);
            expect(res.body.genderName).toBe('Female');
            expect(res.body.dateOfBirth).toBe(userDetails.dateOfBirth);
            expect(res.body.profilePictureUrl).toBe(userDetails.profilePictureUrl);
            expect(res.body.profilePictureThumbnailUrl).toBe(userDetails.profilePictureThumbnailUrl);
            expect(res.body.updator).toBeUndefined();
            expect(res.body.updatedAt).toBeUndefined();
        });

        it('should return 401 as token is missing', async () => {
            const res = await request(app).get('/v1/user_details')
            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('You must provide a valid JWT token.');
        });

        it('should return 401 as token is invalid', async () => {
            const res = await request(app).get('/v1/user_details').set('Authorization', `Bearer ${authData.token}` + 'x');
            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Provided JWT token is invalid.');
        });
    });

    describe('PUT /user_details/:userId after creation', () => {
        it('should update user details', async () => {
            userDetails.firstName += 'x';
            userDetails.middleName += 'x';
            userDetails.lastName += 'x';
            userDetails.genderId = 2;
            userDetails.dateOfBirth = '2023-12-08';
            userDetails.profilePictureUrl += 'x';
            userDetails.profilePictureThumbnailUrl += 'x';

            const res = await request(app).put(`/v1/user_details/${userDetails.userId}`).send(userDetails).set('Authorization', `Bearer ${authData.token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).not.toBeNull();
            expect(res.body.firstName).toBe(userDetails.firstName);
            expect(res.body.middleName).toBe(userDetails.middleName);
            expect(res.body.lastName).toBe(userDetails.lastName);
            expect(res.body.genderId).toBe(userDetails.genderId);
            expect(res.body.genderName).toBe('Male');
            expect(res.body.dateOfBirth).toBe(userDetails.dateOfBirth);
            expect(res.body.profilePictureUrl).toBe(userDetails.profilePictureUrl);
            expect(res.body.profilePictureThumbnailUrl).toBe(userDetails.profilePictureThumbnailUrl);
            expect(res.body.updator).toBeUndefined();
            expect(res.body.updatedAt).toBeUndefined();
        });

        it('should return 401 as token is missing', async () => {
            const res = await request(app).put(`/v1/user_details/${userDetails.userId}`).send(userDetails);

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('You must provide a valid JWT token.');
        });

        it('should return 401 as token is invalid', async () => {
            const res = await request(app).put(`/v1/user_details/${userDetails.userId}`).send(userDetails).set('Authorization', `Bearer ${authData.token}` + 'x');

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Provided JWT token is invalid.');
        });

        it('should not update user details for other user', async () => {
            const res = await request(app).put(`/v1/user_details/${userDetails.userId + 1}`).send(userDetails).set('Authorization', `Bearer ${authData.token}`);

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toEqual('Unauthorized to update details for other users.');
        });

        it('should returns 400 as the gender id is wrong', async () => {
            const copy = { ...userDetails };
            copy.genderId = 2147483647;
            const res = await request(app).put(`/v1/user_details/${userDetails.userId}`).send(copy).set('Authorization', `Bearer ${authData.token}`);

            expect(res.statusCode).toEqual(400);
            expect(res.body.errors[0].msg).toEqual('Gender ID must be an integer between 1 and 10, inclusive.');
        });


        it('should return 429 after some attempts', async () => {
            var res;

            for (let i = 0; i < 15; i++) {
                res = await request(app).put('/v1/user_details/1');
            }

            expect(res.statusCode).toBe(429);
            expect(res.body.message).toBeDefined();
            expect(res.body.message).toBe('Too many requests from this IP, please try again after 15 minutes.');
            expect(res.headers).toHaveProperty('retry-after');
            expect(parseInt(res.headers['retry-after'])).toBeGreaterThan(0);

            res = await request(app).post('/v1/user_details');

            expect(res.statusCode).toBe(429);
            expect(res.body.message).toBeDefined();
            expect(res.body.message).toBe('Too many requests from this IP, please try again after 15 minutes.');
            expect(res.headers).toHaveProperty('retry-after');
            expect(parseInt(res.headers['retry-after'])).toBeGreaterThan(0);

            res = await request(app).get('/v1/user_details');

            expect(res.statusCode).toBe(429);
            expect(res.body.message).toBeDefined();
            expect(res.body.message).toBe('Too many requests from this IP, please try again after 15 minutes.');
            expect(res.headers).toHaveProperty('retry-after');
            expect(parseInt(res.headers['retry-after'])).toBeGreaterThan(0);
        });
    });
});