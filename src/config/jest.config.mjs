export default {
    rootDir: '../../',
    testTimeout: 100000,
    setupFilesAfterEnv: ['<rootDir>/src/config/jest.setup.mjs'],
    testMatch: ['**/tests/**/*.mjs'],
    transform: {
        '^.+\\.mjs$': ['babel-jest', { configFile: './src/config/babel.config.cjs' }],
    },
    testEnvironment: 'node',
    transformIgnorePatterns: [
        '/node_modules/',
    ],
};
