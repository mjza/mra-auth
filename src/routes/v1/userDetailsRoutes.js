const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../../utils/validations');
const { toLowerCamelCase, encryptObjectItems, decryptObjectItems } = require('../../utils/converters');
const db = require('../../utils/database');
const { apiRequestLimiter } = require('../../utils/rateLimit');
const { recordErrorLog } = require('./auditLogMiddleware');
const moment = require('moment');
const router = express.Router();

// List of optional properties
const optionalProperties = [
  'firstName',
  'middleName',
  'lastName',
  'genderId',
  'dateOfBirth',
  'profilePictureUrl',
  'profilePictureThumbnailUrl',
  'displayName',
  'publicProfilePictureThumbnailUrl'
];

const secretProperties = [
  'firstName',
  'middleName',
  'lastName',
  'dateOfBirth',
  'profilePictureUrl',
  'profilePictureThumbnailUrl'
];

/**
 * @swagger
 * /v1/user_details:
 *   get:
 *     summary: Retrieve user details
 *     description: Get the details of the user whose ID matches the one in the JWT.
 *     tags: [4th]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:  
 *                 userId:
 *                   type: integer               
 *                 firstName:
 *                   type: string
 *                 middleName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 genderId:
 *                   type: integer
 *                 genderName:
 *                   type: string
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                 profilePictureUrl:
 *                   type: string
 *                 profilePictureThumbnailUrl:
 *                   type: string
 *                 displayName:
 *                   type: string
 *                 publicProfilePictureThumbnailUrl:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       404:
 *         description: User details not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User details not found.
 *       429:
 *         $ref: '#/components/responses/ApiRateLimitExceeded'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.get('/user_details', apiRequestLimiter, [authenticateToken],
  //[authorize({ dom: '0', obj: process.env.USER_DETAILS_TABLE, act: 'R', attrs: {userId: 'self'}})], 
  async (req, res) => {
    try {
      const userId = req.user.userId; // Adjust depending on how the user ID is stored in the JWT
      const userDetails = await db.getUserDetails(userId);

      if (!userDetails) {
        return res.status(404).json({ message: 'User details not found' });
      }
      const decrpytedData = decryptObjectItems(toLowerCamelCase(userDetails), secretProperties);
      return res.json(decrpytedData);
    } catch (err) {
      recordErrorLog(req, err);
      return res.status(500).json({ message: err.message });
    }
  });

/**
 * @swagger
 * /v1/user_details:
 *   post:
 *     summary: Create user details
 *     description: Create details for the user whose ID matches the one in the JWT.
 *     tags: [4th]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               firstName:
 *                 type: string
 *               middleName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               genderId:
 *                 type: integer
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               profilePictureUrl:
 *                 type: string
 *               profilePictureThumbnailUrl:
 *                 type: string
 *               displayName:
 *                 type: string
 *               publicProfilePictureThumbnailUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: User details created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: integer
 *                 firstName:
 *                   type: string
 *                 middleName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 genderId:
 *                   type: integer
 *                 genderName:
 *                   type: string
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                 profilePictureUrl:
 *                   type: string
 *                 profilePictureThumbnailUrl:
 *                   type: string
 *                 displayName:
 *                   type: string
 *                 publicProfilePictureThumbnailUrl:
 *                   type: string
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
 *                       msg:
 *                         type: string
 *                         example: First name must be a string.
 *                       param:
 *                         type: string
 *                         example: firstName
 *                       location:
 *                         type: string
 *                         example: body
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       403:
 *         description: Unauthorized access - Update other users!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized to create details for other users.
 *       422:
 *         description: |
 *           Unprocessable Content. This can occur in different scenarios:
 *           - Duplicate record: A record exists for the current user in the user details table.
 *           - Foreign key violation: Invalid foreign key value.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: A record exists for the current user in the user details table.
 *                 details:
 *                   type: string
 *                   example: duplicate key value violates unique constraint 'mra_user_details_pkey'
 *       429:
 *         $ref: '#/components/responses/ApiRateLimitExceeded'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.post('/user_details', apiRequestLimiter,
  [
    authenticateToken,

    body('userId')
      .notEmpty()
      .withMessage('User ID is required.')
      .isInt({ gt: 0 })
      .withMessage('User ID must be an integer greater than 0.'),

    body('firstName')
      .optional()
      .isString()
      .withMessage('First name must be a string.')
      .isLength({ max: 255 })
      .withMessage('First name must not exceed 255 characters.'),

    body('middleName')
      .optional()
      .isString()
      .withMessage('Middle name must be a string.')
      .isLength({ max: 255 })
      .withMessage('Middle name must not exceed 255 characters.'),

    body('lastName')
      .optional()
      .isString()
      .withMessage('Last name must be a string.')
      .isLength({ max: 255 })
      .withMessage('Last name must not exceed 255 characters.'),

    body('genderId')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Gender ID must be an integer between 1 and 10, inclusive.'),

    body('dateOfBirth')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/, 'i')
      .withMessage('Date of birth must be in YYYY-MM-DD format.')
      .custom(value => {
        return moment(value, 'YYYY-MM-DD', true).isValid();
      })
      .withMessage('Date of birth must be a valid date.'),

    body('profilePictureUrl')
      .optional()
      .isString()
      .withMessage('Profile picture URL must be a string.')
      .isURL()
      .withMessage('Profile picture URL must be a valid URL.')
      .isLength({ max: 255 })
      .withMessage('Profile picture URL must not exceed 255 characters.'),

    body('profilePictureThumbnailUrl')
      .optional()
      .isString()
      .withMessage('Profile picture thumbnail URL must be a string.')
      .isURL()
      .withMessage('Profile picture thumbnail URL must be a valid URL.')
      .isLength({ max: 255 })
      .withMessage('Profile picture thumbnail URL must not exceed 255 characters.'),

    body('displayName')
      .optional()
      .isString()
      .withMessage('Display name must be a string.')
      .isLength({ max: 255 })
      .withMessage('Display name must not exceed 255 characters.'),

    body('publicProfilePictureThumbnailUrl')
      .optional()
      .isString()
      .withMessage('Public profile picture thumbnail URL must be a string.')
      .isURL()
      .withMessage('Public profile picture thumbnail URL must be a valid URL.')
      .isLength({ max: 255 })
      .withMessage('Public profile picture thumbnail URL must not exceed 255 characters.')

  ], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userIdFromToken = req.user.userId;
    const userDetails = req.body;

    if (userIdFromToken !== userDetails.userId) {
      return res.status(403).json({ message: 'Unauthorized to create details for other users.' });
    }

    // Set missing properties to null
    optionalProperties.forEach(prop => {
      if (userDetails[prop] === undefined) {
        userDetails[prop] = null;
      }
    });

    try {
      const createdUserDetails = await db.createUserDetails(encryptObjectItems(userDetails, secretProperties));
      return res.status(201).json(decryptObjectItems(toLowerCamelCase(createdUserDetails), secretProperties));
    } catch (err) {
      recordErrorLog(req, err);

      const errorCode = err.original?.code;

      if (errorCode === '23505') { // PostgreSQL foreign key violation error code
        return res.status(422).json({ message: 'A record exists for the current user in the user details table.', details: err.message });
      }

      if (errorCode === '23503') { // PostgreSQL foreign key violation error code
        return res.status(422).json({ message: 'Invalid foreign key value.', details: err.message });
      }

      // Handle other types of errors (e.g., validation errors from Sequelize)
      if (err.name === 'SequelizeValidationError') {
        // Map through err.errors for detailed messages or handle collectively
        const message = 'Validation error occurred.';
        return res.status(400).json({ message, details: err.errors.map(e => e.message) });
      }

      return res.status(500).json({ message: err.message });
    }
  });


/**
 * @swagger
 * /v1/user_details/{userId}:
 *   put:
 *     summary: Update user details
 *     description: Update details for the user whose ID matches the one in the JWT.
 *     tags: [4th]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               middleName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               genderId:
 *                 type: integer
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               profilePictureUrl:
 *                 type: string
 *               profilePictureThumbnailUrl:
 *                 type: string
 *               displayName:
 *                 type: string
 *               publicProfilePictureThumbnailUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: User details updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: integer
 *                 firstName:
 *                   type: string
 *                 middleName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 genderId:
 *                   type: integer
 *                 genderName:
 *                   type: string
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                 profilePictureUrl:
 *                   type: string
 *                 profilePictureThumbnailUrl:
 *                   type: string
 *                 displayName:
 *                   type: string
 *                 publicProfilePictureThumbnailUrl:
 *                   type: string
 *       400:
 *         description: UserId is required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: UserId is required.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       403:
 *         description: Unauthorized access - Update other users!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized to update details for other users. 
 *       404:
 *         description: Not Found - There is no record in the 'user_details' table.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: There is no record for this user in the user details table.
 *       422:
 *         description: Unprocessable Content.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid foreign key value.
 *                 details:
 *                   type: string
 *                   example: insert or update on table 'user_details' violates foreign key constraint 'user_details_gender_id_fkey'
 *       429:
 *         $ref: '#/components/responses/ApiRateLimitExceeded'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.put('/user_details/:userId', apiRequestLimiter,
  [
    authenticateToken,

    // Validate userId
    param('userId')
      .exists()
      .withMessage('UserId is required.')
      .matches(/^[\d]+$/)
      .withMessage('UserId must be a number.'),

    body('firstName')
      .optional()
      .isString()
      .withMessage('First name must be a string.')
      .isLength({ max: 255 })
      .withMessage('First name must not exceed 255 characters.'),

    body('middleName')
      .optional()
      .isString()
      .withMessage('Middle name must be a string.')
      .isLength({ max: 255 })
      .withMessage('Middle name must not exceed 255 characters.'),

    body('lastName')
      .optional()
      .isString()
      .withMessage('Last name must be a string.')
      .isLength({ max: 255 })
      .withMessage('Last name must not exceed 255 characters.'),

    body('genderId')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Gender ID must be an integer between 1 and 10, inclusive.'),

    body('dateOfBirth')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/, 'i')
      .withMessage('Date of birth must be in YYYY-MM-DD format.')
      .custom(value => {
        return moment(value, 'YYYY-MM-DD', true).isValid();
      })
      .withMessage('Date of birth must be a valid date.'),

    body('profilePictureUrl')
      .optional()
      .isString()
      .withMessage('Profile picture URL must be a string.')
      .isURL()
      .withMessage('Profile picture URL must be a valid URL.')
      .isLength({ max: 255 })
      .withMessage('Profile picture URL must not exceed 255 characters.'),

    body('profilePictureThumbnailUrl')
      .optional()
      .isString()
      .withMessage('Profile picture thumbnail URL must be a string.')
      .isURL()
      .withMessage('Profile picture thumbnail URL must be a valid URL.')
      .isLength({ max: 255 })
      .withMessage('Profile picture thumbnail URL must not exceed 255 characters.'),

    body('displayName')
      .optional()
      .isString()
      .withMessage('Display name must be a string.')
      .isLength({ max: 255 })
      .withMessage('Display name must not exceed 255 characters.'),

    body('publicProfilePictureThumbnailUrl')
      .optional()
      .isString()
      .withMessage('Public profile picture thumbnail URL must be a string.')
      .isURL()
      .withMessage('Public profile picture thumbnail URL must be a valid URL.')
      .isLength({ max: 255 })
      .withMessage('Public profile picture thumbnail URL must not exceed 255 characters.')

  ], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userIdFromToken = req.user.userId; // Adjust based on JWT structure
    const { userId } = req.params;
    const userDetails = req.body;

    if (parseInt(userIdFromToken) !== parseInt(userId)) {
      return res.status(403).json({ message: 'Unauthorized to update details for other users.' });
    }

    // Set missing properties to null
    optionalProperties.forEach(prop => {
      if (userDetails[prop] === undefined) {
        userDetails[prop] = null;
      }
    });

    try {
      const updatedUserDetails = await db.updateUserDetails(userId, encryptObjectItems(userDetails, secretProperties));

      if (!updatedUserDetails) {
        return res.status(404).json({ message: 'There is no record for this user in the user details table.' });
      }

      return res.status(200).json(decryptObjectItems(toLowerCamelCase(updatedUserDetails), secretProperties));
    } catch (err) {
      recordErrorLog(req, err);

      if (err.code === '23503') { // PostgreSQL foreign key violation error code
        return res.status(422).json({ message: 'Invalid foreign key value.', details: err.message });
      }

      return res.status(500).json({ message: err.message });
    }
  });


module.exports = router;
