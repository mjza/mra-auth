const express = require('express');
const db = require('../utils/database');
const { body, validationResult } = require('express-validator');
const { generateResetPasswordLink, generateDecryptedObject, generatePasswordHash } = require('../utils/generators');
const { apiRequestLimiter } = require('../utils/rateLimit');
const { recordErrorLog } = require('./auditLogMiddleware');
const { sendResetPasswordEmail } = require('../emails/emailService');
const { userMustExist, testUrlAccessibility } = require('../utils/validations');

const router = express.Router();

/**
 * @swagger
 * /reset_token:
 *   post:
 *     summary: Request password reset token.  
 *     description: Generates a password reset token and emails the reset link to the user emaill.
 *     tags: [6th]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - passwordResetPageRedirectURL
 *             properties:
 *               username:
 *                 type: string
 *                 default: "username1"
 *               passwordResetPageRedirectURL:
 *                 type: string   
 *                 default: "http://localhost:3000/password_reset_page"
 *     responses:
 *       200:
 *         description: Reset token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If an account with the provided username exists, a reset token has been successfully generated and sent to the associated email address.
 *       400:
 *         description: Invalid request parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                         example: Invalid field
 *                       param:
 *                         type: string
 *                         example: username
 *                       location:
 *                         type: string
 *                         example: body
 *       429:
 *         $ref: '#/components/responses/CreateApiRateLimitExceeded' 
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.post('/reset_token', apiRequestLimiter, [
    body('username')
        .exists().withMessage('Username is required.')
        .isLength({ min: 5, max: 30 }).withMessage('Username must be between 5 and 30 characters.'),

    body('passwordResetPageRedirectURL')
        .exists().withMessage('Password reset page redirect URL is required.')
        .custom(testUrlAccessibility).withMessage('The password reset page redirect URL is not a valid url.')
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, passwordResetPageRedirectURL } = req.body;

        const result = await db.generateResetToken(username);

        if (result) {
            // Create the password reset link
            const resetPasswordLink = generateResetPasswordLink(result.username, result.reset_token, passwordResetPageRedirectURL);
            // Send reset password email
            await sendResetPasswordEmail(req, result.username, result.email, resetPasswordLink);
        }

        return res.status(200).json({ message: 'If an account with the provided username exists, a reset token has been successfully generated and sent to the associated email address.' });
    } catch (err) {
        recordErrorLog(req, err);
        // handle error, maybe record error log
        return res.status(500).json({ message: err.message });
    }
});



/**
 * @swagger
 * /reset_password:
 *   put:
 *     summary: Reset the account password
 *     description: This endpoint is used for resetting the password of an account with a username and reset token.
 *     tags: [6th]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - token
 *               - data
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 default: "username1"
 *                 description: Username of the user that should be reset its password.
 *               token:
 *                 type: string
 *                 default: "dbd37705bffe72940295086c2277cb0e"                 
 *                 description: A secret token.
 *               data:
 *                 type: string
 *                 default: "02d9c3a9c8dd83f6fb8a91a80dbcf40dd984a299a39135a93b8181009ee855560ad5de00da68358303f6cb201902d5815153fb5413270d02d9e97d4bdc3c0f473e7d3ddf1a78bad0b72156c3f8449eaa"
 *                 description: A secret encrypted data.
 *               password:
 *                 type: string
 *                 default: "Password1$"
 *     responses:
 *       200:
 *         description: Account's password is reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password is reset successfully.
 *       400:
 *         $ref: '#/components/responses/UserMustExistError'
 *       417:
 *         description: Could not reset password.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Could not reset password.
 *       429:
 *         $ref: '#/components/responses/ApiRateLimitExceeded' 
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.put('/reset_password', apiRequestLimiter,
    [
        // Validate username
        body('username')
            .isLength({ min: 5, max: 30 })
            .withMessage('Username must be between 5 and 30 characters.')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores.')
            .custom(userMustExist),

        // Validate token
        body('token')
            .isLength({ min: 32, max: 32 })
            .withMessage('Invalid token format.')
            .matches(/^[0-9a-fA-F]+$/)
            .withMessage('Token must be a hexadecimal string.'),

        // Validate data (encryptedActivationObject)
        body('data')
            .isLength({ min: 32 })
            .withMessage('Invalid data format.')
            .matches(/^[0-9a-fA-F]+$/)
            .withMessage('Data must be a hexadecimal string.'),

        body('password')
            .isLength({ min: 8, max: 30 })
            .withMessage('Password must be between 8 and 30 characters.')
            .matches(/[A-Z]/)
            .withMessage('Password must contain at least one uppercase letter')
            .matches(/[a-z]/)
            .withMessage('Password must contain at least one lowercase letter')
            .matches(/\d/)
            .withMessage('Password must contain at least one digit')
            .matches(/[!@#$%^&*(),.?":{}|<>]/)
            .withMessage('Password must contain at least one symbol')
    ], async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            // Extract validated parameters
            const { username, token, data, password } = req.body;

            // Hash the password
            const passwordHash = await generatePasswordHash(password);

            const { code } = generateDecryptedObject(token, data);

            const user = { username, resetToken: code, passwordHash };

            var isPasswordReset = await db.resetPassword(user);

            if (isPasswordReset === true) {
                return res.status(200).json({ message: 'Password is reset.' });
            } else {
                return res.status(417).json({ message: 'Could not reset password.' });
            }
        } catch (err) {
            recordErrorLog(req, err);
            return res.status(500).json({ message: err.message });
        }
    });

module.exports = router;
