import { Router } from 'express';
import { query, body } from 'express-validator';
import { isActivationCodeValid as _isActivationCodeValid, activateUser, isActiveUser as _isActiveUser } from '../../utils/database.mjs';
import { userMustExist, isValidUrl, checkRequestValidity } from '../../utils/validations.mjs';
import { apiRequestLimiter } from '../../utils/rateLimit.mjs';
import { generateDecryptedObject } from '../../utils/generators.mjs';
import { updateEventLog } from '../../utils/logger.mjs';

const router = Router();
export default router;

/**
 * @swagger
 * /v1/activate:
 *   get:
 *     summary: Activate a user account by token
 *     description: This endpoint is used for activating a user account with a username and activation code.
 *     tags: [2nd]
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         description: Username of the user to be activated.
 *         schema:
 *           type: string
 *           default: "username1"
 *       - in: query
 *         name: token
 *         required: true
 *         description: A secret token.
 *         schema:
 *           type: string
 *           default: "0c578de6ab029f7889c61123ec6fe649"
 *       - in: query
 *         name: data
 *         required: true
 *         description: A secret encrypted data.
 *         schema:
 *           type: string
 *           default: "da749c719c83ae786679ce30faff6a552f2d8a20ead64904af55936d76ba04076eb55279b1362c6296097e271ed01b5179b30a65145fbd1b5cfe75ac9e0c97cb6e7c99a157401b6976a72830ae6946b8a7bd286d52f2f88c1f4be93468c486ea2380f40c2d7c2d3f523a4bbe1de29075"
 *     responses:
 *       200:
 *         description: Account is activated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account is activated successfully.
 *       202:
 *         description: Account has been already activated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account has been already activated.
 *       302:
 *         description: Redirect to the loginRedirectURL if it was provided in the time of registration
 *         headers:
 *           Location:
 *             description: The URL to the loginRedirectURL 
 *             schema:
 *               type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Invalid activation link has been provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid activation link has been provided.
 *       429:
 *         $ref: '#/components/responses/ApiRateLimitExceeded' 
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.get('/activate', apiRequestLimiter,
  [
    query('username')
      .exists()
      .withMessage((_, { req }) => req.t('Username is required.'))
      .bail()
      .isLength({ min: 5, max: 30 })
      .withMessage((_, { req }) => req.t('Username must be between 5 and 30 characters.'))
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage((_, { req }) => req.t('Username can only contain letters, numbers, and underscores.'))
      .custom(userMustExist)
      .toLowerCase(),

    query('token')
      .exists()
      .withMessage((_, { req }) => req.t('Token is required.'))
      .bail()
      .isLength({ min: 32, max: 32 })
      .withMessage((_, { req }) => req.t('Invalid token format.'))
      .matches(/^[0-9a-fA-F]+$/)
      .withMessage((_, { req }) => req.t('Token must be a hexadecimal string.')),

    query('data')
      .exists()
      .withMessage((_, { req }) => req.t('Data is required.'))
      .bail()
      .isLength({ min: 32 })
      .withMessage((_, { req }) => req.t('Invalid data format.'))
      .matches(/^[0-9a-fA-F]+$/)
      .withMessage((_, { req }) => req.t('Data must be a hexadecimal string.'))

  ],
  checkRequestValidity,
  async (req, res) => {
    try {
      // Extract validated parameters
      const { username, token, data } = req.query;

      const { code, redirectURL } = generateDecryptedObject(token, data);

      // Now you can use the activationCode for further processing
      const user = { username, activationCode: code };

      // first check if the user has not been already activated
      var isActivationLinkValid = await _isActivationCodeValid(user);
      var result = false;
      if (isActivationLinkValid)
        result = await activateUser(user);
      var isActiveUser = await _isActiveUser(username);

      // Database operation and response handling 
      if (isActiveUser === true || result === true) {
        // Check if redirectURL is not empty and is a valid URL
        if (redirectURL && isValidUrl(redirectURL)) {
          // Determine how to append the username based on the ending of redirectURL
          const separator = redirectURL.includes('?') ? '&' : '?';
          // Redirect the user to the modified URL
          const redirectLocation = `${redirectURL}${separator}username=${username}`;
          return res.redirect(redirectLocation);
        } else if (isActivationLinkValid === false) {
          // RedirectURL is empty or not a valid URL and user is already activated
          return res.status(202).json({ message: req.t('Account has been already activated.') });
        } else {
          // RedirectURL is empty or not a valid URL
          return res.status(200).json({ message: req.t('Account is activated successfully.') });
        }
      } else if (isActivationLinkValid === false) {
        return res.status(404).json({ message: req.t('Activation link is invalid.') });
      }

      throw new Exception(req.t("Couldn't activate a user while the activation link was valid."));
    } catch (err) {
      updateEventLog(req, { error: 'Error in activating user with link.', details: err });
      return res.status(500).json({ message: err.message });
    }
  }
);

/**
 * @swagger
 * /v1/activate-by-code:
 *   post:
 *     summary: Activate a user account by activation code
 *     description: This endpoint is used for activating a user account with a username and activation code.
 *     tags: [2nd]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username of the user to be activated.
 *                 example: "username1"
 *               activationCode:
 *                 type: string
 *                 description: A secret activation code.
 *                 example: "931411e1681cfab83a55ae69e80d5e9b76e5d7175a700ce98ab914c55f757402"
 *     responses:
 *       200:
 *         description: Account is activated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account is activated successfully.
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Invalid activation code has been provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid activation code has been provided.
 *       429:
 *         $ref: '#/components/responses/ApiRateLimitExceeded'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.post('/activate-by-code', apiRequestLimiter,
  [
    // Validate username
    body('username')
      .exists()
      .withMessage((_, { req }) => req.t('Username is required.'))
      .bail()
      .isString()
      .withMessage((_, { req }) => req.t('Username must be a string.'))
      .bail()
      .isLength({ min: 5, max: 30 })
      .withMessage((_, { req }) => req.t('Username must be between 5 and 30 characters.'))
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage((_, { req }) => req.t('Username can only contain letters, numbers, and underscores.'))
      .custom(userMustExist)
      .toLowerCase(),

    // Activation code
    body('activationCode')
      .exists()
      .withMessage((_, { req }) => req.t('ActivationCode is required.'))
      .bail()
      .isString()
      .withMessage((_, { req }) => req.t('ActivationCode must be a string.'))
      .bail()
      .isLength({ min: 32, max: 64 })
      .withMessage((_, { req }) => req.t('ActivationCode is invalid.')),

  ],
  checkRequestValidity,
  async (req, res) => {
    try {
      // Extract validated parameters
      const { username, activationCode } = req.body;

      // Now you can use the activationCode for further processing
      const user = { username, activationCode };
      const isActivedUser = await _isActiveUser(username);
      if (isActivedUser) {
        return res.status(202).json({ message: req.t('Account has been already activated.') });
      }
      // first check if the user has not been already activated
      const isActivationCodeValid = await _isActivationCodeValid(user);
      let result = false;
      if (isActivationCodeValid)
        result = await activateUser(user);
      const isActiveUser = await _isActiveUser(username);

      // Database operation and response handling 
      if (isActiveUser === true || result === true) {
        return res.status(200).json({ message: req.t('Account is activated successfully.') });
      } else if (isActivationCodeValid === false) {
        return res.status(404).json({ message: req.t('Activation code is invalid.') });
      }

      throw new Exception(req.t("Couldn't activate the user while the activation link was valid."));
    } catch (err) {
      updateEventLog(req, { error: 'Error in activating user using code.', details: err });
      return res.status(500).json({ message: err.message });
    }
  }
);
