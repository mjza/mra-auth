import { validations } from '@reportcycle/mra-utils';
import { Router } from 'express';
import { body } from 'express-validator';
import { sendResetPasswordEmail } from '../../emails/v1/emailService.mjs';
import { generateResetToken, resetPassword } from '../../utils/database.mjs';
import { generateDecryptedObject, generatePasswordHash, generateResetPasswordLink } from '../../utils/generators.mjs';
import { updateEventLog } from '../../utils/logger.mjs';
import { apiRequestLimiter } from '../../utils/rateLimit.mjs';
import { userMustExist } from '../../utils/validations.mjs';
const { testUrlAccessibility, checkRequestValidity } = validations;


const router = Router();
export default router;

/**
 * @swagger
 * /v1/reset_token:
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
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/CreateApiRateLimitExceeded'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.post('/reset_token', apiRequestLimiter,
    [
        body('username')
            .exists()
            .withMessage((_, { req }) => req.t('Username is required.'))
            .bail()
            .isString()
            .withMessage((_, { req }) => req.t('Username must be a string.'))
            .bail()
            .isLength({ min: 5, max: 30 })
            .withMessage('Username must be between 5 and 30 characters.'),

        body('passwordResetPageRedirectURL')
            .exists()
            .withMessage((_, { req }) => req.t('Password reset page redirect URL is required.'))
            .bail()
            .isString()
            .withMessage((_, { req }) => req.t('Password reset page redirect URL must be a string.'))
            .bail()
            .custom(async (value, { req }) => {
                const res = await testUrlAccessibility(value);
                if (res === false)
                    throw new Error(req.t('The login redirect URL is not a valid URL.'));
            }),
    ],
    checkRequestValidity,
    async (req, res) => {
        try {
            const { username, passwordResetPageRedirectURL } = req.body;

            const result = await generateResetToken(username);

            if (result) {
                // Create the password reset link
                const resetPasswordLink = generateResetPasswordLink(username, result.reset_token, passwordResetPageRedirectURL);
                // Send reset password email
                await sendResetPasswordEmail(req, result.username, result.display_name, result.email, resetPasswordLink);
            }

            return res.status(200).json({ message: req.t('If an account with the provided username exists, a reset token has been successfully generated and sent to the associated email address.') });
        } catch (err) {
            updateEventLog(req, { error: 'Error in sending reset token.', details: err });
            // handle error, maybe record error log
            return res.status(500).json({ message: err.message });
        }
    }
);

/**
 * @swagger
 * /v1/reset_password:
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
 *         $ref: '#/components/responses/ValidationError'
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
        body('username')
            .exists()
            .withMessage((_, { req }) => req.t('Username is required.'))
            .bail()
            .isString()
            .withMessage((_, { req }) => req.t('Username must be a string.'))
            .bail()
            .isLength({ min: 5, max: 30 })
            .withMessage((_, { req }) => req.t('Username must be between 5 and 30 characters.'))
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage((_, { req }) => req.t('Username can only contain letters, numbers, and underscores.'))
            .custom(userMustExist)
            .toLowerCase(),

        body('token')
            .exists()
            .withMessage((_, { req }) => req.t('Token is required.'))
            .bail()
            .isString()
            .withMessage((_, { req }) => req.t('Token must be a string.'))
            .bail()
            .isLength({ min: 32, max: 32 })
            .withMessage((_, { req }) => req.t('Invalid token format.'))
            .matches(/^[0-9a-fA-F]+$/)
            .withMessage((_, { req }) => req.t('Token must be a hexadecimal string.')),

        body('data')
            .exists()
            .withMessage((_, { req }) => req.t('Data is required.'))
            .bail()
            .isString()
            .withMessage((_, { req }) => req.t('Data must be a string.'))
            .bail()
            .isLength({ min: 32 })
            .withMessage((_, { req }) => req.t('Invalid data format.'))
            .matches(/^[0-9a-fA-F]+$/)
            .withMessage((_, { req }) => req.t('Data must be a hexadecimal string.')),

        body('password')
            .exists()
            .withMessage((_, { req }) => req.t('Password is required.'))
            .bail()
            .isString()
            .withMessage((_, { req }) => req.t('Password must be a string.'))
            .bail()
            .isLength({ min: 8, max: 30 })
            .withMessage((_, { req }) => req.t('Password must be between 8 and 30 characters.'))
            .matches(/[A-Z]/)
            .withMessage((_, { req }) => req.t('Password must contain at least one uppercase letter.'))
            .matches(/[a-z]/)
            .withMessage((_, { req }) => req.t('Password must contain at least one lowercase letter.'))
            .matches(/\d/)
            .withMessage((_, { req }) => req.t('Password must contain at least one digit.'))
            .matches(/[`~!@#$%^&*()\-_=+{}|\[\]:";'<>?,.\/\\]/)
            .withMessage((_, { req }) => req.t('Password must contain at least one latin symbol.')),
    ],
    checkRequestValidity,
    async (req, res) => {
        try {
            // Extract validated parameters
            const { username, token, data, password } = req.body;

            // Hash the password
            const passwordHash = await generatePasswordHash(password);

            const { code } = generateDecryptedObject(token, data);

            const user = { username, resetToken: code, passwordHash };

            var isPasswordReset = await resetPassword(user);

            if (isPasswordReset === true) {
                return res.status(200).json({ message: req.t('Password has been reset.') });
            } else {
                return res.status(417).json({ message: req.t("Couldn't reset password.") });
            }
        } catch (err) {
            updateEventLog(req, { error: 'Error in reseting password.', details: err });
            return res.status(500).json({ message: err.message });
        }
    }
);
