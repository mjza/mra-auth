export default {
    rootDir: '../../',
    testTimeout: 100000,
    setupFilesAfterEnv: ['<rootDir>/src/config/jest.setup.mjs'],
    testMatch: ['**/tests/**/*.mjs'],
    transform: {
        '^.+\\.mjs$': 'babel-jest',
    },
    testEnvironment: 'node',
};
