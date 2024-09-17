const express = require('express');
const { body } = require('express-validator');
const db = require('../../utils/database');
const { sendVerificationEmail } = require('../../emails/v1/emailService');
const { userMustNotExist } = require('../../utils/validations');
const { registerAccountLimiter, apiRequestLimiter } = require('../../utils/rateLimit');
const { generateActivationLink, generatePasswordHash } = require('../../utils/generators');
const { updateEventLog } = require('../../utils/logger');
const { authenticateUser, authorizeUser, checkRequestValidity } = require('../../utils/validations');
const { listRolesForUserInDomains, getUserType, addRoleForUserInDomain, removeRolesForUserInAllDomains } = require('../../casbin/casbinSingleton');
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
router.post('/register', registerAccountLimiter,
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

      // Update user's updated time to now, to give 5 more timeframe
      db.updateUserUpdatedAtToNow(username);

      // Send verification email
      // Let's use the original username to respect its cases
      await sendVerificationEmail(req, user.username, user.display_name, user.email, activationLink);

      // Send success response
      return res.status(201).json({ message: "User registered successfully", userId: user.user_id });
    } catch (err) {
      updateEventLog(req, err);
      return res.status(500).json({ message: err.message });
    }
  });

/**
 * @swagger
 * /v1/resend-activation:
 *   post:
 *     summary: Resend activation code
 *     description: A not activated user can ask for resending the activation code.
 *     tags: [1st]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usernameOrEmail
 *             properties:
 *               usernameOrEmail:
 *                 type: string
 *                 description: Username or Email of the user
 *                 example: "username1 or test@example.com"
 *               loginRedirectURL:
 *                 type: string   
 *                 default: "http://localhost:3000/login"
 *     responses:
 *       200:
 *         description: You request has been processed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: A new activation link has been sent if there is a registered user related to the provided email or username.
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/CreateApiRateLimitExceeded' 
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.post('/resend-activation', registerAccountLimiter,
  [
    body('usernameOrEmail')
      .exists().withMessage('Username or email address is required.')
      .custom((value) => {
        if (value.includes('@')) {
          // Validate as email
          return body('usernameOrEmail')
            .isEmail()
            .withMessage('Invalid email address.')
            .isLength({ min: 5, max: 255 })
            .withMessage('Email must be between 5 and 255 characters.');
        } else {
          // Validate as username
          return body('usernameOrEmail')
            .isLength({ min: 5, max: 30 })
            .withMessage('Username must be between 5 and 30 characters.');
        }
      }),
  ],
  checkRequestValidity,
  async (req, res) => {
    try {
      const { usernameOrEmail } = req.body;
      const users = await db.getDeactivatedNotSuspendedUsers(usernameOrEmail);

      if (users && users.length > 0) {
        // Optional login redirect URL
        const loginRedirectURL = req.body.loginRedirectURL || '';

        for (let user of users) {
          // Create the activation link
          // Let's use the original username to respect its cases
          const activationLink = generateActivationLink(user.username, user.activation_code, loginRedirectURL);

          // Send verification email
          // Let's use the original username to respect its cases
          await sendVerificationEmail(req, user.username, user.display_name, user.email, activationLink);
        }
      }

      // Send success response
      return res.status(200).json({ message: "A new activation link has been sent if there is a registered user related to the provided email or username." });
    } catch (err) {
      updateEventLog(req, err);
      return res.status(500).json({ message: err.message });
    }
  }
);


/**
 * @swagger
 * /v1/deregister:
 *   delete:
 *     summary: Remove a user
 *     description: This endpoint removes an existing user by its username.
 *     tags: [1st]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 30
 *                 pattern: '^[A-Za-z0-9_]+$'
 *                 description: "Username of the user from whom the role is to be removed. Optional. If not provided, assumes the current user."
 *                 example: "username1"
 *               domain:
 *                 type: string
 *                 description: "The domain from which to remove the role. Optional. If not provided, defaults to '0'."
 *                 example: "1"
 *             required:
 *     responses:
 *       200:
 *         description: User has been removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User has been removed successfully."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: When username does not exist or the deletion is failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: There is no such a username.
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.delete('/deregister', apiRequestLimiter,
  [
    body('username')
      .optional({ checkFalsy: true })
      .isString().withMessage('If you provide username, it must be a string.')
      .isLength({ min: 5, max: 30 }).withMessage('Username must be between 5 and 30 characters.')
      .matches(/^[A-Za-z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),

    body('domain')
      .optional({ checkFalsy: true })
      .isNumeric().withMessage('Domain must be a number.'),
  ],
  checkRequestValidity,
  authenticateUser,
  async (req, res, next) => {
    const roles = await listRolesForUserInDomains(req.user.username);
    const type = getUserType(roles);
    const domain = (type === 'internal' || !req.body.domain ? '0' : req.body.domain);
    const customerId = (type === 'internal' || domain !== '0' ? req.body.domain : null);
    const username = req.body.username ?? req.user.username;
    const userId = await db.getUserIdByUsername(username);
    if (userId === null) {
      return res.status(404).json({ message: 'There is no such a username.' });
    }
    const middleware = authorizeUser({
      dom: domain,
      obj: 'mra_users',
      act: 'D',
      attrs: {
        where: {
          username,
          user_id: userId,
          customer_id: customerId
        }
      }
    });
    middleware(req, res, next);
  },
  async (req, res) => {
    try {
      const result = await db.deleteUser(req.conditions.where);
      if (!isNaN(result) && result > 0) {
        const { username } = req.conditions.where;
        await removeRolesForUserInAllDomains(username);
        updateEventLog(req, { success: `Removed all roles in all domains for the user ${username}.` });
        return res.status(200).json({ message: 'User has been removed successfully.' });
      }
      return res.status(404).json({ message: 'There is no such a username.' });
    } catch (err) {
      updateEventLog(req, err);
      return res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
