import { Router } from 'express';
import { body, query } from 'express-validator';
import { insertUser, updateUserUpdatedAtToNow, getDeactivatedNotSuspendedUsers, getUserIdByUsername, deleteUser } from '../../utils/database.mjs';
import { sendVerificationEmail } from '../../emails/v1/emailService.mjs';
import { registerAccountLimiter, apiRequestLimiter } from '../../utils/rateLimit.mjs';
import { generateActivationLink, generatePasswordHash } from '../../utils/generators.mjs';
import { updateEventLog } from '../../utils/logger.mjs';
import { userMustNotExist, authenticateToken, authorizeUser, checkRequestValidity, testUrlAccessibility, isValidEmail } from '../../utils/validations.mjs';
import { listRolesForUserInDomains, getUserType, addRoleForUserInDomain, removeRolesForUserInAllDomains } from '../../casbin/casbinSingleton.mjs';

const router = Router();
export default router;

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
      .exists()
      .withMessage((_, { req }) => req.t('Username is required.'))
      .bail()
      .isString()
      .withMessage((_, { req }) => req.t('Username must be a string.'))
      .bail()
      .isLength({ min: 5, max: 30 })
      .withMessage((_, { req }) => req.t('Username must be between 5 and 30 characters.'))
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage((_, { req }) => req.t('Username can only contain letters, numbers, and underscores.'))
      .custom(userMustNotExist)
      .custom((value, { req }) => {
        const reservedUsernames = ['super', 'superdata', 'devhead', 'developer', 'saleshead', 'sales', 'support',
          'admin', 'admindata', 'officer', 'agent', 'enduser', 'public', 'administrator',
          'manager', 'staff', 'employee', 'user'];
        if (reservedUsernames.includes(value.toLowerCase())) {
          throw new Error(req.t('Username cannot be a reserved word.'));
        }
        return true;
      }),

    body('displayName')
      .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
      .isString()
      .withMessage((_, { req }) => req.t('DisplayName must be a string.'))
      .bail()
      .isLength({ max: 50 })
      .withMessage((_, { req }) => req.t('DisplayName can be a maximum of 50 characters.')),

    body('email')
      .exists()
      .withMessage((_, { req }) => req.t('Email is required.'))
      .bail()
      .isString()
      .withMessage((_, { req }) => req.t('Email must be a string.'))
      .bail()
      .isLength({ min: 5, max: 255 })
      .withMessage((_, { req }) => req.t('Email must be between 5 and 255 characters.'))
      .custom((value, { req }) => {
        if (!isValidEmail(value)) {
          throw new Error(req.t('Invalid email address.'));
        }
        return true;
      })
      .toLowerCase(),

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

    body('loginRedirectURL')
      .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
      .isURL({
        protocols: ['http', 'https'],
        require_protocol: true,
        require_tld: false,
      })
      .withMessage((_, { req }) => req.t('The login redirect URL must be a valid URL starting with http:// or https://.'))
      .bail()
      .custom(async (value, { req }) => {
        const res = await testUrlAccessibility(value);
        if(res === false){
          throw new Error(req.t('The login redirect URL is not a valid URL.'));
        }
        return true;
      }),
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
      const user = await insertUser(newUser);

      // by default all users must have the enduser role
      await addRoleForUserInDomain(user.username, "enduser", "0");

      // Optional login redirect URL
      const loginRedirectURL = req.body.loginRedirectURL || '';

      // Create the activation link
      // Let's use the original username to respect its cases
      const activationLink = generateActivationLink(username, user.activation_code, loginRedirectURL);

      // Update user's updated time to now, to give 5 more days timeframe
      updateUserUpdatedAtToNow(username);

      // Send verification email
      // Let's use the original username to respect its cases
      await sendVerificationEmail(req, user.username, user.display_name, user.email, activationLink);

      // Send success response
      return res.status(201).json({ message: req.t('User registered successfully.'), userId: user.user_id });
    } catch (err) {
      updateEventLog(req, { error: 'Error in registering a new user.', details: err });
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
      .exists()
      .withMessage((_, { req }) => req.t('Username or email is required.'))
      .bail()
      .isString()
      .withMessage((_, { req }) => req.t('Username or email must be a string.'))
      .bail()
      .custom((value, { req }) => {
        if (value.includes('@')) {
          // Validate as email          
          if (!isValidEmail(value)) {
            throw new Error(req.t('Invalid email address.'));
          }
          if (value.length < 5 || value.length > 255) {
            throw new Error(req.t('Email must be between 5 and 255 characters.'));
          }
        } else {
          // Validate as username
          const isUsernameValid = /^[A-Za-z0-9_]+$/.test(value);
          if (!isUsernameValid) {
            throw new Error(req.t('Username can only contain letters, numbers, and underscores.'));
          }
          if (value.length < 5 || value.length > 30) {
            throw new Error(req.t('Username must be between 5 and 30 characters.'));
          }
        }
        return true; // Validation passed
      })
      .toLowerCase(),

    body('loginRedirectURL')
      .optional()
      .isURL({
        protocols: ['http', 'https'],
        require_protocol: true,
        require_tld: false,
      })
      .withMessage((_, { req }) => req.t('The login redirect URL must be a valid URL starting with http:// or https://.'))
      .bail()
      .custom(async (value, { req }) => {
        const res = await testUrlAccessibility(value);
        if(res === false)
          throw new Error(req.t('The login redirect URL is not a valid URL.'));
      }),
  ],
  checkRequestValidity,
  async (req, res) => {
    try {
      const { usernameOrEmail } = req.body;
      const users = await getDeactivatedNotSuspendedUsers(usernameOrEmail);

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
      return res.status(200).json({ message: req.t('A new activation link has been sent if there is a registered user related to the provided email or username.') });
    } catch (err) {
      updateEventLog(req, { error: 'Error in resending a new activation link.', details: err });
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
 *     parameters:
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *           minLength: 5
 *           maxLength: 30
 *           pattern: '^[A-Za-z0-9_]+$'
 *         description: "Username of the user to be removed. Optional. If not provided, assumes the current user."
 *         example: "username1"
 *       - in: query
 *         name: domain
 *         schema:
 *           type: string
 *           description: "The domain from which to remove the user. Optional. If not provided, defaults to '0'. Must be a string containing digits."
 *         example: "1"
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
    query('username')
      .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
      .isLength({ min: 5, max: 30 })
      .withMessage((_, { req }) => req.t('Username must be between 5 and 30 characters.'))
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage((_, { req }) => req.t('Username can only contain letters, numbers, and underscores.'))
      .toLowerCase(),

    query('domain')
      .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
      .custom((value, { req }) => {
        // Check if the value is numeric in string form
        if (!/^\d+$/.test(value)) {
          throw new Error(req.t('Domain must be a string containing only digits.'));
        }

        return true; // Passes validation
      })
  ],
  checkRequestValidity,
  authenticateToken,
  async (req, res, next) => {
    const roles = await listRolesForUserInDomains(req.user.username);
    const type = getUserType(roles);
    const domain = (type === 'internal' || !req.query.domain ? '0' : req.query.domain);
    const customerId = (type === 'internal' || domain !== '0' ? req.query.domain : null);
    const username = req.query.username ?? req.user.username;
    const userId = await getUserIdByUsername(username);
    if (userId === null) {
      return res.status(404).json({ message: req.t('There is no such a username.') });
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
      const { username } = req.conditions.where;
      const result = await deleteUser(req.conditions.where);
      if (!isNaN(result) && result > 0) {
        await removeRolesForUserInAllDomains(username);
        return res.status(200).json({ message: req.t('User has been removed successfully.') });
      }
      return res.status(404).json({ message: req.t('There is no such a username.') });
    } catch (err) {
      updateEventLog(req, { error: 'Error in deregistering a user.', details: err });
      return res.status(500).json({ message: err.message });
    }
  }
);
