import { Router } from 'express';
import { query } from 'express-validator';
import { sendEmailWithUsernames } from '../../emails/v1/emailService.mjs';
import { getUsernamesByEmail } from '../../utils/database.mjs';
import { apiRequestLimiter } from '../../utils/rateLimit.mjs';
import { updateEventLog } from '../../utils/logger.mjs';
import { checkRequestValidity, isValidEmail } from '../../utils/validations.mjs';

const router = Router();
export default router;

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
      .exists()
      .withMessage((_, { req }) => req.t('Email is required.'))
      .bail()
      .isLength({ min: 5, max: 255 })
      .withMessage((_, { req }) => req.t('Email must be between 5 and 255 characters.'))
      .bail()
      .custom((value, { req }) => {
        if (!isValidEmail(value)) {
          throw new Error(req.t('Invalid email address.'));
        }
        return true;
      })
      .toLowerCase(),
  ],
  checkRequestValidity,
  async (req, res) => {
    try {
      const { email } = req.query;

      // Retrieve usernames associated with the email
      const usernames = await getUsernamesByEmail(email);
      if (usernames && usernames.length > 0) {
        // Send email with the list of usernames
        await sendEmailWithUsernames(req, usernames, email);
      }
      return res.status(200).json({ message: req.t('If there are any usernames associated with the provided email address, a list of them has been sent to that email address.') });
    } catch (err) {
      updateEventLog(req, { error: 'Error in GET /usernames.', details: err });
      return res.status(500).json({ message: req.t('Internal server error.') });
    }
  });
