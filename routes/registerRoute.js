const express = require('express');
const { query, body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const db = require('../db/database');

const router = express.Router();

// Rate limiter for user creation
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many accounts created from this IP, please try again after an hour'
});

const userMustNotExist = async (username) => {
  // Database logic to check if the user exists
  const user = await db.getUserByUsername(username);
  if (user) {
    return Promise.reject('Username already exists.');
  }
};

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user in the system.
 *     tags: [Users]
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
 *                 default: "usename1"
 *               email:
 *                 type: string
 *                 format: email
 *                 default: "username1@xyz.com"
 *               password:
 *                 type: string
 *                 default: "Password1$"
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
 *                         example: usenameX
 *                       msg:
 *                         type: string
 *                         example: Username does not exist.
 *                       path:
 *                         type: string
 *                         example: username
 *                       location:
 *                         type: string
 *                         example: query
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 error:
 *                   type: string
 *                   example: Exception in postgres.
 */
router.post('/register', createAccountLimiter,
  [
    body('username')
      .isLength({ min: 5, max: 30 })
      .withMessage('Username must be between 5 and 30 characters.')
      .custom(userMustNotExist),
    body('email')
      .isEmail()
      .withMessage('Invalid email address.'),
    body('email')
      .isLength({ min: 5, max: 255 })
      .withMessage('Email must be between 5 and 255 characters.'),
    body('password')
      .isLength({ min: 8, max: 30 })
      .withMessage('Password must be between 8 and 30 characters.'),
    body('password')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter'),
    body('password')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter'),
    body('password')
      .matches(/\d/)
      .withMessage('Password must contain at least one digit'),
    body('password')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('Password must contain at least one symbol')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { username, email, password } = req.body;

      // Validate the input

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Insert the user into the database
      const newUser = { username, email, passwordHash };
      // The insertUser function is hypothetical. Replace it with your actual database logic.
      const result = await db.insertUser(newUser);

      // Send success response
      res.status(201).json({ message: "User registered successfully", userId: result.insertId });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });

module.exports = router;
