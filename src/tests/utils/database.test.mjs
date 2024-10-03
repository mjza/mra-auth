import { activateUser, closeDBConnections, deleteAuditLog, deleteUserByUsername, generateResetToken, getAuditLogById, getDeactivatedNotSuspendedUsers, getUserByUserId, getUserByUsername, getUserByUsernameOrEmail, getUserIdByUsername, getUsernamesByEmail, insertAuditLog, insertBlacklistToken, insertUser, isActivationCodeValid, isActiveUser, isInactiveUser, isTokenBlacklisted, resetPassword, updateAuditLog, updateUserUpdatedAtToNow } from '../../utils/database.mjs';
import { generateMockUserDB, generateRandomString } from '../../utils/generators.mjs';
import { sleep } from '../../utils/miscellaneous.mjs';

describe('Test DB functions', () => {



    beforeAll(async () => {

    });

    afterAll(async () => {
        await closeDBConnections();
    });

    describe('insertAuditLog, updateAuditLog, getAuditLogById', () => {
        let mockLog;
        let insertedLog;
        let updatedLog;
        let retrievedLog;

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

            it('should return null if log is null', async () => {
                const result = await insertAuditLog(null);
                expect(result).toBeNull();
            });

            it('should return null if log is not an object', async () => {
                const result = await insertAuditLog('notAnObject');
                expect(result).toBeNull();
            });

            it('should insert a log with null values for missing fields even if log is an empty object', async () => {
                const result = await insertAuditLog({});
                expect(result).toBeDefined();
                expect(result.method_route).toBeNull();
                expect(result.req).toBeNull();
                expect(result.comments).toBe('');
                expect(result.ip_address).toBeNull();
                expect(result.user_id).toBeNull();
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
                expect(updatedLog.comments).toMatch(/^Initial comment,\nUpdated comment$/);
            });

            it('should return null if log is null', async () => {
                const result = await updateAuditLog(null);
                expect(result).toBeNull();
            });

            it('should return null if log is not an object', async () => {
                const result = await updateAuditLog('invalidLog');
                expect(result).toBeNull();
            });

            it('should return null if logId is missing', async () => {
                const updateData = {
                    comments: 'Missing logId'
                };
                const result = await updateAuditLog(updateData);
                expect(result).toBeNull();
            });

            it('should return null if logId is not a number', async () => {
                const updateData = {
                    logId: 'invalidId',
                    comments: 'Invalid logId'
                };
                const result = await updateAuditLog(updateData);
                expect(result).toBeNull();
            });

            it('should return null if no log matches the provided logId', async () => {
                const updateData = {
                    logId: -1, // Assuming this logId does not exist
                    comments: 'Non-existent log'
                };
                const result = await updateAuditLog(updateData);
                expect(result).toBeNull();
            });

            it('should update comments to an empty string if provided', async () => {
                const updateData = {
                    logId: insertedLog.log_id,
                    comments: ''
                };
                const result = await updateAuditLog(updateData);

                expect(result).toBeDefined();
                expect(result.comments).toMatch(/^Initial comment,\nUpdated comment,\n$/); // Comments should be updated to an empty string
            });
        });

        describe('getAuditLogById', () => {
            it('should retrieve the correct audit log by ID', async () => {
                retrievedLog = await getAuditLogById(insertedLog.log_id);

                expect(retrievedLog).toBeDefined();
                expect(retrievedLog.log_id).toBe(insertedLog.log_id);
                expect(retrievedLog.method_route).toBe(insertedLog.method_route);
                expect(retrievedLog.comments).toContain('Initial comment,');
                expect(retrievedLog.comments).toContain('Updated comment');
            });

            it('should return null for a non-existent log ID', async () => {
                const nonExistentLogId = -1; // Assuming this ID doesn't exist
                retrievedLog = await getAuditLogById(nonExistentLogId);

                expect(retrievedLog).toBeNull();
            });

            it('should return null for an invalid log ID (NaN)', async () => {
                retrievedLog = await getAuditLogById('invalidLogId');

                expect(retrievedLog).toBeNull();
            });
        });


    });

    describe('deleteAuditLog', () => {
        let mockLog;
        let insertedLog;

        beforeAll(async () => {
            mockLog = {
                methodRoute: 'TEST : /testRoute',
                req: { param: 'test' },
                comments: 'Initial comment',
                ipAddress: '127.0.0.1',
                userId: '123'
            };
            insertedLog = await insertAuditLog(mockLog);
        });

        it('should delete an existing audit log and return success true', async () => {
            const result = await deleteAuditLog(insertedLog.log_id);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);

            // Verify the log is deleted
            const retrievedLog = await getAuditLogById(insertedLog.log_id);
            expect(retrievedLog).toBeNull();
        });

        it('should return success false for a non-existent log ID', async () => {
            const nonExistentLogId = -1; // Assuming this ID does not exist
            const result = await deleteAuditLog(nonExistentLogId);

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
        });

        it('should return success false for an invalid log ID (NaN)', async () => {
            const result = await deleteAuditLog('invalid');

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
        });

        it('should return success false for a log that doesn’t match method_route condition', async () => {
            const mockNonTestLog = {
                methodRoute: 'NON-TEST : /differentRoute',
                req: { param: 'non-test' },
                comments: 'Non-test comment',
                ipAddress: '127.0.0.1',
                userId: '456'
            };

            const nonTestLog = await insertAuditLog(mockNonTestLog);

            const result = await deleteAuditLog(nonTestLog.log_id);

            expect(result).toBeDefined();
            expect(result.success).toBe(false);

            // Cleanup the non-test log manually
            await deleteAuditLog(nonTestLog.log_id);
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

            it('should return null for invalid tokenData object (null input)', async () => {
                const result = await insertBlacklistToken(null);
                expect(result).toBeNull();
            });

            it('should return null for invalid tokenData object (non-object input)', async () => {
                const result = await insertBlacklistToken("invalid");
                expect(result).toBeNull();
            });

            it('should return null when token is missing', async () => {
                const result = await insertBlacklistToken({ expiry: mockTokenData.expiry });
                expect(result).toBeNull();
            });

            it('should return null when token is an empty string', async () => {
                const result = await insertBlacklistToken({ token: '', expiry: mockTokenData.expiry });
                expect(result).toBeNull();
            });

            it('should return null when expiry is missing', async () => {
                const result = await insertBlacklistToken({ token: mockTokenData.token });
                expect(result).toBeNull();
            });

            it('should return null when expiry is not a number', async () => {
                const result = await insertBlacklistToken({ token: mockTokenData.token, expiry: 'invalid' });
                expect(result).toBeNull();
            });

            it('should return null when token is only whitespace', async () => {
                const result = await insertBlacklistToken({ token: '    ', expiry: mockTokenData.expiry });
                expect(result).toBeNull();
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

            it('should return true for invalid or empty token', async () => {
                expect(await isTokenBlacklisted(null)).toBeTruthy();  // Null token
                expect(await isTokenBlacklisted('')).toBeTruthy();  // Empty token
                expect(await isTokenBlacklisted('   ')).toBeTruthy();  // Whitespace token
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

            it('should immediately blacklist an expired token', async () => {
                const expiredTokenData = {
                    token: generateRandomString(32),
                    expiry: Math.floor(Date.now() / 1000) - 1 // Expired 1 seconds ago
                };

                await insertBlacklistToken(expiredTokenData);

                const isBlacklisted = await isTokenBlacklisted(expiredTokenData.token);
                expect(isBlacklisted).toBeFalsy(); // Token should be expired and removed immediately
            });
        });
    });

    let mockUser;
    let insertedUser;

    describe('insertUser', () => {
        it('should return null if username is missing', async () => {
            mockUser = await generateMockUserDB();
            const userWithoutUsername = { ...mockUser, username: '' };

            const result = await insertUser(userWithoutUsername);
            expect(result).toBeNull();
        });

        it('should return null if user is missing', async () => {
            const result = await insertUser();
            expect(result).toBeNull();
        });

        it('should return null if user is null', async () => {
            const result = await insertUser(null);
            expect(result).toBeNull();
        });

        it('should return null if user is not an object', async () => {
            const result = await insertUser('invalidUser');
            expect(result).toBeNull();
        });

        it('should return null if email is missing', async () => {
            const userWithoutEmail = { ...mockUser, email: '' };

            const result = await insertUser(userWithoutEmail);
            expect(result).toBeNull();
        });

        it('should return null if passwordHash is missing', async () => {
            const userWithoutPassword = { ...mockUser, passwordHash: '' };

            const result = await insertUser(userWithoutPassword);
            expect(result).toBeNull();
        });

        it('should return null if username, email, or passwordHash are only whitespace', async () => {
            const userWithWhitespaceUsername = { ...mockUser, username: '   ' };
            const result1 = await insertUser(userWithWhitespaceUsername);
            expect(result1).toBeNull();

            const userWithWhitespaceEmail = { ...mockUser, email: '   ' };
            const result2 = await insertUser(userWithWhitespaceEmail);
            expect(result2).toBeNull();

            const userWithWhitespacePassword = { ...mockUser, passwordHash: '   ' };
            const result3 = await insertUser(userWithWhitespacePassword);
            expect(result3).toBeNull();
        });

        it('should insert a new user', async () => {
            insertedUser = await insertUser(mockUser);

            expect(insertedUser).toBeDefined();
            expect(insertedUser.username).toBe(mockUser.username.toLowerCase());
            expect(insertedUser.email).toBe(mockUser.email.toLowerCase());
            expect(insertedUser.password_hash).toBe(mockUser.passwordHash);
            expect(Number.isInteger(insertedUser.user_id)).toBeTruthy();
        });

        it('should not allow duplicate username', async () => {
            await expect(insertUser(mockUser)).rejects.toThrow();
        });
    });

    describe('getUserByUsername', () => {
        it('should retrieve a user by username', async () => {
            // Assuming the test user is already inserted from previous test
            const user = await getUserByUsername(mockUser.username);
            expect(user).not.toBeNull();
            expect(user.username).toBe(mockUser.username.toLowerCase());
        });

        it('should return null for a non-existent username', async () => {
            const user = await getUserByUsername('nonExistentUsername');

            // Expect null since the user doesn't exist
            expect(user).toBeNull();
        });

        it('should return null for a null username', async () => {
            const user = await getUserByUsername(null);

            // Expect null since null is passed
            expect(user).toBeNull();
        });

        it('should return null for an empty or whitespace-only username', async () => {
            const user1 = await getUserByUsername('');
            const user2 = await getUserByUsername('   '); // Whitespace only

            // Expect null since empty or whitespace-only string is passed
            expect(user1).toBeNull();
            expect(user2).toBeNull();
        });

        it('should handle usernames with case insensitivity', async () => {
            const mixedCaseUsername = mockUser.username.toUpperCase();
            const user = await getUserByUsername(mixedCaseUsername);

            // Check that the function retrieves the user correctly, even with different case
            expect(user).not.toBeNull();
            expect(user.username).toBe(mockUser.username.toLowerCase());
        });
    });

    describe('getUserByUserId', () => {

        it('should retrieve a user by valid user_id', async () => {
            // Retrieve the user by user_id
            const user = await getUserByUserId(insertedUser.user_id);
            expect(user).not.toBeNull();
            expect(user.user_id).toBe(insertedUser.user_id);
            expect(user.username).toBe(insertedUser.username.toLowerCase());
        });

        it('should return null for a non-existent user_id', async () => {
            const user = await getUserByUserId(-1);

            // Expect null since the user_id doesn't exist
            expect(user).toBeNull();
        });

        it('should return null for a null user_id', async () => {
            const user = await getUserByUserId(null);

            // Expect null since null is passed
            expect(user).toBeNull();
        });

        it('should return null for a user_id that is NaN', async () => {
            const user = await getUserByUserId('invalid');

            // Expect null since NaN is passed
            expect(user).toBeNull();
        });

    });

    describe('getUserIdByUsername', () => {

        it('should retrieve the user_id for a valid username', async () => {
            // Retrieve the user ID by username
            const userId = await getUserIdByUsername(insertedUser.username);
            expect(userId).not.toBeNull();
            expect(userId).toBe(insertedUser.user_id);
        });

        it('should return null for a non-existent username', async () => {
            const userId = await getUserIdByUsername('nonExistentUsername');

            // Expect null since the username doesn't exist
            expect(userId).toBeNull();
        });

        it('should return null for a null username', async () => {
            const userId = await getUserIdByUsername(null);

            // Expect null since null is passed
            expect(userId).toBeNull();
        });

        it('should return null for an empty or whitespace-only username', async () => {
            const userId1 = await getUserIdByUsername('');
            const userId2 = await getUserIdByUsername('   '); // Whitespace only

            // Expect null since empty or whitespace-only string is passed
            expect(userId1).toBeNull();
            expect(userId2).toBeNull();
        });

        it('should handle case-insensitive usernames', async () => {
            const mixedCaseUsername = mockUser.username.toUpperCase();
            const userId = await getUserIdByUsername(mixedCaseUsername);

            // Expect the function to find the user even with a different case
            expect(userId).not.toBeNull();
            expect(userId).toBe(insertedUser.user_id);
        });
    });

    describe('getUserByUsernameOrEmail', () => {
        let mockUser2;
        let insertedUser2;

        beforeAll(async () => {
            // Generate and insert a mock user for testing
            mockUser2 = await generateMockUserDB();
            insertedUser2 = await insertUser(mockUser2);
        });

        afterAll(async () => {
            // Clean up the user after tests
            await deleteUserByUsername(mockUser2.username);
        });

        it('should retrieve a user by username or email', async () => {
            // Retrieve user by username
            const userByUsername = await getUserByUsernameOrEmail(mockUser.username);
            expect(userByUsername).toBeDefined();
            expect(userByUsername.length).toBeGreaterThan(0);
            expect(userByUsername[0].username).toBe(mockUser.username.toLowerCase());
            expect(userByUsername[0].email).toBe(mockUser.email.toLowerCase());

            // Retrieve user by email
            const usersByEmail = await getUserByUsernameOrEmail(mockUser.email);
            expect(usersByEmail).toBeDefined();
            expect(usersByEmail.length).toBeGreaterThan(1); // because of the mockUser2
            const foundByEmail = usersByEmail.find(user => user.username === mockUser.username.toLowerCase());
            expect(foundByEmail.username).toBe(mockUser.username.toLowerCase());
            expect(foundByEmail.email).toBe(mockUser.email.toLowerCase());
        });

        it('should return null for a non-existent username or email', async () => {
            const nonExistentUser = await getUserByUsernameOrEmail('nonexistentuser');
            const nonExistentEmail = await getUserByUsernameOrEmail('nonexistentemail@example.com');

            // Expect null for both cases
            expect(nonExistentUser).toBeNull();
            expect(nonExistentEmail).toBeNull();
        });

        it('should return null for a null username or email', async () => {
            const user = await getUserByUsernameOrEmail(null);

            // Expect null since null is passed
            expect(user).toBeNull();
        });

        it('should return null for an empty or whitespace-only username or email', async () => {
            const user1 = await getUserByUsernameOrEmail('');
            const user2 = await getUserByUsernameOrEmail('   '); // Whitespace only

            // Expect null since empty or whitespace-only string is passed
            expect(user1).toBeNull();
            expect(user2).toBeNull();
        });

        it('should handle case-insensitive usernames and emails', async () => {
            const mixedCaseUsername = mockUser.username.toUpperCase();
            const mixedCaseEmail = mockUser.email.toUpperCase();

            // Retrieve by case-insensitive username
            const usersByUsername = await getUserByUsernameOrEmail(mixedCaseUsername);
            expect(usersByUsername).toBeDefined();
            expect(usersByUsername.length).toBeGreaterThan(0);
            expect(usersByUsername[0].username).toBe(mockUser.username.toLowerCase());
            expect(usersByUsername[0].email).toBe(mockUser.email.toLowerCase());

            // Retrieve by case-insensitive email
            const usersByEmail = await getUserByUsernameOrEmail(mixedCaseEmail);
            expect(usersByEmail).toBeDefined();
            expect(usersByEmail.length).toBeGreaterThan(0);

            // Verify that all users retrieved have the correct email (case-insensitive)
            usersByEmail.forEach(user => {
                expect(user.email).toBe(mockUser.email.toLowerCase());
            });

            // Verify the usernames of the users retrieved
            const foundUser = usersByEmail.find(user => user.username === mockUser.username.toLowerCase());

            expect(foundUser).toBeDefined();
        });
    });

    describe('getDeactivatedNotSuspendedUsers', () => {

        it('should retrieve a deactivated and not suspended user by username', async () => {
            // Retrieve user by username
            const usersByUsername = await getDeactivatedNotSuspendedUsers(insertedUser.username);

            expect(usersByUsername).toBeDefined();
            expect(usersByUsername.length).toBe(1);
            expect(usersByUsername[0].username).toBe(insertedUser.username.toLowerCase());
            expect(usersByUsername[0].email).toBe(insertedUser.email.toLowerCase());
        });

        it('should retrieve a deactivated and not suspended user by email', async () => {
            // Insert a second user with the same email
            const secondUser = await generateMockUserDB();
            await insertUser(secondUser);

            // Retrieve user by email
            const usersByEmail = await getDeactivatedNotSuspendedUsers(insertedUser.email);

            expect(usersByEmail).toBeDefined();
            expect(usersByEmail.length).toBeGreaterThan(0);

            // Verify that all users retrieved have the correct email (case-insensitive)
            usersByEmail.forEach(user => {
                expect(user.email).toBe(mockUser.email.toLowerCase());
            });

            // Verify the usernames of the users retrieved
            const foundUser = usersByEmail.find(user => user.username === mockUser.username.toLowerCase());

            expect(foundUser).toBeDefined();

            await deleteUserByUsername(secondUser.username);
        });

        it('should return null for null, empty, or whitespace-only input', async () => {
            const resultNull = await getDeactivatedNotSuspendedUsers(null);
            const resultEmpty = await getDeactivatedNotSuspendedUsers('');
            const resultWhitespace = await getDeactivatedNotSuspendedUsers('   ');

            // All should return null
            expect(resultNull).toBeNull();
            expect(resultEmpty).toBeNull();
            expect(resultWhitespace).toBeNull();
        });

        it('should return null if no matching user is found', async () => {
            const result = await getDeactivatedNotSuspendedUsers('nonexistentuser');

            // Should return null since no user matches the given username/email
            expect(result).toBeNull();
        });
    });

    describe('getUsernamesByEmail', () => {
        it('should retrieve some users by email', async () => {
            // Insert a second user with the same email
            const secondUser = await generateMockUserDB();
            await insertUser(secondUser);

            // Assuming the test user is already inserted from previous test
            const usersByEmail = await getUsernamesByEmail(mockUser.email);

            expect(usersByEmail).toBeDefined();
            expect(usersByEmail.length).toBeGreaterThan(0);

            const foundByEmail = usersByEmail.find(user => user.username === mockUser.username.toLowerCase());

            expect(foundByEmail.username).toBe(mockUser.username.toLowerCase());
            expect(foundByEmail.is_activated).toBeFalsy();
            expect(foundByEmail.is_suspended).toBeFalsy();

            await deleteUserByUsername(secondUser.username);
        });

        it('should return null for a non-existent email', async () => {
            const result = await getUsernamesByEmail('nonexistentemail@example.com');

            // Expect null since no user matches the given email
            expect(result).toBeNull();
        });

        it('should return null for null, empty, or whitespace-only email', async () => {
            const resultNull = await getUsernamesByEmail(null);
            const resultEmpty = await getUsernamesByEmail('');
            const resultWhitespace = await getUsernamesByEmail('   ');

            // All should return null
            expect(resultNull).toBeNull();
            expect(resultEmpty).toBeNull();
            expect(resultWhitespace).toBeNull();
        });

        it('should retrieve multiple users with the same email', async () => {
            // Insert a second user with the same email
            const secondUser = await generateMockUserDB();
            await insertUser(secondUser);

            const usersByEmail = await getUsernamesByEmail(mockUser.email);

            // Expect to retrieve both users
            expect(usersByEmail.length).toBeGreaterThan(1);
            const foundFirstUser = usersByEmail.find(user => user.username === mockUser.username.toLowerCase());
            const foundSecondUser = usersByEmail.find(user => user.username === secondUser.username.toLowerCase());

            expect(foundFirstUser).toBeDefined();
            expect(foundSecondUser).toBeDefined();

            // Clean up the second user after test
            await deleteUserByUsername(secondUser.username);
        });
    });

    describe('isInactiveUser', () => {
        it('should return true if a user is inactive', async () => {
            const inactiveUser = { username: insertedUser.username, activationCode: insertedUser.activation_code };
            const result = await isInactiveUser(inactiveUser);
            expect(result).toBeTruthy();
        });

        it('should return null if user is missing', async () => {
            const result = await isInactiveUser();
            expect(result).toBeNull();
        });

        it('should return null if user is null', async () => {
            const result = await isInactiveUser(null);
            expect(result).toBeNull();
        });

        it('should return null if user is not an object', async () => {
            const result = await isInactiveUser('invalidUser');
            expect(result).toBeNull();
        });

        it('should return false if username is missing', async () => {
            const userWithoutUsername = { username: '', activationCode: insertedUser.activation_code };
            const result = await isInactiveUser(userWithoutUsername);
            expect(result).toBeFalsy();
        });

        it('should return false if activationCode is missing', async () => {
            const userWithoutActivationCode = { username: insertedUser.username, activationCode: '' };
            const result = await isInactiveUser(userWithoutActivationCode);
            expect(result).toBeFalsy();
        });

        it('should return false if username or activationCode is only whitespace', async () => {
            const userWithWhitespaceUsername = { username: '   ', activationCode: insertedUser.activation_code };
            const result1 = await isInactiveUser(userWithWhitespaceUsername);
            expect(result1).toBeFalsy();

            const userWithWhitespaceActivationCode = { username: insertedUser.username, activationCode: '   ' };
            const result2 = await isInactiveUser(userWithWhitespaceActivationCode);
            expect(result2).toBeFalsy();
        });

        it('should return false if the user does not exist or activationCode is incorrect', async () => {
            // Non-existent user
            const nonExistentUser = { username: 'nonexistentuser', activationCode: insertedUser.activation_code };
            const resultNonExistent = await isInactiveUser(nonExistentUser);
            expect(resultNonExistent).toBeFalsy();

            // Incorrect activation code
            const wrongActivationCodeUser = { username: insertedUser.username, activationCode: 'wrongCode' };
            const resultWrongCode = await isInactiveUser(wrongActivationCodeUser);
            expect(resultWrongCode).toBeFalsy();
        });
    });

    describe('isActiveUser', () => {
        it('should return false for an inactive user', async () => {
            const isActive = await isActiveUser(insertedUser.username);
            expect(isActive).toBeFalsy(); // User is not active
        });

        it('should return false for null, empty, or whitespace-only username', async () => {
            const resultNull = await isActiveUser(null);
            const resultEmpty = await isActiveUser('');
            const resultWhitespace = await isActiveUser('   ');

            // All should return false
            expect(resultNull).toBeFalsy();
            expect(resultEmpty).toBeFalsy();
            expect(resultWhitespace).toBeFalsy();
        });

        it('should return false if the user does not exist', async () => {
            const nonExistentUser = await isActiveUser('nonexistentuser');
            expect(nonExistentUser).toBeFalsy(); // Non-existent users should return false
        });

        /*
        // TO DO
        // We need more tests after giving the otion for soft-delete or suspending a user
        it('should return false for a user who is suspended', async () => {
            // Suspend the user
            await updateUser({
                username: insertedUser.username,
                suspended_at: new Date() // User is suspended
            });
    
            const isActive = await isActiveUser(insertedUser.username);
            expect(isActive).toBeFalsy(); // Suspended users are not considered active
        });
    
        it('should return false for a user who is deleted', async () => {
            // Mark the user as deleted
            await updateUser({
                username: insertedUser.username,
                deleted_at: new Date() // User is marked as deleted
            });
    
            const isActive = await isActiveUser(insertedUser.username);
            expect(isActive).toBeFalsy(); // Deleted users are not considered active
        });
        */
    });

    describe('isActivationCodeValid', () => {
        it('should check if a user is inactive', async () => {
            // This depends on your database state and may need adjustment
            const userWithActivationCode = { username: insertedUser.username, activationCode: insertedUser.activation_code };
            const result = await isActivationCodeValid(userWithActivationCode);
            expect(result).toBeTruthy();
        });

        it('should return false if user is missing', async () => {
            const result = await isActivationCodeValid();
            expect(result).toBeFalsy();
        });

        it('should return false if user is null', async () => {
            const result = await isActivationCodeValid(null);
            expect(result).toBeFalsy();
        });

        it('should return false if user is not an object', async () => {
            const result = await isActivationCodeValid('invalidUser');
            expect(result).toBeFalsy();
        });

        it('should return false if username is missing', async () => {
            const userWithoutUsername = { activationCode: insertedUser.activation_code };
            const result = await isActivationCodeValid(userWithoutUsername);
            expect(result).toBeFalsy();
        });
    
        it('should return false if activation code is missing', async () => {
            const userWithoutActivationCode = { username: insertedUser.username };
            const result = await isActivationCodeValid(userWithoutActivationCode);
            expect(result).toBeFalsy();
        });
    
        it('should return false if username is empty or only whitespace', async () => {
            const userWithEmptyUsername = { username: '   ', activationCode: insertedUser.activation_code };
            const result = await isActivationCodeValid(userWithEmptyUsername);
            expect(result).toBeFalsy();
        });
    
        it('should return false if activation code is empty or only whitespace', async () => {
            const userWithEmptyActivationCode = { username: insertedUser.username, activationCode: '   ' };
            const result = await isActivationCodeValid(userWithEmptyActivationCode);
            expect(result).toBeFalsy();
        });
    
    });

    describe('updateUserUpdatedAtToNow', () => {

        it('should update updated_at for a deactivated and not suspended user by username', async () => {
            // Update the user
            const result = await updateUserUpdatedAtToNow(insertedUser.username);

            expect(result).toBe(true); // Should return true since the user exists and is deactivated/not suspended

            // Verify that the updated_at field has been updated
            const updatedUser = await getUserByUsername(insertedUser.username);
            expect(updatedUser.updated_at).not.toBe(insertedUser.updated_at); // The updated_at field should be changed
        });

        it('should return false for null, empty, or whitespace-only username', async () => {
            const resultNull = await updateUserUpdatedAtToNow(null);
            const resultEmpty = await updateUserUpdatedAtToNow('');
            const resultWhitespace = await updateUserUpdatedAtToNow('   ');

            // All should return false
            expect(resultNull).toBe(false);
            expect(resultEmpty).toBe(false);
            expect(resultWhitespace).toBe(false);
        });

        it('should return false if no matching user is found', async () => {
            const result = await updateUserUpdatedAtToNow('nonexistentuser');

            // Should return false since no user matches the given username
            expect(result).toBe(false);
        });
    });

    describe('activateeUser', () => {
        it('should activate a user', async () => {
            const userToActivate = { username: insertedUser.username, activationCode: insertedUser.activation_code };
            const activationResult = await activateUser(userToActivate);
            expect(activationResult).toBeTruthy();
        });
    });

    describe('updateUserUpdatedAtToNow', () => {
        it('should return false if the user is confirmed or suspended', async () => {
            const resultConfirmed = await updateUserUpdatedAtToNow(insertedUser.username);
            expect(resultConfirmed).toBe(false); // Activated user should return false
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
            expect(foundByEmail.is_activated).toBeTruthy();
            expect(foundByEmail.is_suspended).toBeFalsy();
        });
    });

    describe('getDeactivatedNotSuspendedUsers', () => {
        it('should return null if the user is activated or suspended', async () => {
            const resultActivated = await getDeactivatedNotSuspendedUsers(insertedUser.username);
            expect(resultActivated).toBeNull(); // Activated user should return null
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

        it('should return null if trying to delete a user that was already deleted', async () => {
            // Try to delete the user again
            const secondDeletion = await deleteUserByUsername(mockUser.username);
            expect(secondDeletion).toBeNull();
        });

        it('should return null for a non-existent user', async () => {
            const deletedUser = await deleteUserByUsername('nonExistentUsername');

            // Expect null since the user doesn't exist
            expect(deletedUser).toBeNull();
        });

        it('should return null for a null or undefined username', async () => {
            const deletedUser = await deleteUserByUsername(null);
            expect(deletedUser).toBeNull();
        });

        it('should return null for an empty or whitespace-only username', async () => {
            const deletedUser = await deleteUserByUsername('   '); // Only whitespace
            expect(deletedUser).toBeNull();
        });
    });

});