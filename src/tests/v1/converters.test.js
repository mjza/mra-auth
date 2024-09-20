// Mock environment setup
process.env.SECRET_KEY = '0a06bb4c1e6d2b8f62ec71166d8997f588b3b3b1c313bbf14fcdfc9ba882827c';
const ivHexString = 'b16bf361893a9a874671090a4c969ba6';
const iv = Buffer.from(ivHexString, 'hex');
const rawString = 'string';
const base64Encrypted = 'eyJpdiI6ImIxNmJmMzYxODkzYTlhODc0NjcxMDkwYTRjOTY5YmE2IiwiY29udGVudCI6Ijc0ZmFhZjk0ZjE4YSJ9';

// Keep thos lines above this import, otherwise the environment SECRET_KEY will be used.
// Tests are designed with this secret key to see the expected results.
const { encrypt, decrypt, toLowerCamelCase, toSnakeCase, convertRequestData } = require('../../utils/converters');
describe('Test converters', () => {
    describe('Encryption and Decryption Tests', () => {

        test('encrypt should return a base64 string', () => {
            const encryted = encrypt(rawString, iv);
            expect(encryted).not.toBe(rawString);
            expect(typeof encryted).toBe('string');
            expect(encryted).toBe(base64Encrypted);
        });

        test('decrypt should return original string', () => {
            const decryted = decrypt(base64Encrypted);
            expect(typeof decryted).toBe('string');
            expect(decryted).toBe(rawString);
        });
    });

    describe('toLowerCamelCase', () => {
        test('should convert keys from snake_case to lowerCamelCase', () => {
            const inputObj = {
                first_name: 'John',
                last_name: 'Doe',
                contact_info: {
                    email_address: 'john.doe@example.com',
                    phone_number: '1234567890'
                }
            };
            const expectedOutput = {
                firstName: 'John',
                lastName: 'Doe',
                contactInfo: {
                    emailAddress: 'john.doe@example.com',
                    phoneNumber: '1234567890'
                }
            };
            expect(toLowerCamelCase(inputObj)).toEqual(expectedOutput);
        });

        test('should handle date objects correctly', () => {
            const date = new Date();
            const inputObj = { created_at: date };
            expect(toLowerCamelCase(inputObj)).toEqual({ createdAt: date });
        });

        test('should handle arrays correctly', () => {
            const inputObj = { user_ids: [1, 2, 3] };
            expect(toLowerCamelCase(inputObj)).toEqual({ userIds: [1, 2, 3] });
        });
    });

    describe('toSnakeCase', () => {
        test('should convert keys from lowerCamelCase to snake_case', () => {
            const inputObj = {
                firstName: 'John',
                lastName: 'Doe',
                contactInfo: {
                    emailAddress: 'john.doe@example.com',
                    phoneNumber: '1234567890'
                }
            };
            const expectedOutput = {
                first_name: 'John',
                last_name: 'Doe',
                contact_info: {
                    email_address: 'john.doe@example.com',
                    phone_number: '1234567890'
                }
            };
            expect(toSnakeCase(inputObj)).toEqual(expectedOutput);
        });

        test('should handle date objects correctly', () => {
            const date = new Date();
            const inputObj = { createdAt: date };
            expect(toSnakeCase(inputObj)).toEqual({ created_at: date });
        });

        test('should handle arrays correctly', () => {
            const inputObj = { userIds: [1, 2, 3] };
            expect(toSnakeCase(inputObj)).toEqual({ user_ids: [1, 2, 3] });
        });
    });

    describe('convertRequestData', () => {
        test('should convert request data correctly', () => {
            const req = {
                method: 'GET',
                originalUrl: '/api/users/123',
                headers: {
                    'authorization': 'Bearer xyz123',
                    'content-type': 'application/json'
                },
                body: {
                    password: 'secret',
                    email: 'test@example.com',
                    dateOfBirth: new Date(),
                    profilePictureUrl: 'abc',
                    profilePictureThumbnailUrl: 'def',
                },
                query: {
                    token: 'abcdef',
                    page: 1
                },
                params: {
                    id: '123'
                },
                ip: '127.0.0.1',
                hostname: 'localhost',
                protocol: 'http',
                path: '/api/users/124',
                cookies: {
                    sessionId: 'abc123',
                    userId: '456',
                    firstName: 'Mahdi',
                    middleName: 'Jaberzadeh',
                    lastName: 'Ansari'
                }
            };

            const expectedOutput = {
                method: 'GET',
                url: '/api/users/123',
                headers: {
                    'authorization': '****',
                    'content-type': 'application/json'
                },
                body: {
                    password: '****',
                    email: '****',
                    dateOfBirth: '****',
                    profilePictureUrl: '****',
                    profilePictureThumbnailUrl: '****',
                },
                query: {
                    token: '****',
                    page: 1
                },
                params: {
                    id: '123'
                },
                ip: '127.0.0.1',
                hostname: 'localhost',
                protocol: 'http',
                path: '/api/users/124',
                cookies: {
                    sessionId: 'abc123',
                    userId: '456',
                    firstName: '****',
                    middleName: '****',
                    lastName: '****'
                }
            };

            expect(convertRequestData(req)).toEqual(expectedOutput);
        });

        test('should handle circular references gracefully', () => {
            const obj = { a: 1 };
            obj.b = obj;
            const req = { body: obj };

            const result = convertRequestData(req);

            expect(result.body).toEqual(obj);
        });

        test('should handle non-object values', () => {
            const req = {
                method: 'GET',
                body: 'text',
                query: 123,
                params: null,
                cookies: undefined
            };

            const expectedOutput = {
                method: 'GET',
                body: 'text',
                query: 123,
                params: null,
                cookies: undefined
            };

            expect(convertRequestData(req)).toEqual(expectedOutput);
        });
    });

});
