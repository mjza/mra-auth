import './config.mjs';

test('Environment variable should be loaded', () => {
    expect(process.env.SENDGRID_API_KEY).toBeDefined();
});
