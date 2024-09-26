import { convertRequestData, decrypt, encrypt, toLowerCamelCase, toSnakeCase } from '../../utils/converters.mjs';

describe('Test converters', () => {

    describe('Encryption and Decryption Tests', () => {

        process.env.SECRET_KEY = '0a06bb4c1e6d2b8f62ec71166d8997f588b3b3b1c313bbf14fcdfc9ba882827c';
        const ivHexString = 'b16bf361893a9a874671090a4c969ba6';
        const iv = Buffer.from(ivHexString, 'hex');
        const rawString = 'string';
        const base64Encrypted = 'eyJpdiI6ImIxNmJmMzYxODkzYTlhODc0NjcxMDkwYTRjOTY5YmE2IiwiY29udGVudCI6Ijc0ZmFhZjk0ZjE4YSJ9';

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
                    'content-type': 'application/json',
                    'x-development-token': 'abcd'
                },
                body: {
                    key: 'Bvalue',
                    anotherKey: 'BanotherValue',
                    nullValue: null,
                    falseValue: false,
                    trueValue: true,
                    zero: 0,
                    negative: -123,
                    posetive: 456,
                    float: 89.5623,
                    password: '1abc',
                    token: '2def',
                    email: 'a@b.com',
                    firstName: 'John',
                    middleName: null,
                    lastName: 'Doh',
                    dateOfBirth: new Date('1985-05-15'),
                    profilePictureUrl: 'https://abc.com/g.jpg',
                    profilePictureThumbnailUrl: 'https://example.com/h.bmp'
                },
                query: {
                    key: 'Qvalue',
                    anotherKey: 'QanotherValue',
                    nullValue: null,
                    falseValue: false,
                    trueValue: true,
                    zero: 0,
                    negative: -123,
                    posetive: 456,
                    float: 89.5623,
                    password: '1abc',
                    token: '2def',
                    email: 'a@b.com',
                    firstName: 'John',
                    middleName: null,
                    lastName: 'Doh',
                    dateOfBirth: new Date('1985-05-15'),
                    profilePictureUrl: 'https://abc.com/g.jpg',
                    profilePictureThumbnailUrl: 'https://example.com/h.bmp'
                },
                params: {
                    key: 'Pvalue',
                    anotherKey: 'PanotherValue',
                    nullValue: null,
                    falseValue: false,
                    trueValue: true,
                    zero: 0,
                    negative: -123,
                    posetive: 456,
                    float: 89.5623,
                    password: '1abc',
                    token: '2def',
                    email: 'a@b.com',
                    firstName: 'John',
                    middleName: null,
                    lastName: 'Doh',
                    dateOfBirth: new Date('1985-05-15'),
                    profilePictureUrl: 'https://abc.com/g.jpg',
                    profilePictureThumbnailUrl: 'https://example.com/h.bmp'
                },
                ip: '127.0.0.1',
                hostname: 'localhost',
                protocol: 'http',
                path: '/api/users/124',
                cookies: {
                    sessionId: 'abc123',
                    userId: '456',
                    key: 'Cvalue',
                    anotherKey: 'CanotherValue',
                    nullValue: null,
                    falseValue: false,
                    trueValue: true,
                    zero: 0,
                    negative: -123,
                    posetive: 456,
                    float: 89.5623,
                    password: '1abc',
                    token: '2def',
                    email: 'a@b.com',
                    firstName: 'John',
                    middleName: null,
                    lastName: 'Doh',
                    dateOfBirth: new Date('1985-05-15'),
                    profilePictureUrl: 'https://abc.com/g.jpg',
                    profilePictureThumbnailUrl: 'https://example.com/h.bmp'
                }
            };

            const expectedOutput = {
                method: 'GET',
                originalUrl: '/api/users/123',
                headers: {
                    'authorization': '****',
                    'content-type': 'application/json',
                    'x-development-token': '****'
                },
                body: {
                    key: 'Bvalue',
                    anotherKey: 'BanotherValue',
                    nullValue: null,
                    falseValue: false,
                    trueValue: true,
                    zero: 0,
                    negative: -123,
                    posetive: 456,
                    float: 89.5623,
                    password: '****',
                    token: '****',
                    email: '****',
                    firstName: '****',
                    middleName: '****',
                    lastName: '****',
                    dateOfBirth: '****',
                    profilePictureUrl: '****',
                    profilePictureThumbnailUrl: '****'
                },
                query: {
                    key: 'Qvalue',
                    anotherKey: 'QanotherValue',
                    nullValue: null,
                    falseValue: false,
                    trueValue: true,
                    zero: 0,
                    negative: -123,
                    posetive: 456,
                    float: 89.5623,
                    password: '****',
                    token: '****',
                    email: '****',
                    firstName: '****',
                    middleName: '****',
                    lastName: '****',
                    dateOfBirth: '****',
                    profilePictureUrl: '****',
                    profilePictureThumbnailUrl: '****'
                },
                params: {
                    key: 'Pvalue',
                    anotherKey: 'PanotherValue',
                    nullValue: null,
                    falseValue: false,
                    trueValue: true,
                    zero: 0,
                    negative: -123,
                    posetive: 456,
                    float: 89.5623,
                    password: '****',
                    token: '****',
                    email: '****',
                    firstName: '****',
                    middleName: '****',
                    lastName: '****',
                    dateOfBirth: '****',
                    profilePictureUrl: '****',
                    profilePictureThumbnailUrl: '****'
                },
                ip: '127.0.0.1',
                hostname: 'localhost',
                protocol: 'http',
                path: '/api/users/124',
                cookies: {
                    sessionId: 'abc123',
                    userId: '456',
                    key: 'Cvalue',
                    anotherKey: 'CanotherValue',
                    nullValue: null,
                    falseValue: false,
                    trueValue: true,
                    zero: 0,
                    negative: -123,
                    posetive: 456,
                    float: 89.5623,
                    password: '****',
                    token: '****',
                    email: '****',
                    firstName: '****',
                    middleName: '****',
                    lastName: '****',
                    dateOfBirth: '****',
                    profilePictureUrl: '****',
                    profilePictureThumbnailUrl: '****'
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
