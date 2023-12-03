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
