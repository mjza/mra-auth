import { isActivationCodeValid, activateUser, closeDBConnections, deleteAuditLog, deleteUserByUsername, generateResetToken, getUserByUsername, getUserByUsernameOrEmail, getUsernamesByEmail, insertAuditLog, insertBlacklistToken, insertUser, isActiveUser, isInactiveUser, isTokenBlacklisted, resetPassword, updateAuditLog } from '../../utils/database.mjs';
import { generateMockUserDB, generateRandomString } from '../../utils/generators.mjs';
import { sleep } from '../../utils/miscellaneous.mjs';

describe('Test DB functions', () => {

    let mockUser;

    beforeAll(async () => {
        mockUser = await generateMockUserDB();
    });

    afterAll(async () => {
        await closeDBConnections();
    });

    describe('insertAuditLog, updateAuditLog, deleteAuditLog', () => {
        let mockLog;
        let insertedLog;
        let updatedLog;

        beforeAll(() => {
            mockLog = {
                methodRoute: 'TEST : /testRoute',
                req: { param: 'test' },
                comments: 'Initial comment',
                ipAddress: '127.0.0.1',
                userId: '123'
            };
        });

        afterAll(async () => {
            if (insertedLog) {
                await deleteAuditLog(insertedLog.log_id);
            }
        });

        describe('insertAuditLog', () => {
            it('should insert a new audit log', async () => {
                insertedLog = await insertAuditLog(mockLog);

                expect(insertedLog).toBeDefined();
                expect(insertedLog.method_route).toBe(mockLog.methodRoute);
                expect(insertedLog.req).toStrictEqual(mockLog.req);
                expect(insertedLog.comments).toBe(mockLog.comments);
                expect(insertedLog.ip_address).toBe(mockLog.ipAddress);
                expect(insertedLog.user_id).toBe(mockLog.userId);
            });
        });

        describe('updateAuditLog', () => {
            it('should update an existing audit log', async () => {
                const updateData = {
                    logId: insertedLog.log_id,
                    comments: 'Updated comment'
                };
                updatedLog = await updateAuditLog(updateData);

                expect(updatedLog).toBeDefined();
                expect(updatedLog.comments).toContain('Initial comment');
                expect(updatedLog.comments).toContain('Updated comment');
            });
        });
    });

    describe('insertBlacklistToken, isTokenBlacklisted', () => {
        const mockTokenData = {
            token: generateRandomString(32),
            expiry: Math.floor(Date.now() / 1000) + 3 // 3 seconds from now
        };

        describe('insertBlacklistToken', () => {
            it('should insert a new token into the blacklist', async () => {
                const insertedToken = await insertBlacklistToken(mockTokenData);

                expect(insertedToken).toBeDefined();
                expect(insertedToken.token).toBe(mockTokenData.token);
                expect(insertedToken.expiry).toEqual(mockTokenData.expiry);
            });
        });

        describe('isTokenBlacklisted', () => {
            it('should return true if the token is in the blacklist', async () => {
                // Assuming the test token is already inserted from previous test
                const isExpired = await isTokenBlacklisted(mockTokenData.token);
                expect(isExpired).toBeTruthy();
            });

            it('should return false if the token is not in the blacklist', async () => {
                const isExpired = await isTokenBlacklisted('nonExistentToken');
                expect(isExpired).toBeFalsy();
            });

            it('should check by inserting new token the old one is deleted after 3 seconds', async () => {
                await sleep(3000); // Sleep for 3 seconds

                const newMockTokenData = {
                    token: generateRandomString(32),
                    expiry: Math.floor(Date.now() / 1000) - 2 // 2 seconds in past from now
                };

                // must delete expired token immediately after inserting 
                const insertedToken = await insertBlacklistToken(newMockTokenData);
                expect(insertedToken).toBeDefined();
                // must also delete the privious token also
                const doesNewTokenExist = await isTokenBlacklisted(newMockTokenData.token);
                expect(doesNewTokenExist).toBeFalsy();
                const doesOldTokenExist = await isTokenBlacklisted(mockTokenData.token);
                expect(doesOldTokenExist).toBeFalsy();
            });
        });
    });

    let insertedUser;

    describe('insertUser', () => {
        it('should insert a new user', async () => {
            insertedUser = await insertUser(mockUser);

            expect(insertedUser).toBeDefined();
            expect(insertedUser.username).toBe(mockUser.username.toLowerCase());
            expect(insertedUser.email).toBe(mockUser.email.toLowerCase());
            expect(insertedUser.password_hash).toBe(mockUser.passwordHash);
            expect(Number.isInteger(insertedUser.user_id)).toBeTruthy();
        });
    });

    describe('getUserByUsername', () => {
        it('should retrieve a user by username', async () => {
            // Assuming the test user is already inserted from previous test
            const user = await getUserByUsername(mockUser.username);
            expect(user).not.toBeNull();
            expect(user.username).toBe(mockUser.username.toLowerCase());
        });
    });

    describe('getUserByUsernameOrEmail', () => {
        it('should retrieve a user by username or email', async () => {
            // Using the same test user
            const userByUsername = await getUserByUsernameOrEmail(mockUser.username);
            const usersByEmail = await getUserByUsernameOrEmail(mockUser.email);

            expect(userByUsername).toBeDefined();
            expect(usersByEmail).toBeDefined();

            expect(userByUsername.length).toBeGreaterThan(0);
            expect(usersByEmail.length).toBeGreaterThan(0);
            const foundByEmail = usersByEmail.find(user => user.username === mockUser.username.toLowerCase());


            expect(userByUsername[0].username).toBe(mockUser.username.toLowerCase());
            expect(userByUsername[0].email).toBe(mockUser.email.toLowerCase());
            expect(foundByEmail.username).toBe(mockUser.username.toLowerCase());
            expect(foundByEmail.email).toBe(mockUser.email.toLowerCase());
        });
    });

    describe('getUsernamesByEmail', () => {
        it('should retrieve some users by email', async () => {
            // Assuming the test user is already inserted from previous test
            const usersByEmail = await getUsernamesByEmail(mockUser.email);
            expect(usersByEmail).toBeDefined();
            expect(usersByEmail.length).toBeGreaterThan(0);
            const foundByEmail = usersByEmail.find(user => user.username === mockUser.username.toLowerCase());

            expect(foundByEmail.username).toBe(mockUser.username.toLowerCase());
            expect(foundByEmail.is_activated).toBeFalsy();
            expect(foundByEmail.is_suspended).toBeFalsy();
        });
    });

    describe('isInactiveUser', () => {
        it('should check if a user is inactive', async () => {
            const inactiveUser = { username: insertedUser.username, activationCode: insertedUser.activation_code };
            const isInactive = await isInactiveUser(inactiveUser);
            expect(isInactive).toBeTruthy();
        });
    });

    describe('isActiveUser', () => {
        it('should check if a user is active', async () => {
            const isActive = await isActiveUser(insertedUser.username);
            expect(isActive).toBeFalsy();
        });
    });

    describe('isActivationCodeValid', () => {
        it('should check if a user is inactive', async () => {
            // This depends on your database state and may need adjustment
            const activationCode = { username: insertedUser.username, activationCode: insertedUser.activation_code };
            const isActivationCodeValidRes = await isActivationCodeValid(activationCode);
            expect(isActivationCodeValidRes).toBeTruthy();
        });
    });

    describe('activateeUser', () => {
        it('should activate a user', async () => {
            const userToActivate = { username: insertedUser.username, activationCode: insertedUser.activation_code };
            const activationResult = await activateUser(userToActivate);
            expect(activationResult).toBeTruthy();
        });
    });

    describe('isInactiveUser', () => {
        it('should check if a user is active', async () => {
            // This depends on your database state and may need adjustment
            const activedUser = { username: insertedUser.username, activationCode: insertedUser.activation_code };
            const isInactive = await isInactiveUser(activedUser);
            expect(isInactive).toBeFalsy();
        });
    });

    describe('isActiveUser', () => {
        it('should check if a user is active', async () => {
            const isActive = await isActiveUser(insertedUser.username);
            expect(isActive).toBeTruthy();
        });
    });

    describe('generateResetToken', () => {
        it('should not  generate a password_reset token for wrong username', async () => {
            const resetResult = await generateResetToken(insertedUser.username + 'x');
            expect(resetResult).toBeNull();
        });

        it('should generate a password_reset token', async () => {
            const resetResult = await generateResetToken(insertedUser.username);
            expect(resetResult).toBeDefined();
            expect(resetResult.user_id).toBe(insertedUser.user_id);
            expect(resetResult.username).toBe(insertedUser.username);
            expect(resetResult.email).toBe(insertedUser.email);
            expect(resetResult.reset_token).toBeDefined();
            expect(typeof resetResult.reset_token).toBe('string');
            expect(resetResult.reset_token.length).toBe(64);
            insertedUser.reset_token = resetResult.reset_token;
        });
    });

    describe('resetPassword', () => {
        it('should set a new password_hash for the user', async () => {
            const userToResetItsPassowrd = { username: insertedUser.username, resetToken: insertedUser.reset_token, passwordHash: mockUser.passwordHash + 'x' };
            const resetResult = await resetPassword(userToResetItsPassowrd);
            expect(resetResult).toBeTruthy();
        });

        it('should not set a new password_hash for wrong username', async () => {
            const userToResetItsPassowrd = { username: insertedUser.username + 'x', resetToken: insertedUser.reset_token, passwordHash: mockUser.passwordHash + 'x' };
            const resetResult = await resetPassword(userToResetItsPassowrd);
            expect(resetResult).toBeFalsy();
        });

        it('should not set a new password_hash for wrong reset token', async () => {
            const userToResetItsPassowrd = { username: insertedUser.username, resetToken: insertedUser.reset_token + 'x', passwordHash: mockUser.passwordHash + 'x' };
            const resetResult = await resetPassword(userToResetItsPassowrd);
            expect(resetResult).toBeFalsy();
        });
    });

    describe('deleteUserByUsername', () => {
        it('should delete an existing user and return the deleted user data', async () => {

            // Delete the mock user
            const deletedUser = await deleteUserByUsername(mockUser.username);
            expect(deletedUser.username).toBe(mockUser.username.toLowerCase());

            // Try to fetch the deleted user
            const fetchedUser = await getUserByUsername(mockUser.username.toLowerCase());
            expect(fetchedUser).toBeNull();
        });
    });

});