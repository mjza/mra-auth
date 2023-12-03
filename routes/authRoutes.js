const express = require('express');
const router = express.Router();

const registerRoute = require('./registerRoute');
const activateRoute = require('./activateRoute');
const loginRoute = require('./loginRoute');

router.use(registerRoute);
router.use(activateRoute);
router.use(loginRoute);

module.exports = router;
