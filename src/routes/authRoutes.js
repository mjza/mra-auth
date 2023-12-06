const express = require('express');
const router = express.Router();

const registerRoute = require('./registerRoute');
const activateRoute = require('./activateRoute');
const loginRoute = require('./loginRoute');
const userDetailsRoutes = require('./userDetailsRoutes');

router.use(registerRoute);
router.use(activateRoute);
router.use(loginRoute);
router.use(userDetailsRoutes);

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
 */