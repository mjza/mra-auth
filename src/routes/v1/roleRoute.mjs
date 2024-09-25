import { Router } from 'express';
import { body, query } from 'express-validator';
import { updateEventLog } from '../../utils/logger.mjs';
import { apiRequestLimiter } from '../../utils/rateLimit.mjs';
import { authenticateUser, authorizeUser, checkRequestValidity } from '../../utils/validations.mjs';
import { listRolesForUserInDomain, listRolesForUserInDomains, getUserType, addRoleForUserInDomain, removeRoleForUserInDomain, addPolicyInDomain, getPoliciesInDomain, getRolesInDomain, getUsersForRoleInDomain, removePoliciesInDomain } from '../../casbin/casbinSingleton.mjs';

const router = Router();
export default router;

/**
 * @swagger
 * /v1/domain-roles:
 *   get:
 *     summary: Retrieve roles for a given domain
 *     description: Get the roles for a given domain.
 *     tags: [7th]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         required: false
 *         schema:
 *           type: string
 *           example: "admin"
 *         description: Optional role for checking its existance.
 *       - in: query
 *         name: domain
 *         required: false
 *         schema:
 *           type: integer
 *           example: "0"
 *         description: Optional domain number.
 *     responses:
 *       200:
 *         description: Domain's roles retrieved successfully.
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
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/ApiRateLimitExceeded'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.get('/domain-roles', apiRequestLimiter,
    [
        query('role')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isString()
            .withMessage((_, { req }) => req.t('If you provide the role, it must be a string.')),

        query('domain')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isString()
            .withMessage((_, { req }) => req.t('Domain must be a string.'))
            .bail()
            .custom((value, { req }) => {
                // Check if the value is numeric in string form
                if (!/^\d+$/.test(value)) {
                    throw new Error(req.t('Domain must be a string containing digits.'));
                }
                return true; // Passes validation
            })
    ],
    checkRequestValidity,
    authenticateUser,
    async (req, res, next) => {
        const roles = await listRolesForUserInDomains(req.user.username);
        const type = getUserType(roles);
        const domain = (type === 'internal' ? '0' : (req.query.domain ? req.query.domain : '0'));
        const middleware = authorizeUser({
            dom: domain,
            obj: 'mra_authorization',
            act: 'R',
            attrs: {
                where: {
                    role: req.query.role,
                    domain: req.query.domain
                }
            }
        });
        middleware(req, res, next);
    },
    async (req, res) => {
        try {
            const rolesDomainArray = await getRolesInDomain(req.conditions.where.role, req.conditions.where.domain);
            return res.json(rolesDomainArray);
        } catch (err) {
            updateEventLog(req, { error: 'Error in retrieving roles for the current user in all domains.', details: err });
            return res.status(500).json({ message: err.message });
        }
    }
);

/**
* @swagger
* /v1/my-roles:
*   get:
*     summary: Retrieve roles for the current user
*     description: Get the roles forthe current user in all domains.
*     tags: [7th]
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: domain
*         required: false
*         schema:
*           type: integer
*         description: Optional domain number.
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
*       429:
*         $ref: '#/components/responses/ApiRateLimitExceeded'
*       500:
*         $ref: '#/components/responses/ServerInternalError'
*/
router.get('/my-roles', apiRequestLimiter,
    [
        query('domain')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isString()
            .withMessage((_, { req }) => req.t('Domain must be a string.'))
            .bail()
            .custom((value, { req }) => {
                // Check if the value is numeric in string form
                if (!/^\d+$/.test(value)) {
                    throw new Error(req.t('Domain must be a string containing digits.'));
                }
                return true; // Passes validation
            })
            .default('0'),
    ],
    checkRequestValidity,
    authenticateUser,
    async (req, res) => {
        try {
            const username = req.user.username;
            const domain = req.query.domain;
            let userRolesArray;
            if (!domain) {
                userRolesArray = await listRolesForUserInDomains(username);
            } else {
                userRolesArray = await listRolesForUserInDomain(username, domain);
            }

            return res.json(userRolesArray);
        } catch (err) {
            updateEventLog(req, { error: 'Error in retrieving roles for current user.', details: err });
            return res.status(500).json({ message: err.message });
        }
    }
);

/**
* @swagger
* /v1/user-roles:
*   get:
*     summary: Retrieve roles for a given username or the current user
*     description: Get the roles for a given username or the current user in a specific domain.
*     tags: [7th]
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: query
*         name: username
*         required: false
*         schema:
*           type: string
*           example: "username1"
*         description: Optional username to retrieve its roles.
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
*       403:
*         $ref: '#/components/responses/Forbidden'
*       429:
*         $ref: '#/components/responses/ApiRateLimitExceeded'
*       500:
*         $ref: '#/components/responses/ServerInternalError'
*/
router.get('/user-roles', apiRequestLimiter,
    [
        query('username')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isString()
            .withMessage((_, { req }) => req.t('If you provide a username, it must be a string.'))
            .bail()
            .isLength({ min: 5, max: 30 })
            .withMessage((_, { req }) => req.t('Username must be between 5 and 30 characters.'))
            .matches(/^[A-Za-z0-9_]+$/)
            .withMessage((_, { req }) => req.t('Username can only contain letters, numbers, and underscores.'))
            .toLowerCase(),

        query('domain')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isString()
            .withMessage((_, { req }) => req.t('Domain must be a string.'))
            .bail()
            .custom((value, { req }) => {
                // Check if the value is numeric in string form
                if (!/^\d+$/.test(value)) {
                    throw new Error(req.t('Domain must be a string containing digits.'));
                }
                return true; // Passes validation
            })
            .default('0'),
    ],
    checkRequestValidity,
    authenticateUser,
    (req, res, next) => {
        const username = req.query.username ? req.query.username : req.user.username;
        const domain = req.query.domain ? req.query.domain : '0';
        const middleware = authorizeUser({
            dom: domain,
            obj: 'mra_authorization',
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

            return res.json(userRolesArray);
        } catch (err) {
            updateEventLog(req, { error: 'Error in retrieving roles for a given user.', details: err });
            return res.status(500).json({ message: err.message });
        }
    }
);

/**
 * @swagger
 * /v1/user-role:
 *   post:
 *     summary: Assign a role to a specific user in a domain
 *     description: This endpoint assigns a new role to the specified user in the given domain. If the domain is not provided, a default value is used. The username is optional and, if not provided, the current user is assumed.
 *     tags: [7th]
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
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: The role does not exist in the domain.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: The role does not exist in the domain.
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.post('/user-role', apiRequestLimiter,
    [
        body('username')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isString()
            .withMessage((_, { req }) => req.t('If you provide a username, it must be a string.'))
            .bail()
            .isLength({ min: 5, max: 30 })
            .withMessage((_, { req }) => req.t('Username must be between 5 and 30 characters.'))
            .matches(/^[A-Za-z0-9_]+$/)
            .withMessage((_, { req }) => req.t('Username can only contain letters, numbers, and underscores.'))
            .toLowerCase(),

        body('role')
            .exists()
            .withMessage((_, { req }) => req.t('Role is required.'))
            .bail()
            .isString()
            .withMessage((_, { req }) => req.t('Role must be a string.'))
            .bail()
            .isLength({ max: 255 })
            .withMessage((_, { req }) => req.t('Role must not exceed 255 characters.')),

        body('domain')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .default('0')
            .isString()
            .withMessage((_, { req }) => req.t('Domain must be a string.'))
            .bail()
            .custom((value, { req }) => {
                // Check if the value is numeric in string form
                if (!/^\d+$/.test(value)) {
                    throw new Error(req.t('Domain must be a string containing digits.'));
                }
                return true; // Passes validation
            }),
    ],
    checkRequestValidity,
    authenticateUser,
    async (req, res, next) => {
        const roles = await listRolesForUserInDomains(req.user.username);
        const type = getUserType(roles);
        const domain = (type === 'internal' ? '0' : req.body.domain);
        const middleware = authorizeUser({
            dom: domain,
            obj: 'mra_authorization',
            act: 'C'
        });
        middleware(req, res, next);
    },
    async (req, res) => {
        try {
            const { username, role, domain } = req.body;
            const policies = await getRolesInDomain(role, domain);
            if (!policies || policies.length === 0) {
                return res.status(404).json({ message: 'The role does not exist in the domain.' });
            }
            await addRoleForUserInDomain(username, role, domain);
            updateEventLog(req, { success: `Added role ${role} in domain ${domain} for the user ${username}.` });
            return res.status(201).json({ message: 'Role has been added successfully. User must relogin to have the new role.' });
        } catch (err) {
            updateEventLog(req, { error: 'Error in assigning roles for a ghiven user.', details: err });
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
 *     tags: [7th]
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
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.delete('/user-role', apiRequestLimiter,
    [
        body('username')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isString()
            .withMessage((_, { req }) => req.t('If you provide a username, it must be a string.'))
            .bail()
            .isLength({ min: 5, max: 30 })
            .withMessage((_, { req }) => req.t('Username must be between 5 and 30 characters.'))
            .matches(/^[A-Za-z0-9_]+$/)
            .withMessage((_, { req }) => req.t('Username can only contain letters, numbers, and underscores.'))
            .toLowerCase(),

        body('role')
            .exists()
            .withMessage((_, { req }) => req.t('Role is required.'))
            .bail()
            .isString()
            .withMessage((_, { req }) => req.t('Role must be a string.'))
            .bail()
            .isLength({ max: 255 })
            .withMessage((_, { req }) => req.t('Role must not exceed 255 characters.')),

        body('domain')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .default('0')
            .isString()
            .withMessage((_, { req }) => req.t('Domain must be a string.'))
            .bail()
            .custom((value, { req }) => {
                // Check if the value is numeric in string form
                if (!/^\d+$/.test(value)) {
                    throw new Error(req.t('Domain must be a string containing digits.'));
                }
                return true; // Passes validation
            }),
    ],
    checkRequestValidity,
    authenticateUser,
    async (req, res, next) => {
        const roles = await listRolesForUserInDomains(req.user.username);
        const type = getUserType(roles);
        const domain = (type === 'internal' ? '0' : req.body.domain);
        const middleware = authorizeUser({
            dom: domain,
            obj: 'mra_authorization',
            act: 'D',
            attrs: {
                where: {
                    username: req.body.username ?? req.user.username
                }
            }
        });
        middleware(req, res, next);
    },
    async (req, res) => {
        try {
            const { role, domain } = req.body;
            const { username } = req.conditions.where;
            await removeRoleForUserInDomain(username, role, domain);
            updateEventLog(req, { success: `Removed role ${role} in domain ${domain} for the user ${username}.` });
            return res.status(200).json({ message: req.t('Role has been removed successfully.') });
        } catch (err) {
            updateEventLog(req, { error: 'Error in deleting roles for a ghiven user.', details: err });
            return res.status(500).json({ message: err.message });
        }
    }
);

/**
 * @swagger
 * /v1/policies:
 *   post:
 *     summary: Retrieve policies
 *     description: This endpoint retrieves policies based on the given parameters within the request body. `subject` and `domain` are mandatory, while other parameters are optional and used to filter the retrieved policies. Using POST method for search operation to accommodate complex query structures.
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
 *               subject:
 *                 type: string
 *                 description: "Subject - The role name or username this policy applies to."
 *                 example: "username1"
 *               domain:
 *                 type: string
 *                 description: "Domain - the scope (i.e., customer ID) within which this policy is applicable."
 *                 example: "1"
 *               object:
 *                 type: string
 *                 description: "Object - the resource (i.e., table name) this policy pertains to."
 *                 example: ""
 *               action:
 *                 type: string
 *                 description: "Action - the action allowed or denied by this policy."
 *                 enum: [C, R, U, D, GC, GR, GU, GD, '']
 *                 example: ""
 *               condition:
 *                 type: string
 *                 description: "Condition - any additional conditions for this policy."
 *                 enum: [check_relationship, check_ownership, none, '']
 *                 example: ""
 *               attributes:
 *                 type: object
 *                 additionalProperties: true
 *                 description: "Attributes - additional data related to the policy."
 *                 example: null
 *               effect:
 *                 type: string
 *                 description: "Effect - whether the action is allowed or denied."
 *                 enum: [allow, deny, '']
 *                 example: "allow"
 *             required:
 *               - subject
 *               - domain
 *     responses:
 *       200:
 *         description: Successfully retrieved policies.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   subject:
 *                     type: string
 *                   domain:
 *                     type: string
 *                   object:
 *                     type: string
 *                   action:
 *                     type: string
 *                   condition:
 *                     type: string
 *                   attributes:
 *                     type: object
 *                     additionalProperties: true
 *                   effect:
 *                     type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.post('/policies',
    [
        body('subject')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isString()
            .withMessage((_, { req }) => req.t('Subject is optional and can be string or null.')),

        body('domain')
            .exists()
            .withMessage((_, { req }) => req.t('Domain is required.'))
            .bail()
            .isString()
            .withMessage((_, { req }) => req.t('Domain must be a string.'))
            .bail()
            .custom((value, { req }) => {
                // Check if the value is numeric in string form
                if (!/^\d+$/.test(value)) {
                    throw new Error(req.t('Domain must be a string containing digits.'));
                }
                return true; // Passes validation
            }),

        body('object')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isString()
            .withMessage((_, { req }) => req.t('Object can be string or null.')),

        body('action')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isIn(['C', 'R', 'U', 'D', 'GC', 'GR', 'GU', 'GD', '', null])
            .withMessage((_, { req }) => req.t("Action is optional and can be 'C', 'R', 'U', 'D', 'GC', 'GR', 'GU', 'GD', empty string or null.")),

        body('effect')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isIn(['allow', 'deny', '', null])
            .withMessage((_, { req }) => req.t("Effect is optional and can be 'allow', 'deny', empty string or null.")),

        body('condition')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isIn(['check_relationship', 'check_ownership', 'none', '', null])
            .withMessage((_, { req }) => req.t("Condition is optional and can be one of 'check_relationship', 'check_ownership', 'none', empty string or null.")),

        body('attributes')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .custom((value, { req }) => {
                if (typeof value === 'object') {
                    return true; // Directly pass through objects without attempting to parse
                }
                try {
                    if (typeof value === 'string') {
                        JSON.parse(value);
                    }
                } catch (e) {
                    throw new Error(req.t('Attributes must be a valid JSON object.'));
                }
                return true;
            }),
    ],
    checkRequestValidity,
    authenticateUser,
    async (req, res, next) => {
        const roles = await listRolesForUserInDomains(req.user.username);
        const type = getUserType(roles);
        req.user.type = type;
        const domain = (type === 'internal' ? '0' : req.body.domain);
        const middleware = authorizeUser({
            dom: domain,
            obj: 'mra_authorization',
            act: 'R'
        });
        middleware(req, res, next);
    },
    async (req, res) => {
        try {
            const { subject, domain, object, action, condition, attributes, effect } = req.body;

            const policies = await getPoliciesInDomain(subject, domain, object, action, condition, attributes, effect);

            return res.status(200).json(policies);
        } catch (err) {
            updateEventLog(req, { error: 'Error in retrieving policies while it is a POST request.', details: err });
            return res.status(500).json({ message: req.t('Failed to retrieve policies due to an internal error.') });
        }
    }
);

/**
 * @swagger
 * /v1/policy:
 *   post:
 *     summary: Add a new policy
 *     description: This endpoint adds a new policy with the given parameters. It is intended to allow fine-grained access control policies to be defined.
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
 *               subject:
 *                 type: string
 *                 description: "Subject - The role name or username this policy applies to."
 *                 example: "username1"
 *               domain:
 *                 type: string
 *                 description: "Domain - the scope (i.e., customer ID) within which this policy is applicable."
 *                 example: "1"
 *               object:
 *                 type: string
 *                 description: "Object - the resource (i.e., table name) this policy pertains to."
 *                 example: "mra_tickets"
 *               action:
 *                 type: string
 *                 description: "Action - the action allowed or denied by this policy."
 *                 enum: [C, R, U, D, GC, GR, GU, GD]
 *                 example: "C"
 *               condition:
 *                 type: string
 *                 description: "Condition - any additional conditions for this policy."
 *                 enum: [check_relationship, check_ownership, none]
 *                 example: "none"
 *               attributes:
 *                 type: object
 *                 additionalProperties: true
 *                 description: "Attributes - additional data related to the policy."
 *                 example: { "attr1": "value1", "attr2": 3 }
 *               effect:
 *                 type: string
 *                 description: "Effect - whether the action is allowed or denied."
 *                 enum: [allow, deny]
 *                 example: "allow"
 *             required:
 *               - subject
 *               - domain
 *               - object
 *               - action
 *               - effect
 *     responses:
 *       200:
 *         description: Policy has been added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Policy added successfully."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.post('/policy',
    [

        body('subject')
            .exists()
            .withMessage((_, { req }) => req.t('Subject is required.'))
            .bail()
            .isString()
            .withMessage((_, { req }) => req.t('Subject must be a string.')),

        body('domain')
            .exists()
            .withMessage((_, { req }) => req.t('Domain is required.'))
            .bail()
            .isString()
            .withMessage((_, { req }) => req.t('Domain must be a string.'))
            .bail()
            .custom((value, { req }) => {
                // Check if the value is numeric in string form
                if (!/^\d+$/.test(value)) {
                    throw new Error(req.t('Domain must be a string containing digits.'));
                }
                return true; // Passes validation
            }),

        body('object')
            .exists()
            .withMessage((_, { req }) => req.t('Object is required.'))
            .bail()
            .isString()
            .withMessage((_, { req }) => req.t('Object must be a string.')),

        body('action')
            .exists()
            .withMessage((_, { req }) => req.t('Action is required.'))
            .bail()
            .isIn(['C', 'R', 'U', 'D', 'GC', 'GR', 'GU', 'GD'])
            .withMessage((_, { req }) => req.t('Action must be one of the [C, R, U, D, GC, GR, GU, GD].')),

        body('effect')
            .exists()
            .withMessage((_, { req }) => req.t('Effect is required.'))
            .bail()
            .isIn(['allow', 'deny']).withMessage((_, { req }) => req.t('Effect must be either "allow" or "deny".')),

        body('condition')
            .optional({ nullable: true, checkFalsy: false })
            .default('none')
            .isIn(['check_relationship', 'check_ownership', 'none'])
            .withMessage((_, { req }) => req.t('Condition must be one of "check_relationship", "check_ownership", or "none".')),

        body('attributes')
            .optional({ nullable: true, checkFalsy: false })
            .custom((value, { req }) => {
                if (typeof value === 'object') {
                    return true; // Directly pass through objects without attempting to parse
                }
                try {
                    if (typeof value === 'string') {
                        JSON.parse(value);
                    }
                } catch (e) {
                    throw new Error(req.t('Attributes must be a valid JSON object.'));
                }
                return true;
            }),

    ],
    checkRequestValidity,
    authenticateUser,
    async (req, res, next) => {
        const roles = await listRolesForUserInDomains(req.user.username);
        const type = getUserType(roles);
        req.user.type = type;
        const domain = (type === 'internal' ? '0' : req.body.domain);
        const middleware = authorizeUser({
            dom: domain,
            obj: 'mra_authorization',
            act: 'C'
        });
        middleware(req, res, next);
    },
    async (req, res, next) => {
        const type = req.user.type;
        if (type === 'internal') {
            next();
        } else {
            if (req.body.condition !== 'check_relationship') {
                updateEventLog(req, { message: 'User is not authorized.', details: "Customer users must set condition to 'check_relationship'." });
                return res.status(403).json({ message: req.t('User is not authorized.'), details: req.t("Customer users must set condition to 'check_relationship'.") });
            }
            // Customer users must have grant permission to be able to create a policy
            let action = req.body.action;
            if (['C', 'R', 'U', 'D'].includes(action)) {
                action = `G${action}`;
            }
            const domain = (type === 'internal' ? '0' : req.body.domain);
            const middleware = authorizeUser({
                dom: domain,
                obj: req.body.object,
                act: action
            });
            middleware(req, res, next);
        }
    },
    async (req, res) => {
        try {
            const { subject, domain, object, action, condition, attributes, effect } = req.body;
            await addPolicyInDomain(subject, domain, object, action, condition, attributes, effect);
            return res.status(200).json({ message: req.t('Policy added successfully.') });
        } catch (err) {
            updateEventLog(req, { error: 'Error in creating a policy.', details: err });
            return res.status(500).json({ message: req.t('Failed to add policy due to an internal error.') });
        }
    }
);

/**
 * @swagger
 * /v1/policies:
 *   delete:
 *     summary: Delete policies
 *     description: This endpoint deletes policies based on the given parameters within the request body. `subject` and `domain` are mandatory, while other parameters are optional and used to specify the policies to be deleted.
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
 *               subject:
 *                 type: string
 *                 description: "Subject - The role name or username the policy applies to."
 *                 example: "username1"
 *               domain:
 *                 type: string
 *                 description: "Domain - the scope (i.e., customer ID) within which this policy is applicable."
 *                 example: "1"
 *               object:
 *                 type: string
 *                 description: "Object - the resource (i.e., table name) this policy pertains to."
 *                 example: ""
 *               action:
 *                 type: string
 *                 description: "Action - the action allowed or denied by this policy."
 *                 enum: [C, R, U, D, GC, GR, GU, GD, '', null]
 *                 example: ""
 *               condition:
 *                 type: string
 *                 description: "Condition - any additional conditions for this policy."
 *                 enum: [check_relationship, check_ownership, none, '', null]
 *                 example: ""
 *               attributes:
 *                 type: object
 *                 additionalProperties: true
 *                 description: "Attributes - additional data related to the policy."
 *                 example: null
 *               effect:
 *                 type: string
 *                 description: "Effect - whether the action is allowed or denied."
 *                 enum: [allow, deny, '', null]
 *                 example: ""
 *             required:
 *               - subject
 *               - domain
 *     responses:
 *       200:
 *         description: Deleted policies process was successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                   example: true
 *                   description: True if deleted successfuly, false otherwise.
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedAccessInvalidTokenProvided'
 *       500:
 *         $ref: '#/components/responses/ServerInternalError'
 */
router.delete('/policies',
    [
        body('subject')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isString()
            .withMessage((_, { req }) => req.t('Subject is optional and can be string or null.')),

        body('domain')
            .exists()
            .withMessage((_, { req }) => req.t('Domain is required.'))
            .bail()
            .isString()
            .withMessage((_, { req }) => req.t('Domain must be a string.'))
            .bail()
            .custom((value, { req }) => {
                // Check if the value is numeric in string form
                if (!/^\d+$/.test(value)) {
                    throw new Error(req.t('Domain must be a string containing digits.'));
                }
                return true; // Passes validation
            }),

        body('object')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isString()
            .withMessage((_, { req }) => req.t('Object can be string or null.')),

        body('action')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isIn(['C', 'R', 'U', 'D', 'GC', 'GR', 'GU', 'GD', '', null])
            .withMessage((_, { req }) => req.t('Action is optional, but can be null, empty string or one of the [C, R, U, D, GC, GR, GU, GD].')),

        body('effect')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isIn(['allow', 'deny', '', null])
            .withMessage((_, { req }) => req.t('Effect is optional, but can be null, empty string or one of the [allow, deny].')),

        body('condition')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .isIn(['check_relationship', 'check_ownership', 'none', '', null])
            .withMessage((_, { req }) => req.t('Condition is optional, but can be null, empty string or one of the [check_relationship, check_ownership].')),

        body('attributes')
            .optional({ nullable: true, checkFalsy: false }) // if a field is present but has a value considered falsy (like null, "", 0, false, or NaN), it will still be passed for validation except null.
            .custom((value, { req }) => {
                if (typeof value === 'object') {
                    return true; // Directly pass through objects without attempting to parse
                }
                try {
                    if (typeof value === 'string') {
                        JSON.parse(value);
                    }
                } catch (e) {
                    throw new Error(req.t('Attributes must be a valid JSON object.'));
                }
                return true;
            }),
    ],
    checkRequestValidity,
    authenticateUser,
    async (req, res, next) => {
        const roles = await listRolesForUserInDomains(req.user.username);
        const type = getUserType(roles);
        req.user.type = type;
        const domain = (type === 'internal' ? '0' : req.body.domain);
        const middleware = authorizeUser({
            dom: domain,
            obj: 'mra_authorization',
            act: 'D'
        });
        middleware(req, res, next);
    },
    async (req, res) => {
        try {
            const { subject, domain, object, action, condition, attributes, effect } = req.body;
            const users = await getUsersForRoleInDomain(subject, domain);

            if (users && users.length > 0) {
                return res.status(404).json({ message: req.t('Some users are using this policy and cannot be changed or removed.') });
            }

            const result = await removePoliciesInDomain(subject, domain, object, action, condition, attributes, effect);

            return res.status(200).json({ result });
        } catch (err) {
            updateEventLog(req, { error: 'Error in deleting a policy.', details: err });
            return res.status(500).json({ message: req.t('Failed to delete policies due to an internal error.') });
        }
    }
);
