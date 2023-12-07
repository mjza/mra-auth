const gn = require('../utils/generators');

describe('generateEncryptedActivationObject', () => {
    it('should return an object with token and data', () => {
        const activationCode = '12345';
        const redirectURL = 'http://example.com';

        const result = gn.generateEncryptedActivationObject(activationCode, redirectURL);

        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('data');
        expect(typeof result.token).toBe('string');
        expect(typeof result.data).toBe('string');
    });
});


describe('generateActivationLink', () => {
    it('should return a valid activation link', () => {
        const username = 'testuser';
        const activationCode = '12345';
        const redirectURL = 'http://example.com/login';

        const result = gn.generateActivationLink(username, activationCode, redirectURL);

        expect(typeof result).toBe('string');
        expect(result).toContain(username);
        expect(result).toContain('token');
        expect(result).toContain('data');
    });
});

describe('generateDecryptedActivationObject', () => {
    it('should return an object with activationCode and redirectURL', () => {
        const username = 'testuser';
        const activationCode = '12345';
        const redirectURL = 'http://example.com/login';

        const link = gn.generateActivationLink(username, activationCode, redirectURL);
        const url = new URL(link);
        const queryParams = new URLSearchParams(url.search);

        const token = queryParams.get('token');
        const data = queryParams.get('data');

        const result = gn.generateDecryptedActivationObject(token, data);

        expect(result).toHaveProperty('activationCode');
        expect(result).toHaveProperty('redirectURL');
        expect(typeof result.activationCode).toBe('string');        
        expect(typeof result.redirectURL).toBe('string');
        expect(result.activationCode).toBe(activationCode);        
        expect(result.redirectURL).toBe(redirectURL);
    });
});


describe('generateRandomString', () => {
    it('should return a string of default length 8', () => {
        const result = gn.generateRandomString();

        expect(typeof result).toBe('string');
        expect(result).toHaveLength(8);
    });

    it('should return a string of specified length', () => {
        const length = 10;
        const result = gn.generateRandomString(length);

        expect(typeof result).toBe('string');
        expect(result).toHaveLength(length);
    });
});
