const express = require('express');
const { query, validationResult } = require('express-validator');
const crypto = require('crypto');
const db = require('../db/database');
const { userMustExist, isValidUrl } = require('../utils/validations');
const { apiRequestLimiter } = require('../utils/rateLimit'); 

const router = express.Router();

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
 *         $ref: '#/components/responses/UserMustExistError'
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
    // Validate username
    query('username')
      .isLength({ min: 5, max: 30 })
      .withMessage('Username must be between 5 and 30 characters.')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be alphanumeric.')
      .custom(userMustExist),

    // Validate token
    query('token')
      .isLength({ min: 32, max: 32 })
      .withMessage('Invalid token format.')
      .matches(/^[0-9a-fA-F]+$/)
      .withMessage('Token must be a hexadecimal string.'),

    // Validate data (encryptedActivationObject)
    query('data')
      .isLength({ min: 32 }) 
      .withMessage('Invalid data format.')
      .matches(/^[0-9a-fA-F]+$/)
      .withMessage('Data must be a hexadecimal string.')

  ], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      // Extract validated parameters
      const { username, token, data } = req.query;

      // Convert token (which includes IV) to a buffer
      const iv = Buffer.from(token, 'hex');

      // Decrypt the encrypted data using the secret key and IV
      const secretKeyHex = process.env.SECRET_KEY; 
      const secretKeyBuffer = Buffer.from(secretKeyHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', secretKeyBuffer, iv);
      // Decrypt the encryptedActivationObject
      let decryptedActivationObjectHex = decipher.update(data, 'hex', 'utf8');
      decryptedActivationObjectHex += decipher.final('utf8');

      // Parse the JSON back into an object
      const decryptedActivationObject = JSON.parse(decryptedActivationObjectHex);
      const { activationCode, redirectURL } = decryptedActivationObject;


      // Now you can use the activationCode for further processing
      const user = { username, activationCode };

      // first check if the user has not been already activated
      var isInactivate = await db.isInactiveUser(user);

      var result = false;      
      if(isInactivate){
        result = await db.activeUser(user);
      }

      // Database operation and response handling 
      if (isInactivate === false || result === true) {
        // Check if redirectURL is not empty and is a valid URL
        if (redirectURL && isValidUrl(redirectURL)) {
          // Determine how to append the username based on the ending of redirectURL
          const separator = redirectURL.includes('?') ? '&' : '?';
          
          // Redirect the user to the modified URL
          const redirectLocation = `${redirectURL}${separator}username=${username}`;
          return res.redirect(redirectLocation);
        } else if (isInactivate === false){
          // RedirectURL is empty or not a valid URL and user is already activated
          res.status(202).json({ message: 'Account has been already activated.' });
        } else {
          // RedirectURL is empty or not a valid URL
          res.status(200).json({ message: 'Account is activated successfully.' });
        }
      } else {
        res.status(404).json({ message: 'Invalid activation link has been provided.' });
      }
      
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


module.exports = router;
