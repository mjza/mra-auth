import express from 'express';
import request from 'supertest';
import { apiRequestLimiter, authorizationApiRequestLimiter, registerAccountLimiter } from '../../utils/rateLimit.mjs';

describe('Rate Limiters', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json()); // Middleware to parse JSON bodies
    });

    describe('apiRequestLimiter', () => {
        beforeEach(() => {
            app.use('/api', apiRequestLimiter); // Apply rate limiter to the /api route
            app.get('/api', (_, res) => res.status(200).json({ message: 'API Request Success' }));
        });

        test('should allow 60 requests in 1 minute window', async () => {
            for (let i = 0; i < 60; i++) {
                const response = await request(app).get('/api');
                expect(response.status).toBe(200);
            }
        });

        test('should block requests after exceeding limit', async () => {
            for (let i = 0; i < 60; i++) {
                await request(app).get('/api');
            }
            const response = await request(app).get('/api');
            expect(response.status).toBe(429);
            expect(response.body.message).toBe('Too many requests from this IP, please try again after 1 minutes.');
        });

        test('should skip rate limit with valid development token', async () => {
            process.env.X_DEVELOPMENT_TOKEN = 'valid-token'; // Set valid token
            const response = await request(app)
                .get('/api')
                .set('x-development-token', 'valid-token');
            expect(response.status).toBe(200);
        });
    });

    describe('authorizationApiRequestLimiter', () => {
        beforeEach(() => {
            app.use('/auth', authorizationApiRequestLimiter); // Apply rate limiter to the /auth route
            app.get('/auth', (_, res) => res.status(200).json({ message: 'Auth Request Success' }));
        });

        test('should allow 100 requests in 1 minute window', async () => {
            for (let i = 0; i < 100; i++) {
                const response = await request(app).get('/auth');
                expect(response.status).toBe(200);
            }
        });

        test('should block requests after exceeding limit', async () => {
            for (let i = 0; i < 100; i++) {
                await request(app).get('/auth');
            }
            const response = await request(app).get('/auth');
            expect(response.status).toBe(429);
            expect(response.body.message).toBe('Too many requests from this IP, please try again after 1 minutes.');
        });

        test('should skip rate limit for localhost IPs in development mode', async () => {
            process.env.NODE_ENV = 'development';
            const response = await request(app).get('/auth').set('x-development-token', 'any-token');
            expect(response.status).toBe(200);
        });
    });

    describe('registerAccountLimiter', () => {
        beforeEach(() => {
            app.use('/register', registerAccountLimiter); // Apply rate limiter to the /register route
            app.post('/register', (_, res) => res.status(200).json({ message: 'Registration Success' }));
        });

        test('should allow 5 registration requests in 1 hour window', async () => {
            for (let i = 0; i < 5; i++) {
                const response = await request(app).post('/register');
                expect(response.status).toBe(200);
            }
        });

        test('should block registration requests after exceeding limit', async () => {
            for (let i = 0; i < 5; i++) {
                await request(app).post('/register');
            }
            const response = await request(app).post('/register');
            expect(response.status).toBe(429);
            expect(response.body.message).toBe('Too many registration requests from this IP, please try again after an hour.');
        });

        test('should skip rate limit with valid development token', async () => {
            process.env.X_DEVELOPMENT_TOKEN = 'valid-token'; // Set valid token
            const response = await request(app)
                .post('/register')
                .set('x-development-token', 'valid-token');
            expect(response.status).toBe(200);
        });
    });
});
