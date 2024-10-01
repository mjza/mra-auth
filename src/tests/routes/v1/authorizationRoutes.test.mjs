import request from 'supertest';
import { getUserByUsername, activateUser, deleteUserByUsername } from '../../../utils/database.mjs';
import { generateMockUserRoute } from '../../../utils/generators.mjs';

describe('Test authorization endpoints', () => {

    const app = global.__APP__;

    const headers = {
        'x-development-token': process.env.X_DEVELOPMENT_TOKEN,
    };

    describe('/v1/authorize endpoints', () => {
        let mockUser, testUser, authToken;

        beforeAll(async () => {
            mockUser = generateMockUserRoute();
            const res = (await request(app)
                .post('/v1/register')
                .set(headers)
                .send(mockUser)).body;
            if (isNaN(res.userId))
                throw new Error("Couldn't register a mock user.");
            testUser = await getUserByUsername(mockUser.username);
            var user = { username: testUser.username, activationCode: testUser.activation_code };
            await activateUser(user);
            const authData = (await request(app)
                .post('/v1/login')
                .set(headers)
                .send({ usernameOrEmail: mockUser.username, password: mockUser.password })).body;
            authToken = `Bearer ${authData.token}`;
        });

        afterAll(async () => {
            const res = await request(app)
                .delete('/v1/deregister')
                .set(headers)
                .set('Authorization', authToken);
            if (res.statusCode >= 400) {
                await deleteUserByUsername(mockUser.username);
                console.log(`Couldn't delete the user: '${mockUser.username}'`);
            }
        });

        it('should return 403 as authorization token is missing', async () => {
            const res = await request(app)
                .post('/v1/authorize')
                .set(headers)
                .send({
                    dom: '0',
                    obj: 'mra_users',
                    act: 'R',
                    attrs: {}
                });

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toEqual('User is not authorized.');
        });

        it('should return 403 as authorization token is invalid', async () => {
            const res = await request(app)
                .post('/v1/authorize')
                .set(headers)
                .set('Authorization', authToken + 'x')
                .send({
                    dom: '0',
                    obj: 'mra_users',
                    act: 'R',
                    attrs: {}
                });

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toEqual('User is not authorized.');
        });

        it('should authorize user action when valid parameters are provided', async () => {

            const res = await request(app)
                .post('/v1/authorize')
                .set(headers)
                .set('Authorization', authToken)
                .send({
                    dom: '0',
                    obj: 'mra_users',
                    act: 'R',
                    attrs: {}
                });
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('userId');
            expect(res.body.user.userId).toBe(testUser.user_id);
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
                .set(headers)
                .set('Authorization', authToken)
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
                .set(headers)
                .set('Authorization', authToken)
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
                .set(headers)
                .set('Authorization', authToken)
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

});