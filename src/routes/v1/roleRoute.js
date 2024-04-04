const express = require('express');
const { query, validationResult } = require('express-validator');
const { updateEventLog } = require('../../utils/logger');
const { apiRequestLimiter } = require('../../utils/rateLimit');
const { authenticateUser, authorizeUser } = require('../../utils/validations');
const { listRolesForUserInDomain } = require('../../casbin/casbinSingleton');

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
            .isString().withMessage('If you provide username it must be a string.')
            .isLength({ max: 255 }).withMessage('Username must not exceed 255 characters.'),

        query('domain')
            .optional({ checkFalsy: true })
            .isNumeric().withMessage('Domain must be a number.'),
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







module.exports = router;