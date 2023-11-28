require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});
const localhost = 'http://localhost:3000';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const basicAuth = require('express-basic-auth');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// This will enable CORS for all routes
const allowedOrigins = [process.env.BASE_URL || localhost, 'https://myreportapp.com'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Basic Helmet usage
app.use(helmet());
// Content Security Policy (CSP)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);
// X-Content-Type-Options
app.use(helmet.noSniff());
// X-Frame-Options
app.use(helmet.frameguard({ action: 'deny' }));


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
      url: process.env.BASE_URL || localhost,
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

if (typeof process.env.DOC_USER === 'undefined' || typeof process.env.DOC_PASS === 'undefined') {
  console.error('Environment variable DOC_USER or DOC_PASS is not defined.');
  // Handle the error appropriately, e.g., exit the process or throw an error
  process.exit(1); // Exits the application with an error code
}

// Basic auth credentials for accessing Swaggar
const users = {};
users[process.env.DOC_USER] = process.env.DOC_PASS;

// Use swaggerUi to serve swagger docs
app.use('/api-docs', basicAuth({
  users: users,
  challenge: true // Causes browsers to show a login dialog
}), swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// configure Express to serve static files 
app.use(express.static('public'));

// Catch-all route for undefined routes
app.get('*', (req, res) => {
  res.status(404).sendFile('public/error.html', { root: __dirname });
});

// running the server 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});