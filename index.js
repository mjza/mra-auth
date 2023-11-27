require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`
});

const express = require('express');
const basicAuth = require('express-basic-auth');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
// Use routes
app.use('/', authRoutes);

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express Auth API',
    version: '1.0.0',
    description: 'A simple CRUD Auth API application',
  },
  servers: [
    {
      url: process.env.BASE_URL || 'http://localhost:3000',
      description: 'Development server',
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Paths to files containing Swagger annotations
  apis: ['./routes/*.js'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

// Basic auth credentials for accessing Swaggar
const users = {
  'admin': 'mjzA626$'
};

// Use swaggerUi to serve swagger docs
app.use('/api-docs', basicAuth({
  users: users,
  challenge: true // Causes browsers to show a login dialog
}), swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
