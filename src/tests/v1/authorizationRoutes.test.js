const request = require('supertest');
const { createApp, closeApp } = require('../../app');
const db = require('../../utils/database');
const { generateMockUserRoute } = require('../../utils/generators');

describe('Test authorization endpoints', () => {

    let app;
    beforeAll(async () => {
        app = await createApp();
    });

    describe('/v1/authorize endpoints', () => {
        let mockUser, testUser, validToken;

        beforeAll(async () => {
            mockUser = generateMockUserRoute();
            const res = (await request(app)
                .post('/v1/register')
                .send(mockUser)).body;
            if (isNaN(res.userId))
                throw new Error("Couldn't register a mock user.");
            testUser = await db.getUserByUsername(mockUser.username);
            var user = { username: testUser.username, activationCode: testUser.activationCode };
            await db.activateUser(user);
            const authData = (await request(app)
                .post('/v1/login')
                .send({ usernameOrEmail: mockUser.username, password: mockUser.password })).body;
            validToken = `Bearer ${authData.token}`;    
        });

        afterAll(async () => {
            await db.deleteUserByUsername(mockUser.username);
        });

        it('should return 403 as authorization token is missing', async () => {
            const res = await request(app)
                .post('/v1/authorize')
                .send({
                    dom: '0',
                    obj: 'mra_users',
                    act: 'R',
                    attrs: { }
                });

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toEqual('User is not authorized.');
        });

        it('should return 403 as authorization token is invalid', async () => {
            const res = await request(app)
                .post('/v1/authorize')
                .set('Authorization', validToken + 'x')
                .send({
                    dom: '0',
                    obj: 'mra_users',
                    act: 'R',
                    attrs: { }
                });

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toEqual('User is not authorized.');
        });

        it('should authorize user action when valid parameters are provided', async () => {            

            const res = await request(app)
                .post('/v1/authorize')
                .set('Authorization', validToken)
                .send({
                    dom: '0',
                    obj: 'mra_users',
                    act: 'R',
                    attrs: { }
                });
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('userId');
            expect(res.body.user.userId).toBe(testUser.userId);
            expect(res.body.user).toHaveProperty('username');
            expect(res.body.user.username).toBe(testUser.username);
            expect(res.body.user).toHaveProperty('email');
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body).toHaveProperty('roles');
            expect(res.body.roles).toEqual(
                expect.arrayContaining([
                { role: 'enduser', domain: '0' }
            ]));
        });
    
        it('should return 400 Bad Request for missing required fields', async () => {
            const res = await request(app)
                .post('/v1/authorize')
                .set('Authorization', validToken)
                .send({
                    dom: '',
                    obj: '',
                    act: '',
                    attrs: null
                });
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('errors');
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Domain (dom) is required'
                    }),
                    expect.objectContaining({
                        msg: 'Object (obj) is required'
                    }),
                    expect.objectContaining({
                        msg: 'Action (act) is required'
                    }),
                    expect.objectContaining({
                        msg: 'Attributes (attrs) must be a JSON object if provided'
                    })
                ])
            );
        });

        it('should return 400 Bad Request for passing wrong types for fields', async () => {
            const res = await request(app)
                .post('/v1/authorize')
                .set('Authorization', validToken)
                .send({
                    dom: 1,
                    obj: 2.2,
                    act: false
                });
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('errors');
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Domain (dom) must be a string'
                    }),
                    expect.objectContaining({
                        msg: 'Object (obj) must be a string'
                    }),
                    expect.objectContaining({
                        msg: 'Action (act) must be a string'
                    })
                ])
            );
        });
    
        it('should return 403 Forbidden if the user is not authorized for the action', async () => {
            const res = await request(app)
                .post('/v1/authorize')
                .set('Authorization', validToken)
                .send({
                    dom: '0',
                    obj: 'mra_customers',
                    act: 'W',
                    attrs: {}
                });
            expect(res.statusCode).toBe(403);
            expect(res.body).toHaveProperty('message', 'User is not authorized.');
        });
    });

    // Ensure the app resources are closed after all tests
    afterAll(async () => {
        await closeApp();
    });

});