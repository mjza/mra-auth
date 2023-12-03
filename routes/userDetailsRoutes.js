const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../utils/validations'); 
const {toLowerCamelCase} = require('../utils/converters');
const db = require('../db/database');
const router = express.Router();

/**
 * @swagger
 * /user_details:
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
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                 profilePictureUrl:
 *                   type: string
 *                 profilePictureThumbnailUrl:
 *                   type: string
 *       401:
 *         description: Unauthorized access - No token provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You must provide a valid JWT token.
 *       403:
 *         description: Unauthorized access - Invalid Token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Provided JWT token is invalid.
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
 *                   example: Exception in server processing.
 * 
 */
router.get('/user_details', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Adjust depending on how the user ID is stored in the JWT
    const userDetails = await db.getUserDetails(userId);

    if (!userDetails) {
      return res.status(404).json({ message: 'User details not found'});
    }

    return res.json(toLowerCamelCase(userDetails));
  } catch (error) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @swagger
 * /user_details:
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
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                 profilePictureUrl:
 *                   type: string
 *                 profilePictureThumbnailUrl:
 *                   type: string
 *       403:
 *         description: Unauthorized access - Update other users!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized to create details for this user.
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
 *                   example: duplicate key value violates unique constraint "mra_user_details_pkey"
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
 *                   example: Exception in server processing.
 *
 */
router.post('/user_details', authenticateToken, async (req, res) => {
  const userIdFromToken = req.user.userId;
  const userDetails = req.body;

  if (userIdFromToken !== userDetails.userId) {
    return res.status(403).json({ message: 'Unauthorized to create details for other users'});
  }

  try {
    const createdUserDetails = await db.createUserDetails(userDetails);
    return res.status(201).json(toLowerCamelCase(createdUserDetails));
  } catch (error) {
    console.error(error);

    if (error.code === '23505') { // PostgreSQL foreign key violation error code
      return res.status(422).json({ message: 'A record exists for the current user.', details: error.message });
    }

    if (error.code === '23503') { // PostgreSQL foreign key violation error code
      return res.status(422).json({ message: 'Invalid foreign key value.', details: error.message });
    }

    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});


/**
 * @swagger
 * /user_details/{userId}:
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
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                 profilePictureUrl:
 *                   type: string
 *                 profilePictureThumbnailUrl:
 *                   type: string
 *       400:
 *         description: UserId is required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: UserId is required.
 *       403:
 *         description: Unauthorized access - Update other users!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized to create details for this user. 
 *       404:
 *         description: Not Found - There is no record in the "user_details" table.
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
 *                   example: insert or update on table "user_details" violates foreign key constraint "user_details_gender_id_fkey"
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
 *                   example: Exception in server processing.
 */
router.put('/user_details/:userId', 
[
  authenticateToken,

  // Validate userId
  param('userId')
  .exists()
  .withMessage('UserId is required.')
  .matches(/^[\d]+$/)
  .withMessage('Userid must be a number.'),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userIdFromToken = req.user.userId; // Adjust based on JWT structure
  const { userId } = req.params;
  const userDetails = req.body;

  if (parseInt(userIdFromToken) !== parseInt(userId)) {
    return res.status(403).json({ message: 'Unauthorized to update details for other users.'});
  }

  try {
    const updatedUserDetails = await db.updateUserDetails(userId, userDetails);

    if(!updatedUserDetails){
      return res.status(404).json({ message: "There is no record for this user in the user details table." });
    }

    return res.status(200).json(toLowerCamelCase(updatedUserDetails));
  } catch (error) {
    console.error(error);

    if (error.code === '23503') { // PostgreSQL foreign key violation error code
      return res.status(422).json({ message: 'Invalid foreign key value.', details: error.message });
    }

    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


module.exports = router;
