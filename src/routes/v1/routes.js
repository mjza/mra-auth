const express = require('express');
const router = express.Router();

const { auditLogMiddleware } = require('./auditLogMiddleware');
const registerRoute = require('./registerRoute');
const activateRoute = require('./activateRoute');
const sessionRoutes = require('./sessionRoutes');
const userDetailsRoutes = require('./userDetailsRoutes');
const usernamesRoute = require('./usernamesRoute');
const passwordRoutes = require('./passwordRoutes');
const authorizationRoute = require('./authorizationRoute');
const roleRoute = require('./roleRoute');

//To automatically apply the auditLogMiddleware to all routes, We must place the middleware function before any route definitions
router.use(auditLogMiddleware);

router.use(registerRoute);
router.use(activateRoute);
router.use(sessionRoutes);
router.use(userDetailsRoutes);
router.use(usernamesRoute);
router.use(passwordRoutes);
router.use(authorizationRoute);
router.use(roleRoute);

module.exports = router;

/**
 * @swagger
 * components:
 *   responses:
 *     ServerInternalError:
 *       description: Internal server error.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: different exception messages in server processing.
 *     Forbidden:
 *       description: Forbidden
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: User is not authorized.
 *               details:
 *                 type: string
 *                 example: Customer users must set condition to 'check_relationship'.
 *             required:
 *               - message
 */