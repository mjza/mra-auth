const express = require('express');
const db = require('../utils/database');
const { authenticateToken } = require('../utils/validations');
const { apiRequestLimiter } = require('../utils/rateLimit');
const { recordErrorLog } = require('./auditLogMiddleware');
const { parseJwt, generateAuthToken } = require('../utils/generators');
const router = express.Router();

/**
 * @swagger
 * /parse_token:
 *   get:
 *     summary: Parse the passed JWT token
 *     description: Get the details of the user whose ID matches the one in the JWT.
 *     tags: [6th]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token parsed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:                 
 *                 userId:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 iat:
 *                   type: integer
 *                   description: Issued At
 *                 exp:
 *                   type: integer
 *                   description: Expiration Time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       429:
 *         $ref: '#/components/responses/ApiRateLimitExceeded'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.get('/parse_token', apiRequestLimiter, [authenticateToken], async (req, res) => {
    try {
        // Get the token from the request header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        return res.status(200).json(parseJwt(token));
    } catch (err) {
        recordErrorLog(req, err);
        return res.status(500).json({ message: err.message });
    }
});

/**
 * @swagger
 * /refresh_token:
 *   post:
 *     summary: Refresh the JWT token
 *     description: Refreshes the JWT for a user if the current token is valid and close to expiry.
 *     tags: [6th]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 exp:
 *                   type: integer
 *                   description: Expiration Time of the new token
 *                 userId:
 *                   type: integer
 *                   example: 1
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       429:
 *         $ref: '#/components/responses/ApiRateLimitExceeded'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.post('/refresh_token', apiRequestLimiter, [authenticateToken], async (req, res) => {
    try {
        // Verify the current token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN  

        const tokenData = parseJwt(token);

        // Generate a new token
        const newToken = generateAuthToken(tokenData);
        const newTokenData = parseJwt(newToken);

        await db.insertBlacklistToken({ token, expiry: tokenData.exp });

        return res.status(200).json({ token: newToken, exp: newTokenData.exp, userId: newTokenData.userId });
    } catch (err) {
        recordErrorLog(req, err);
        return res.status(500).json({ message: err.message });
    }
});

module.exports = router;