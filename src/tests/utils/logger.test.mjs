import { closeDBConnections, deleteAuditLog, deleteUserByUsername, getAuditLogById, insertUser } from '../../utils/database.mjs';
import { generateAuthToken, generateMockUserDB } from '../../utils/generators.mjs';
import { default as auditLogMiddleware, createEventLog, updateEventLog } from '../../utils/logger.mjs';

describe('Event Log Tests', () => {
    let req, expectedReq, mockUser, user, logId;

    // Sample request object to use in tests
    beforeAll(async () => {
        mockUser = await generateMockUserDB();
        user = await insertUser(mockUser);

        req = {
            method: 'TEST POST',
            originalUrl: '/test-route1',
            ip: '127.0.0.1',
            headers: {
                authorization: `Bearer ${generateAuthToken({ userId: user.user_id, username: user.username, email: user.email })}`,
                'x-development-token': 'abcd',
                path: '/test-route2',
                'content-type': 'application/json',
            },
            connection: {
                remoteAddress: '192.168.0.1'
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
            hostname: 'localhost',
            protocol: 'https',
            path: '/test-route3',
            cookies: {
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

        expectedReq = {
            method: 'TEST POST',
            originalUrl: '/test-route1',
            ip: '127.0.0.1',
            headers: {
                authorization: '****',
                'x-development-token': '****',
                path: '/test-route2',
                'content-type': 'application/json',
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
            hostname: 'localhost',
            protocol: 'https',
            path: '/test-route3',
            cookies: {
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
    });

    afterAll(async () => {
        if (logId) {
            const res = await deleteAuditLog(logId);
            expect(res).toBeTruthy();
        }
        if (user) {
            await deleteUserByUsername(user.username);
        }
        await closeDBConnections();
    });

    it('should create an event log in the database', async () => {
        const next = jest.fn();

        // Call the middleware with the mock req, an empty res, and next function
        await auditLogMiddleware(req, {}, next);

        // Check if the middleware created a log entry and added logId to req
        expect(req.logId).toBeGreaterThan(0);
        logId = req.logId; // Store logId for cleanup

        // Verify that the next function was called
        expect(next).toHaveBeenCalled();

        // Check the record in the database
        const logRecord = await getAuditLogById(logId);
        expect(logRecord).toBeDefined();
        expect(logRecord.method_route).toBe('TEST POST:/test-route2');
        expect(logRecord.ip_address).toBe('127.0.0.1');
        expect(logRecord.user_id).toBe(user.user_id.toString()); // Assuming user ID 1 based on provided token
        expect(logRecord.req).toEqual(expectedReq); // Check if request data is stored correctly
    });

    it('should update an existing event log in the database', async () => {
        const comments = 'This is an updated comment';
        const updatedComments = await updateEventLog(req, comments);
        expect(updatedComments).toBe(`,\n${comments}`); // it adds ',\n' to each comment before insert

        // Check the updated record in the database
        const logRecord = await getAuditLogById(logId);
        expect(logRecord).toBeDefined();
        expect(logRecord.comments).toBe(`,\n${comments}`); // it adds ',\n' to each comment before insert
    });

    it('should return null when trying to update a non-existent logId', async () => {
        req.logId = -1; // Invalid log ID
        const comments = 'Attempt to update non-existent log';
        const result = await updateEventLog(req, comments);
        expect(result).toBeNull();
    });

    it('should return 0 when createEventLog fails due to missing data', async () => {
        const incompleteReq = { method: null }; // Malformed request object
        const logId = await createEventLog(incompleteReq);
        expect(logId).toBe(0);
    });
});
