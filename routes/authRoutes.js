const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database');

const router = express.Router();

// Import controllers if you have them
// const authController = require('../controllers/authController');

// Registration logic here
router.post('/register', async (req, res) => {
  
  try {
        const { username, email, password } = req.body;

        // Validate the input

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert the user into the database
        const newUser = { username, email, passwordHash };
        // The insertUser function is hypothetical. Replace it with your actual database logic.
        const result = await db.insertUser(newUser);

        // Send success response
        res.status(201).json({ message: "User registered successfully", userId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
});

// Login logic here
router.post('/login', (req, res) => {

});



module.exports = router;
