require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`
});
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database'); // Your database connection logic

const app = express();
app.use(express.json()); // Middleware for parsing JSON

// Import routes
const authRoutes = require('./routes/authRoutes');

// Use routes
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
