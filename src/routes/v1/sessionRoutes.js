const express = require('express');
const db = require('../../utils/database');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { generateAuthToken, parseJwt } = require('../../utils/generators');
const { apiRequestLimiter } = require('../../utils/rateLimit');
const { updateEventLog } = require('../../utils/logger');
const { authenticateToken } = require('../../utils/validations');
const router = express.Router();

/**
 * @swagger
 * /v1/login:
 *   post:
 *     summary: Login a user
 *     description: Authenticate a user by username or email and password.
 *     tags: [3rd]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usernameOrEmail
 *               - password
 *             properties:
 *               usernameOrEmail:
 *                 type: string
 *                 description: Username or Email of the user
 *                 example: "username1 or test@example.com"
 *               password:
 *                 type: string
 *                 description: Password of the user
 *                 example: "Password1$"
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE2NjEsInVzZXJuYW1lIjoidXNlcm5hbWUxMDEiLCJlbWFpbCI6Im1haGRpLmpiekBnbWFpbC5jb20iLCJpYXQiOjE3MDIxNDY5MjYsImV4cCI6MTcwMjIzMzMyNn0.J0rvd1VZtqaPIKY4irykdIktr1bxcuZSd3yIHC-28NM"
 *                 exp:
 *                   type: integer
 *                   example: 1702233326
 *                   description: Expiration Time of the token
 *                 userId:
 *                   type: integer
 *                   example: 1
 *                 displayName:
 *                   type: string
 *                   example: "Admin"
 *       401:
 *         description: Unauthorized - Invalid username/email or password.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Username or password is incorrect
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/ApiRateLimitExceeded'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 * 
 */
router.post('/login', apiRequestLimiter,
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
    body('password')
      .exists()
      .withMessage('Password is required.')
      .isLength({ max: 30 })
      .withMessage('Password must be maximum 30 characters.')
  ], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { usernameOrEmail, password } = req.body;

    try {
      const users = await db.getUserByUsernameOrEmail(usernameOrEmail);

      if (!users || users.length === 0) {
        return res.status(401).json({ message: 'Username or password is incorrect' });
      }

      let found = false, confirmed = true, deleted = false, suspended = false;
      // Iterate over users and check password
      for (const user of users) {
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (isMatch) {
          found = true;
          if (!user.confirmationAt) {
            confirmed = false;
            continue;
          } else if (user.deletedAt) {
            deleted = true;
            continue;
          } else if (user.suspendedAt) {
            suspended = true;
            continue;
          }

          // Generate JWT Token for the matched user
          const token = generateAuthToken({ userId: user.userId, username: user.username, email: user.email });
          const tokenData = parseJwt(token);
          return res.status(200).json({ token, exp: tokenData.exp, userId: tokenData.userId, displayName: user.displayName });
        }
      }

      if (!found) {// If no user matches
        return res.status(401).json({ message: 'Username or password is incorrect' });
      } else if (!confirmed) {
        return res.status(409).json({ message: 'You must first confirm your email address.' });
      } else if (deleted) {
        return res.status(404).json({ message: 'User has been deleted.' });
      } else if (suspended) {
        return res.status(403).json({ message: 'User has been suspended.' });
      }

      throw new Exception("The login method has a logical error.");
    } catch (err) {
      updateEventLog(req, err);
      return res.status(500).json({ message: err.message });
    }
  });

/**
 * @swagger
 * /v1/logout:
 *   post:
 *     summary: Logout a user
 *     description: Gets the JWT for a user if the current token is valid and records it as a logged out user.
 *     tags: [3rd]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: When logged out successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exp:
 *                   type: string
 *                   description: Successfully logged out.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       429:
 *         $ref: '#/components/responses/ApiRateLimitExceeded'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.post('/logout', apiRequestLimiter, [authenticateToken], async (req, res) => {
  try {
    // Extract the token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    const tokenData = parseJwt(token);

    // Insert the token into the blacklist
    await db.insertBlacklistToken({ token, expiry: tokenData.exp });

    return res.status(200).json({ message: 'Successfully logged out.' });
  } catch (err) {
    updateEventLog(req, err);
    return res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /v1/verify_token:
 *   post:
 *     summary: Verify the passed JWT token
 *     description: Returns the details of the user whose ID matches the one in the JWT.
 *     tags: [3rd]
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
router.post('/verify_token', apiRequestLimiter, [authenticateToken], async (req, res) => {
  try {
    // Get the token from the request header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    return res.status(200).json(parseJwt(token));
  } catch (err) {
    updateEventLog(req, err);
    return res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /v1/refresh_token:
 *   post:
 *     summary: Refresh the JWT token
 *     description: Refreshes the JWT for a user if the current token is valid and close to expiry.
 *     tags: [3rd]
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
    updateEventLog(req, err);
    return res.status(500).json({ message: err.message });
  }
});


module.exports = router;
