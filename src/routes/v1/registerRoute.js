const express = require('express');
const { body } = require('express-validator');
const db = require('../../utils/database');
const { sendVerificationEmail } = require('../../emails/v1/emailService');
const { userMustNotExist } = require('../../utils/validations');
const { createAccountLimiter } = require('../../utils/rateLimit');
const { generateActivationLink, generatePasswordHash } = require('../../utils/generators');
const { updateEventLog } = require('../../utils/logger');
const { addRoleForUserInDomain } = require('../../casbin/casbinSingleton');
const { checkRequestValidity } = require('../../utils/validations');
const router = express.Router();

/**
 * @swagger
 * /v1/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user in the system.
 *     tags: [1st]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 default: "username1"
 *               displayName:
 *                 type: string
 *                 default: "Alex"
 *               email:
 *                 type: string
 *                 format: email
 *                 default: "test@example.com"
 *               password:
 *                 type: string
 *                 default: "Password1$"
 *               loginRedirectURL:
 *                 type: string   
 *                 default: "http://localhost:3000/login"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 userId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/CreateApiRateLimitExceeded' 
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.post('/register', createAccountLimiter,
  [
    body('username')
      .isLength({ min: 5, max: 30 })
      .withMessage('Username must be between 5 and 30 characters.')
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores.')
      .custom(userMustNotExist)
      .custom((username) => {
        // TODO: Make a test for it.
        const reservedUsernames = ['super', 'superdata', 'devhead', 'developer', 'saleshead', 'sales', 'support',
          'admin', 'admindata', 'officer', 'agent', 'enduser', 'public', 'administrator',
          'manager', 'staff', 'employee', 'user'];
        if (reservedUsernames.includes(username.toLowerCase())) {
          throw new Error('Username cannot be a reserved word.');
        }
        return true;
      }),

    body('email')
      .isEmail()
      .withMessage('Invalid email address.')
      .isLength({ min: 5, max: 255 })
      .withMessage('Email must be between 5 and 255 characters.'),

    body('password')
      .isLength({ min: 8, max: 30 })
      .withMessage('Password must be between 8 and 30 characters.')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/\d/)
      .withMessage('Password must contain at least one digit')
      .matches(/[`~!@#$%^&*()-_=+{}|\\[\]:";'<>?,./]/)
      .withMessage('Password must contain at least one symbol')
  ],
  checkRequestValidity,
  async (req, res) => {
    try {
      const { username, email, password, displayName } = req.body;

      // Hash the password
      const passwordHash = await generatePasswordHash(password);

      // Insert the user into the database
      const newUser = { username, email, passwordHash, displayName: displayName || username };
      // The insertUser function is hypothetical. Replace it with your actual database logic.
      const user = await db.insertUser(newUser);

      await addRoleForUserInDomain(user.username, "enduser", "0");

      // Optional login redirect URL
      const loginRedirectURL = req.body.loginRedirectURL || '';

      // Create the activation link
      // Let's use the original username to respect its cases
      const activationLink = generateActivationLink(username, user.activation_code, loginRedirectURL);

      // Send verification email
      // Let's use the original username to respect its cases
      await sendVerificationEmail(req, user.username, user.displayName, user.email, activationLink);

      // Send success response
      return res.status(201).json({ message: "User registered successfully", userId: user.user_id });
    } catch (err) {
      updateEventLog(req, err);
      return res.status(500).json({ message: err.message });
    }
  });

module.exports = router;
