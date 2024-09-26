import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { listRolesForUserInDomains } from '../../casbin/casbinSingleton.mjs';
import { getData } from '../../utils/customDataStore.mjs';
import { updateEventLog } from '../../utils/logger.mjs';
import { authorizationApiRequestLimiter } from '../../utils/rateLimit.mjs';
import { authenticateUser } from '../../utils/validations.mjs';

const router = Router();
export default router;

/**
 * Middleware array for validating authorization request parameters.
 * This validation chain checks that the necessary fields are included in the request body
 * and that each field conforms to the expected type and constraints.
 * 
 * Validations performed:
 * - `dom`: Required. Must be a non-empty string. Represents the domain within which the action is attempted.
 * - `obj`: Required. Must be a non-empty string. Represents the object or resource the user is trying to access.
 * - `act`: Required. Must be a non-empty string. Represents the action the user is attempting to perform on the object.
 * - `attrs`: Optional. If provided, must be a JSON object. Represents additional attributes relevant to the authorization context.
 * 
 * If any validations fail, a 400 Bad Request response is sent with details of the validation errors.
 * If all validations pass, control is passed to the next middleware in the chain.
 */
const validateAuthorizationRequest = [
    body('dom')
        .notEmpty()
        .withMessage((_, { req }) => req.t('Domain (dom) is required'))
        .bail()
        .isString()
        .withMessage((_, { req }) => req.t('Domain (dom) must be a string')),

    body('obj')
        .notEmpty()
        .withMessage((_, { req }) => req.t('Object (obj) is required'))
        .bail()
        .isString()
        .withMessage((_, { req }) => req.t('Object (obj) must be a string')),

    body('act')
        .notEmpty()
        .withMessage((_, { req }) => req.t('Action (act) is required'))
        .bail()
        .isString()
        .withMessage((_, { req }) => req.t('Action (act) must be a string')),

    body('attrs')
        .optional()
        .isObject()
        .withMessage((_, { req }) => req.t('Attributes (attrs) must be a JSON object if provided')),

    (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                updateEventLog(req, { error: 'Validation errors.', details: errors });
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        } catch (err) {
            updateEventLog(req, { error: 'An error occurred while validating auth elements.', details: err });
            return res.status(500).json({ message: err.message });
        }
    }
];

/**
 * @swagger
 * components:
 *   requests:
 *     Authorization:
 *       type: object
 *       required:
 *         - dom
 *         - obj
 *         - act
 *         - attrs
 *       properties:
 *         dom:
 *           type: string
 *           example: '0'
 *           description: The domain (e.g., customer ID) within which the action is being attempted
 *         obj:
 *           type: string
 *           example: 'mra_users'
 *           description: The object or resource the user is trying to access
 *         act:
 *           type: string
 *           example: 'R'
 *           description: The action the user is trying to perform on the object
 *         attrs:
 *           type: object
 *           example: {}
 *           description: Additional attributes relevant to the authorization context
 */
/**
 * Asynchronous middleware for authorizing user actions based on their permissions.
 * This function extracts required parameters from the request body and the authenticated
 * user's information, then uses a Casbin enforcer to determine if the action is authorized.
 *
 * The function expects the request body to contain:
 * - `dom`: The domain within which the action is attempted (e.g., a customer ID).
 * - `obj`: The object or resource the user is trying to access.
 * - `act`: The action the user is attempting to perform on the object.
 * - `attrs`: Optional. Additional attributes relevant to the authorization context, as a JSON object.
 *
 * Additionally, it requires `req.user` to contain the authenticated user's info, specifically a `username`,
 * and `req.enforcer` to provide a Casbin enforcer instance for performing authorization checks.
 *
 * @param {Object} req The request object, expected to include `user` info and the Casbin `enforcer` in its properties.
 * @param {Object} res The response object used to return the outcome of the authorization check.
 * @param {Function} next The next middleware function in the stack.
 *
 * On success (authorization granted), it calls `next()` to pass control to the next middleware.
 * On failure, it returns a JSON response with an error message and appropriate HTTP status code:
 * - 403 Forbidden if the user is not authorized.
 * - 400 Bad Request if required request parameters are missing or invalid.
 * - 500 Internal Server Error for any other errors encountered during processing.
 *
 * @async
 * @returns {Promise<void>} No explicit return value but may send a response to the client.
 */
async function authorize(req, res, next) {
    try {
        // Extract dom, obj, and act directly from the request body
        const { dom, obj, act, attrs } = req.body;

        // Extract the subject from the authenticated user information
        // The `req.user` contains sufficient info to identify the subject, like a username or userId
        const sub = req.user.username;

        // Extract the Casbin enforcer from req
        const enforcer = req.enforcer;
        // Perform the authorization check with Casbin
        // This assumes you have access to the Casbin enforcer instance (`enforcer`) here
        const authorized = await enforcer.enforce(sub, dom, obj, act, attrs);

        if (!authorized) {
            updateEventLog(req, { error: 'User is not authorized.' });
            return res.status(403).json({ message: req.t('User is not authorized.') });
        }
        next();
    } catch (err) {
        updateEventLog(req, { error: 'An error occurred while processing the request for authorization.', details: err });
        return res.status(500).json({ message: err.message });
    }
}

/**
 * @swagger
 * /v1/authorize:
 *   post:
 *     summary: Authorize a user action on a resource
 *     description: Can be used to check token and previlages.
 *     tags: [4th]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/requests/Authorization'
 *     responses:
 *       200:
 *         description: Authorized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       example: 2
 *                     username:
 *                       type: string
 *                       example: "username2"
 *                     email:
 *                       type: string
 *                       example: "username2@example.com"
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: string
 *                         example: "enduser"
 *                       domain:
 *                         type: string
 *                         example: "0"
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/ApiRateLimitExceeded' 
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.post('/authorize',
    authorizationApiRequestLimiter,
    validateAuthorizationRequest,
    authenticateUser,
    authorize,
    async (req, res) => {
        try {
            const roles = await listRolesForUserInDomains(req.user.username);
            const conditions = getData();
            res.json({ user: req.user, roles, conditions });
        } catch (err) {
            updateEventLog(req, { error: 'An error occurred in /authorize request.', details: err });
            return res.status(500).json({ message: err.message });
        }
    }
);
