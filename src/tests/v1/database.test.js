const db = require('../../utils/database');
const { generateMockUserDB, generateRandomString } = require('../../utils/generators');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Test DB functions', () => {

    let mockUser;

    beforeAll(async () => {
        mockUser = await generateMockUserDB();
    });

    describe('Audit Log DB functions', () => {
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
                await db.deleteAuditLog(insertedLog.log_id);
            }
        });

        describe('insertAuditLog', () => {
            it('should insert a new audit log', async () => {
                insertedLog = await db.insertAuditLog(mockLog);

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
                updatedLog = await db.updateAuditLog(updateData);

                expect(updatedLog).toBeDefined();
                expect(updatedLog.comments).toContain('Initial comment');
                expect(updatedLog.comments).toContain('Updated comment');
            });
        });
    });

    describe('Blacklist Token Functions', () => {
        const mockTokenData = {
            token: generateRandomString(32),
            expiry: Math.floor(Date.now() / 1000) + 2 // 1 seconds from now
        };

        describe('insertBlacklistToken', () => {
            it('should insert a new token into the blacklist', async () => {
                const insertedToken = await db.insertBlacklistToken(mockTokenData);

                expect(insertedToken).toBeDefined();
                expect(insertedToken.token).toBe(mockTokenData.token);
                expect(insertedToken.expiry).toEqual(mockTokenData.expiry);
            });
        });

        describe('isTokenBlacklisted', () => {
            it('should return true if the token is in the blacklist', async () => {
                // Assuming the test token is already inserted from previous test
                const isExpired = await db.isTokenBlacklisted(mockTokenData.token);
                expect(isExpired).toBeTruthy();
            });

            it('should return false if the token is not in the blacklist', async () => {
                const isExpired = await db.isTokenBlacklisted('nonExistentToken');
                expect(isExpired).toBeFalsy();
            });

            it('should check by inserting new token the old one is deleted after 2 seconds', async () => {
                await sleep(2000); // Sleep for 2 seconds

                const newMockTokenData = {
                    token: generateRandomString(32),
                    expiry: Math.floor(Date.now() / 1000) - 2 // 1 seconds in past from now
                };

                // must delete expired token immediately after inserting 
                const insertedToken = await db.insertBlacklistToken(newMockTokenData);
                expect(insertedToken).toBeDefined();
                // must also delete the privious token also
                const doesNewTokenExist = await db.isTokenBlacklisted(newMockTokenData.token);
                expect(doesNewTokenExist).toBeFalsy();
                const doesOldTokenExist = await db.isTokenBlacklisted(mockTokenData.token);
                expect(doesOldTokenExist).toBeFalsy();
            });
        });
    });


    let insertedUser;

    describe('insertUser', () => {
        it('should insert a new user', async () => {
            insertedUser = await db.insertUser(mockUser);

            expect(insertedUser).toBeDefined();
            expect(insertedUser.username).toBe(mockUser.username);
            expect(insertedUser.email).toBe(mockUser.email);
            expect(insertedUser.password_hash).toBe(mockUser.passwordHash);
            expect(Number.isInteger(insertedUser.user_id)).toBeTruthy();
        });
    });

    describe('getUserByUsername', () => {
        it('should retrieve a user by username', async () => {
            // Assuming the test user is already inserted from previous test
            const user = await db.getUserByUsername(mockUser.username);
            expect(user).not.toBeNull();
            expect(user.username).toBe(mockUser.username);
        });
    });

    describe('getUserByUsernameOrEmail', () => {
        it('should retrieve a user by username or email', async () => {
            // Using the same test user
            const userByUsername = await db.getUserByUsernameOrEmail(mockUser.username);
            const usersByEmail = await db.getUserByUsernameOrEmail(mockUser.email);

            expect(userByUsername).toBeDefined();
            expect(usersByEmail).toBeDefined();

            expect(userByUsername.length).toBeGreaterThan(0);
            expect(usersByEmail.length).toBeGreaterThan(0);
            const foundByEmail = usersByEmail.find(user => user.username === mockUser.username);

            
            expect(userByUsername[0].username).toBe(mockUser.username);
            expect(userByUsername[0].email).toBe(mockUser.email);
            expect(foundByEmail.username).toBe(mockUser.username);
            expect(foundByEmail.email).toBe(mockUser.email);
        });
    });

    describe('getUsernamesByEmail', () => {
        it('should retrieve some users by email', async () => {
            // Assuming the test user is already inserted from previous test
            const usersByEmail = await db.getUsernamesByEmail(mockUser.email);
            expect(usersByEmail).toBeDefined();
            expect(usersByEmail.length).toBeGreaterThan(0);
            const foundByEmail = usersByEmail.find(user => user.username === mockUser.username);

            expect(foundByEmail.username).toBe(mockUser.username);
            expect(foundByEmail.is_activated).toBeFalsy();
            expect(foundByEmail.is_suspended).toBeFalsy();
        });
    });

    describe('isInactiveUser', () => {
        it('should check if a user is inactive', async () => {
            // This depends on your database state and may need adjustment
            const inactiveUser = { username: insertedUser.username, activationCode: insertedUser.activation_code };
            const isInactive = await db.isInactiveUser(inactiveUser);
            expect(isInactive).toBeTruthy();
        });
    });

    describe('isActivationCodeValid', () => {
        it('should check if a user is inactive', async () => {
            // This depends on your database state and may need adjustment
            const activationCode = { username: insertedUser.username, activationCode: insertedUser.activation_code };
            const isActivationCodeValid = await db.isActivationCodeValid(activationCode);
            expect(isActivationCodeValid).toBeTruthy();
        });
    });

    describe('activateeUser', () => {
        it('should activate a user', async () => {
            const userToActivate = { username: insertedUser.username, activationCode: insertedUser.activation_code };
            const activationResult = await db.activateUser(userToActivate);
            expect(activationResult).toBeTruthy();
        });
    });

    describe('isInactiveUser', () => {
        it('should check if a user is active', async () => {
            // This depends on your database state and may need adjustment
            const activedUser = { username: insertedUser.username, activationCode: insertedUser.activation_code };
            const isInactive = await db.isInactiveUser(activedUser);
            expect(isInactive).toBeFalsy();
        });
    });

    describe('generateResetToken', () => {
        it('should not  generate a password_reset token for wrong username', async () => {
            const resetResult = await db.generateResetToken(insertedUser.username + 'x');
            expect(resetResult).toBeNull();
        });

        it('should generate a password_reset token', async () => {
            const resetResult = await db.generateResetToken(insertedUser.username);
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
            const userToResetItsPassowrd = { username: insertedUser.username, resetToken: insertedUser.reset_token, passwordHash: mockUser.passwordHash + 'x'};
            const resetResult = await db.resetPassword(userToResetItsPassowrd);
            expect(resetResult).toBeTruthy();
        });

        it('should not set a new password_hash for wrong username', async () => {
            const userToResetItsPassowrd = { username: insertedUser.username + 'x', resetToken: insertedUser.reset_token, passwordHash: mockUser.passwordHash + 'x'};
            const resetResult = await db.resetPassword(userToResetItsPassowrd);
            expect(resetResult).toBeFalsy();
        });

        it('should not set a new password_hash for wrong reset token', async () => {
            const userToResetItsPassowrd = { username: insertedUser.username, resetToken: insertedUser.reset_token + 'x', passwordHash: mockUser.passwordHash + 'x'};
            const resetResult = await db.resetPassword(userToResetItsPassowrd);
            expect(resetResult).toBeFalsy();
        });
    });

    describe('User Details', () => {
        it('should create, retrieve, and update user details', async () => {
            const userDetails = {
                "userId": insertedUser.user_id,
                "firstName": "string1",
                "middleName": "string2",
                "lastName": "string3",
                "genderId": 1,
                "dateOfBirth": "2020-02-29",
                "profilePictureUrl": "http://example.com/123",
                "profilePictureThumbnailUrl": "https://example.com/124",
                "creator": insertedUser.user_id
            };

            // Retrieve no user details
            const results = await db.getUserDetails(userDetails.userId);
            expect(results).toBeNull();

            // Create user details      
            const insertedUserDetails = await db.createUserDetails(userDetails);
            expect(insertedUserDetails).not.toBeNull();
            expect(insertedUserDetails.first_name).toBe(userDetails.firstName);
            expect(insertedUserDetails.middle_name).toBe(userDetails.middleName);
            expect(insertedUserDetails.last_name).toBe(userDetails.lastName);
            expect(insertedUserDetails.gender_id).toBe(userDetails.genderId);
            expect(insertedUserDetails.gender.gender_id).toBe(userDetails.genderId);
            expect(insertedUserDetails.gender.gender_name).toBe('Female');
            expect(insertedUserDetails.date_of_birth).toBe(userDetails.dateOfBirth);
            expect(insertedUserDetails.profile_picture_url).toBe(userDetails.profilePictureUrl);
            expect(insertedUserDetails.profile_picture_thumbnail_url).toBe(userDetails.profilePictureThumbnailUrl);
            expect(insertedUserDetails.creator).toBe(userDetails.creator);
            expect(insertedUserDetails.created_at).toBeDefined();
            expect(insertedUserDetails.updator).toBeNull();
            expect(insertedUserDetails.updated_at).toBeNull();

            // Retrieve user details
            const details = await db.getUserDetails(userDetails.userId);
            expect(details).not.toBeNull();
            expect(details.first_name).toBe(userDetails.firstName);
            expect(details.middle_name).toBe(userDetails.middleName);
            expect(details.last_name).toBe(userDetails.lastName);
            expect(details.gender_id).toBe(userDetails.genderId);
            expect(details.gender.gender_id).toBe(userDetails.genderId);
            expect(details.gender.gender_name).toBe('Female');
            expect(details.date_of_birth).toBe(userDetails.dateOfBirth);
            expect(details.profile_picture_url).toBe(userDetails.profilePictureUrl);
            expect(details.profile_picture_thumbnail_url).toBe(userDetails.profilePictureThumbnailUrl);
            expect(details.creator).toBe(userDetails.creator);
            expect(details.created_at).toBeDefined();
            expect(details.updator).toBeNull();
            expect(details.updated_at).toBeNull();

            // Update user details
            const updatedDetails = {
                "userId": insertedUser.user_id,
                "firstName": "string4",
                "middleName": "string5",
                "lastName": "string6",
                "genderId": 2,
                "dateOfBirth": "1970-03-28",
                "profilePictureUrl": "http://example.com/125",
                "profilePictureThumbnailUrl": "https://example.com/126",
                "creator": insertedUser.user_id,
                "updator": insertedUser.user_id
            };

            const updated = await db.updateUserDetails(updatedDetails.userId, updatedDetails);
            expect(updated).not.toBeNull();
            expect(updated.first_name).toBe(updatedDetails.firstName);
            expect(updated.middle_name).toBe(updatedDetails.middleName);
            expect(updated.last_name).toBe(updatedDetails.lastName);
            expect(updated.gender_id).toBe(updatedDetails.genderId);
            expect(updated.gender.gender_id).toBe(updatedDetails.genderId);
            expect(updated.gender.gender_name).toBe('Male');
            expect(updated.date_of_birth).toBe(updatedDetails.dateOfBirth);
            expect(updated.profile_picture_url).toBe(updatedDetails.profilePictureUrl);
            expect(updated.profile_picture_thumbnail_url).toBe(updatedDetails.profilePictureThumbnailUrl);
            expect(details.creator).toBe(userDetails.creator);
            expect(details.created_at).toBeDefined();
            expect(updated.updator).toBe(updatedDetails.updator);
            expect(updated.updated_at).toBeDefined();
        });
    });


    describe('deleteUserByUsername', () => {
        it('should delete an existing user and return the deleted user data', async () => {

            // Delete the mock user
            const deletedUser = await db.deleteUserByUsername(mockUser.username);
            expect(deletedUser.username).toBe(mockUser.username);

            // Try to fetch the deleted user
            const fetchedUser = await db.getUserByUsername(mockUser.username);
            expect(fetchedUser).toBeNull();

            // Retrieve no user details, as it must be deleted cascadely 
            const results = await db.getUserDetails(insertedUser.user_id);
            expect(results).toBeNull();
        });
    });

    afterAll(async () => {
        await db.closePool();
    });
});