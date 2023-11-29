const express = require('express');
const { query, body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const db = require('../db/database');

const router = express.Router();

// Create a general rate limit rule
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 10, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

const userMustExist = async (username) => {
  // Database logic to check if the user exists
  const user = await db.getUserByUsername(username);
  if (!user) {
    return Promise.reject('Username does not exist.');
  }
};


/**
 * @swagger
 * /activate:
 *   get:
 *     summary: Activate a user account
 *     description: This endpoint is used for activating a user account with a username and activation code.
 *     tags: [2nd]
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         description: Username of the user to be activated.
 *         schema:
 *           type: string
 *           default: "usename1"
 *       - in: query
 *         name: activationCode
 *         required: true
 *         description: Activation code for the user account.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account activated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account activated successfully
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
 *       404:
 *         description: User is already activated or invalid activation code has been provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User is already activated or invalid activation code has been provided.
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
router.get('/activate', apiLimiter,
  [
    // Validate username
    query('username')
      .isLength({ min: 5, max: 30 })
      .withMessage('Username must be between 5 and 30 characters.')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be alphanumeric.')
      .custom(userMustExist),

    // Validate activationCode
    query('activationCode')
      .isLength({ min: 10, max: 64 })
      .withMessage('Activation code must be between 10 and 30 characters.')
    // Add any specific validation for activationCode if needed
  ], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      // Extract validated parameters
      const { username, activationCode } = req.query;

      // activate the user in the database
      const user = { username, activationCode };
      var result = await db.activeUser(user);
      // Database operation and response handling 
      if (result === true) {
        res.status(200).json({ message: 'Account activated successfully' });
      } else {
        res.status(404).json({ message: 'User is already activated or invalid activation code has been provided.' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


module.exports = router;
