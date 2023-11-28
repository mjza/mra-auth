const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const db = require('../database');

const router = express.Router();

// Import controllers if you have them
// const authController = require('../controllers/authController');

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user in the system.
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
 *         description: User successfully registered
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/register', [
  body('username').isLength({ min: 5, max: 30 }).withMessage('Username must be between 5 and 30 characters.'),
  body('email').isEmail().withMessage('Invalid email address.'),
  body('email').isLength({ min: 5, max: 255 }).withMessage('Email must be between 5 and 255 characters.'),
  body('password').isLength({ min: 8, max: 30 }).withMessage('Password must be between 8 and 30 characters.'),
  body('password').matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter'),
  body('password').matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter'),
  body('password').matches(/\d/).withMessage('Password must contain at least one digit'),
  body('password').matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one symbol')
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
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
});

// Login route
router.post('/login', [
  body('email').isEmail().withMessage('Invalid email address.'),
  body('password').exists().withMessage('Password is required.')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

});




module.exports = router;
