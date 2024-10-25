import './config.mjs';
import { utils } from '@reportcycle/mra-utils';

test('Environment variable should be loaded', () => {
    expect(process.env.DOC_USER).toBeDefined();
    expect(process.env.DOC_PASS).toBeDefined();
});

describe('Global App Instance', () => {
    it('should be an instance of express app', () => {
        // Check for specific properties/methods of an express app
        expect(global.__APP__.use).toBeDefined();
        expect(global.__APP__.get).toBeDefined();
        expect(global.__APP__.post).toBeDefined();
        expect(global.__APP__.listen).toBeDefined();
    });
});

describe('Test utils config', () => {
    it('should return the correct configuration object', () => {
        // Call utils.config() with mocked environment variables
        const config = utils.config();

        // Verify that the configuration matches the expected values
        expect(config).toEqual({
            secretKey: process.env.SECRET_KEY,
            developmentToken: process.env.X_DEVELOPMENT_TOKEN,
            timezone: process.env.TZ
        });
    });
});