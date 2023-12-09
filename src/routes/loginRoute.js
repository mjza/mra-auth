const express = require('express');
const db = require('../utils/database');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { generateAuthToken, parseJwt } = require('../utils/generators');
const { apiRequestLimiter } = require('../utils/rateLimit');
const { recordErrorLog } = require('./auditLogMiddleware');
const router = express.Router();

/**
 * @swagger
 * /login:
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
 *                         example: usernameOrEmail
 *                       location:
 *                         type: string
 *                         example: body
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
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (isMatch) {

          found = true;

          if (!user.confirmation_at) {
            confirmed = false;
            continue;
          } else if (user.deleted_at) {
            deleted = true;
            continue;
          } else if (user.suspended_at) {
            suspended = true;
            continue;
          }

          // Generate JWT Token for the matched user
          const token = generateAuthToken({ userId: user.user_id, username: user.username, email: user.email });
          const tokenData = parseJwt(token);
          return res.status(200).json({ token, exp: tokenData.exp, userId: tokenData.userId });
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
      recordErrorLog(req, err);
      return res.status(500).json({ message: err.message });
    }
  });

module.exports = router;
