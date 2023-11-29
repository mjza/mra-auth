const express = require('express');
const { query, body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const db = require('../db/database');

const router = express.Router();

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
