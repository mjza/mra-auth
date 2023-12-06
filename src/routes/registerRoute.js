const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db/database');
const { sendVerificationEmail } = require('../emails/emailService');
const { userMustNotExist } = require('../utils/validations'); 
const { createAccountLimiter } = require('../utils/rateLimit'); 

const router = express.Router();

/**
 * @swagger
 * /register:
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
 *               email:
 *                 type: string
 *                 format: email
 *                 default: "username1@xyz.com"
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
 *                       type:
 *                         type: string
 *                         example: field
 *                       value:
 *                         type: string
 *                         example: usernameX
 *                       msg:
 *                         type: string
 *                         example: Username does not exist.
 *                       path:
 *                         type: string
 *                         example: username
 *                       location:
 *                         type: string
 *                         example: query
 *       429:
 *         $ref: '#/components/responses/CreateApiRateLimitExceeded' 
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 * 
 */
router.post('/register', createAccountLimiter,
  [
    body('username')
      .isLength({ min: 5, max: 30 })
      .withMessage('Username must be between 5 and 30 characters.')
      .custom(userMustNotExist),
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
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('Password must contain at least one symbol')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { username, email, password } = req.body;

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Insert the user into the database
      const newUser = { username, email, passwordHash };
      // The insertUser function is hypothetical. Replace it with your actual database logic.
      const result = await db.insertUser(newUser);

      // Optional login redirect URL
      const loginRedirectURL = req.body.loginRedirectURL || '';

      // Create the activation object
      const activationObject = {
        activationCode: result.activation_code,
        redirectURL: loginRedirectURL,
      };

      // Encrypt the activation object using a secret key
      const secretKeyHex = process.env.SECRET_KEY; 
      const secretKeyBuffer = Buffer.from(secretKeyHex, 'hex');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', secretKeyBuffer, iv);
      let encryptedActivationObject = cipher.update(JSON.stringify(activationObject), 'utf8', 'hex');
      encryptedActivationObject += cipher.final('hex');

      // Create the activation link
      const activationLink = `${process.env.BASE_URL}/activate?username=${result.username}&token=${iv.toString('hex')}&data=${encryptedActivationObject}`;

      // Send verification email
      await sendVerificationEmail(result.username, result.email, activationLink);
      
      // Send success response
      res.status(201).json({ message: "User registered successfully", userId: result.user_id });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

module.exports = router;
