const express = require('express');
const router = express.Router();

const registerRoute = require('./registerRoute');
const activateRoute = require('./activateRoute');

router.use(registerRoute);
router.use(activateRoute);

module.exports = router;
