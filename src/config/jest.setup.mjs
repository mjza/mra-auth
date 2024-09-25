import dotenv from 'dotenv';
dotenv.config({
    path: 'src/config/.env'
});

test('Environment variable should be loaded', () => {
    expect(process.env.SENDGRID_API_KEY).toBeDefined();
});
