const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { updateEventLog } = require('../../utils/logger');
const { apiRequestLimiter } = require('../../utils/rateLimit');
const { authenticateUser, authorizeUser } = require('../../utils/validations');
const { listRolesForUserInDomain, listRolesForUserInDomains, getUserType, addRoleForUserInDomain, removeRoleForUserInDomain } = require('../../casbin/casbinSingleton');

const router = express.Router();

/**
 * @swagger
 * /v1/roles:
 *   get:
 *     summary: Retrieve roles for a given username or the current user
 *     description: Get the roles for a given username or the current user in a specific domain.
 *     tags: [8th]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         required: false
 *         schema:
 *           type: string
 *           example: "username1"
 *         description: Mandatory username to retrieve its roles.
 *       - in: query
 *         name: domain
 *         required: false
 *         schema:
 *           type: integer
 *           example: "0"
 *         description: Optional domain number. Use domain 0 if not provided.
 *     responses:
 *       200:
 *         description: User's roles retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   role:
 *                     type: string
 *                     example: "enduser"
 *                   domain:
 *                     type: string
 *                     example: "0"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       404:
 *         description: User role not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User role not found.
 *       429:
 *         $ref: '#/components/responses/ApiRateLimitExceeded'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.get('/roles', apiRequestLimiter,
    [
        query('username')
            .optional({ checkFalsy: true })
            .isString().withMessage('If you provide username, it must be a string.')
            .isLength({ min: 5, max: 30 }).withMessage('Username must be between 5 and 30 characters.')
            .matches(/^[A-Za-z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),

        query('domain')
            .optional({ checkFalsy: true })
            .isNumeric().withMessage('Domain must be a number.')
            .default('0'),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    authenticateUser,
    (req, res, next) => {
        const username = req.query && req.query.username ? req.query.username : req.user.username;
        const domain = req.query && req.query.domain ? req.query.domain : '0';
        const middleware = authorizeUser({
            dom: domain,
            obj: 'casbin_rule',
            act: 'R',
            attrs: {
                where: {
                    username,
                    domain
                }
            }
        });
        middleware(req, res, next);
    },
    async (req, res) => {
        try {

            const userRolesArray = await listRolesForUserInDomain(req.conditions.where.username, req.conditions.where.domain);

            if (!userRolesArray || userRolesArray.length === 0) {
                return res.status(404).json({ message: 'User role not found' });
            }

            const userRolesDomainArray = userRolesArray.map((role) => {
                return { role, domain: req.conditions.where.domain };
            });

            return res.json(userRolesDomainArray);
        } catch (err) {
            updateEventLog(req, err);
            return res.status(500).json({ message: err.message });
        }
    });


/**
 * @swagger
 * /v1/user-role:
 *   post:
 *     summary: Assign a role to a specific user in a domain
 *     description: This endpoint assigns a new role to the specified user in the given domain. If the domain is not provided, a default value is used. The username is optional and, if not provided, the current user is assumed.
 *     tags: [8th]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 30
 *                 pattern: '^[A-Za-z0-9_]+$'
 *                 description: "Username of the user to whom the role is to be assigned. Optional. If not provided, assumes the role is for the current user."
 *                 example: "john_doe"
 *               role:
 *                 type: string
 *                 description: "The role to be assigned to the user."
 *                 maxLength: 255
 *                 example: "admin"
 *               domain:
 *                 type: string
 *                 description: "The domain in which to assign the role. Optional. If not provided, defaults to '0'."
 *                 example: "1"
 *             required:
 *               - role
 *     responses:
 *       201:
 *         description: Role has been added successfully. User must re-login to have the new role.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Role has been added successfully. User must re-login to have the new role."
 *       400:
 *         description: Validation error. One or more fields are missing or incorrectly formatted.
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
 *                       param:
 *                         type: string
 *                       location:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.post('/user-role', apiRequestLimiter,
    [
        body('username')
            .optional({ checkFalsy: true })
            .isString().withMessage('If you provide username, it must be a string.')
            .isLength({ min: 5, max: 30 }).withMessage('Username must be between 5 and 30 characters.')
            .matches(/^[A-Za-z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),
        body('role')
            .exists()
            .withMessage('Role is required.')
            .isString().withMessage('Role must be a string.')
            .isLength({ max: 255 }).withMessage('Role must not exceed 255 characters.'),
        body('domain')
            .optional({ checkFalsy: true })
            .isNumeric().withMessage('Domain must be a number.')
            .default('0'),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    authenticateUser,
    async (req, res, next) => {
        const roles = await listRolesForUserInDomains(req.user.username);
        const type = getUserType(roles);
        const domain = (type === 'internal' ? '0' : req.body.domain);
        const middleware = authorizeUser({
            dom: domain,
            obj: 'casbin_rule',
            act: 'C',
            attrs: { set: { role: req.body.role } }
        });
        middleware(req, res, next);
    },
    async (req, res) => {
        try {
            const { username, role, domain } = req.body;
            await addRoleForUserInDomain(username, role, domain);
            updateEventLog(req, { success: `Added role ${role} in domain ${domain} for the user ${username}.` });
            return res.status(201).json({ message: 'Role has been added successfully. User must relogin to have the new role.' });
        } catch (err) {
            updateEventLog(req, err);
            return res.status(500).json({ message: err.message });
        }
    }
);

/**
 * @swagger
 * /v1/user-role:
 *   delete:
 *     summary: Remove a role from a specific user in a domain
 *     description: This endpoint removes an existing role from the specified user in the given domain. If the domain is not provided, a default value is used. The username is optional and, if not provided, the current user is assumed.
 *     tags: [8th]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 30
 *                 pattern: '^[A-Za-z0-9_]+$'
 *                 description: "Username of the user from whom the role is to be removed. Optional. If not provided, assumes the role is for the current user."
 *                 example: "john_doe"
 *               role:
 *                 type: string
 *                 description: "The role to be removed from the user."
 *                 maxLength: 255
 *                 example: "admin"
 *               domain:
 *                 type: string
 *                 description: "The domain from which to remove the role. Optional. If not provided, defaults to '0'."
 *                 example: "1"
 *             required:
 *               - role
 *     responses:
 *       200:
 *         description: Role has been removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Role has been removed successfully."
 *       400:
 *         description: Validation error. One or more fields are missing or incorrectly formatted.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.delete('/user-role', apiRequestLimiter,
    [
        body('username')
            .optional({ checkFalsy: true })
            .isString().withMessage('If you provide username, it must be a string.')
            .isLength({ min: 5, max: 30 }).withMessage('Username must be between 5 and 30 characters.')
            .matches(/^[A-Za-z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),
        body('role')
            .exists()
            .withMessage('Role is required.')
            .isString().withMessage('Role must be a string.')
            .isLength({ max: 255 }).withMessage('Role must not exceed 255 characters.'),
        body('domain')
            .optional({ checkFalsy: true })
            .isNumeric().withMessage('Domain must be a number.')
            .default('0'),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    authenticateUser,
    async (req, res, next) => {
        const roles = await listRolesForUserInDomains(req.user.username);
        const type = getUserType(roles);
        const domain = (type === 'internal' ? '0' : req.body.domain);
        const middleware = authorizeUser({
            dom: domain,
            obj: 'casbin_rule',
            act: 'D',
            attrs: { set: { role: req.body.role } }
        });
        middleware(req, res, next);
    },
    async (req, res) => {
        try {
            const { username, role, domain } = req.body;
            await removeRoleForUserInDomain(username, role, domain);
            updateEventLog(req, { success: `Removed role ${role} in domain ${domain} for the user ${username}.` });
            return res.status(200).json({ message: 'Role has been removed successfully.' });
        } catch (err) {
            updateEventLog(req, err);
            return res.status(500).json({ message: err.message });
        }
    }
);


module.exports = router;