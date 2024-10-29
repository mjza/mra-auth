import { validations } from '@reportcycle/mra-utils';
import { compare } from 'bcrypt';
import { Router } from 'express';
import { body } from 'express-validator';
import { getUserByUsernameOrEmail, getUserPrivatePictureUrl, insertBlacklistToken } from '../../utils/database.mjs';
import { generateAuthToken, parseJwt } from '../../utils/generators.mjs';
import { updateEventLog } from '../../utils/logger.mjs';
import { apiRequestLimiter } from '../../utils/rateLimit.mjs';
import { authenticateToken } from '../../utils/validations.mjs';
const { checkRequestValidity, isValidEmail } = validations;

const router = Router();
export default router;

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
 *                   example: "Peter Due"
 *                 profilePictureUrl:
 *                   type: string
 *                   example: "https://abc.com/xyz.png"
 *                 isPrivatePicture:
 *                   type: boolean
 *                   example: true
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
      .exists()
      .withMessage((_, { req }) => req.t('UsernameOrEmail is required.'))
      .bail()
      .isString()
      .withMessage((_, { req }) => req.t('UsernameOrEmail must be a string.'))
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

    body('password')
      .exists()
      .withMessage((_, { req }) => req.t('Password is required.'))
      .bail()
      .isLength({ max: 30 })
      .withMessage((_, { req }) => req.t('Password must be maximum 30 characters.'))
  ],
  checkRequestValidity,
  async (req, res) => {
    try {
      const { usernameOrEmail, password } = req.body;
      const users = await getUserByUsernameOrEmail(usernameOrEmail);

      if (!users || users.length === 0) {
        return res.status(401).json({ message: req.t('Username or password is incorrect.') });
      }

      let found = false, confirmed = true, deleted = false, suspended = false;
      // Iterate over users and check password
      for (const user of users) {
        const isMatch = await compare(password, user.password_hash);

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
          let profilePictureUrl = user.public_profile_picture_url;
          let isPrivatePicture = false;
          if (!profilePictureUrl) {
            profilePictureUrl = await getUserPrivatePictureUrl(user.user_id);
            isPrivatePicture = !!profilePictureUrl;
          }
          return res.status(200).json({ token, exp: tokenData.exp, userId: tokenData.userId, displayName: user.display_name, profilePictureUrl, isPrivatePicture });
        }
      }

      if (!found) {// If no user matches
        return res.status(401).json({ message: req.t('Username or password is incorrect.') });
      } else if (!confirmed) {
        return res.status(409).json({ message: req.t('You must first confirm your email address.') });
      } else if (deleted) {
        return res.status(404).json({ message: req.t('User has been deleted.') });
      } else if (suspended) {
        return res.status(403).json({ message: req.t('User has been suspended.') });
      }

      throw new Exception(req.t('The login method has a logical error.'));
    } catch (err) {
      updateEventLog(req, { error: 'Error in login.', details: err });
      return res.status(500).json({ message: err.message });
    }
  }
);

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
router.post('/logout', apiRequestLimiter,
  [authenticateToken],
  async (req, res) => {
    try {
      // Extract the token from the Authorization header
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      const tokenData = parseJwt(token);

      // Insert the token into the blacklist
      await insertBlacklistToken({ token, expiry: tokenData.exp });

      return res.status(200).json({ message: req.t('Successfully logged out.') });
    } catch (err) {
      updateEventLog(req, { error: 'Error in logout.', details: err });
      return res.status(500).json({ message: err.message });
    }
  }
);

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
router.post('/verify_token', apiRequestLimiter,
  [authenticateToken],
  async (req, res) => {
    try {
      // Get the token from the request header
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
      return res.status(200).json(parseJwt(token));
    } catch (err) {
      updateEventLog(req, { error: 'Error in verifying a token.', details: err });
      return res.status(500).json({ message: err.message });
    }
  }
);

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
router.post('/refresh_token', apiRequestLimiter,
  [authenticateToken],
  async (req, res) => {
    try {
      // Verify the current token
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      const tokenData = parseJwt(token);

      // Generate a new token
      const newToken = generateAuthToken(tokenData);
      const newTokenData = parseJwt(newToken);

      await insertBlacklistToken({ token, expiry: tokenData.exp });

      return res.status(200).json({ token: newToken, exp: newTokenData.exp, userId: newTokenData.userId });
    } catch (err) {
      updateEventLog(req, { error: 'Error in refreshing token.', details: err });
      return res.status(500).json({ message: err.message });
    }
  }
);
