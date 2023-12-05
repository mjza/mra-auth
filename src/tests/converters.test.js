const { toLowerCamelCase, encrypt, decrypt, encryptObjectItems, decryptObjectItems } = require('../utils/converters');

// Mock environment setup
process.env.SECRET_KEY = '0a06bb4c1e6d2b8f62ec71166d8997f588b3b3b1c313bbf14fcdfc9ba882827c';
const ivHexString = 'b16bf361893a9a874671090a4c969ba6';
const iv = Buffer.from(ivHexString, 'hex');
const rawString = 'string';
const base64Encrypted = 'eyJpdiI6ImIxNmJmMzYxODkzYTlhODc0NjcxMDkwYTRjOTY5YmE2IiwiY29udGVudCI6Ijc0ZmFhZjk0ZjE4YSJ9';


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

describe('Object Encryption and Decryption Tests', () => {
    const testObject = { key1: 'string', key2: 'notstring' };

    test('encryptObjectItems should encrypt all string values', () => {
        const encryptedObject = encryptObjectItems(testObject, iv);
        expect(encryptedObject.key1).not.toBe(testObject.key1);
        expect(encryptedObject.key2).not.toBe(testObject.key2);
        expect(encryptedObject.key1).toBe(base64Encrypted);
        expect(encryptedObject.key2).not.toBe(base64Encrypted);
    });

    test('decryptObjectItems should decrypt all string values', () => {
        const encryptedObject = encryptObjectItems(testObject, iv);
        const decryptedObject = decryptObjectItems(encryptedObject);
        expect(decryptedObject).toEqual(testObject);
    });

});

describe('toLowerCamelCase Tests', () => {
    const testObject = { first_key: 'value1', second_key: 'value2' };

    test('should convert object keys to camelCase', () => {
        const camelCaseObject = toLowerCamelCase(testObject);
        expect(camelCaseObject).toEqual({ firstKey: 'value1', secondKey: 'value2' });
    });

});
