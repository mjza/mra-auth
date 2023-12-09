const express = require('express');
const { query, validationResult } = require('express-validator');
const { sendEmailWithUsernames } = require('../emails/emailService');
const db = require('../utils/database');
const { apiRequestLimiter } = require('../utils/rateLimit');
const { recordErrorLog } = require('./auditLogMiddleware');
const router = express.Router();

/**
 * @swagger
 * /usernames:
 *   get:
 *     summary: Retrieve usernames for a specific email
 *     description: This endpoint allows users to request a list of usernames associated with a specific email address. The list is emailed to them.
 *     tags: [5th]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         description: The email address to search for usernames.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of usernames has been sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If there are any usernames associated with the provided email address, a list of them has been sent to that email address.
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
 *                         example: xyz
 *                       msg:
 *                         type: string
 *                         example: Invalid email format.
 *                       path:
 *                         type: string
 *                         example: email
 *                       location:
 *                         type: string
 *                         example: query
 *       429:
 *         $ref: '#/components/responses/ApiRateLimitExceeded' 
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.get('/usernames', apiRequestLimiter,
  [
    query('email')
      .isEmail()
      .withMessage('Invalid email format.')
  ], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email } = req.query;

      // Retrieve usernames associated with the email
      const usernames = await db.getUsernamesByEmail(email);
      if (usernames && usernames.length > 0) {
            // Send email with the list of usernames
            await sendEmailWithUsernames(req, usernames, email);
      }
      return res.status(200).json({ message: 'If there are any usernames associated with the provided email address, a list of them has been sent to that email address.' });
    } catch (err) {
      recordErrorLog(req, err);
      return res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;
