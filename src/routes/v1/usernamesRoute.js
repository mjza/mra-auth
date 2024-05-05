const express = require('express');
const { query, validationResult } = require('express-validator');
const { sendEmailWithUsernames } = require('../../emails/v1/emailService');
const db = require('../../utils/database');
const { apiRequestLimiter } = require('../../utils/rateLimit');
const { updateEventLog } = require('../../utils/logger');
const { checkRequestValidity } = require('../../utils/validations');
const router = express.Router();

/**
 * @swagger
 * /v1/usernames:
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
 *         $ref: '#/components/responses/ValidationError'
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
  ], 
  checkRequestValidity,
  async (req, res) => {
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
      updateEventLog(req, err);
      return res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;
