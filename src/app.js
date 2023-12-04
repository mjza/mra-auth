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
app.use(helmet()); // It sets up Helmet with its default configuration. Helmet, by default, includes a set of middlewares that set HTTP headers for basic security protections. 

// Content Security Policy (CSP), which helps prevent attacks like Cross-Site Scripting (XSS) and data injection.
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"], // It  restricts all content sources to the same origin by default. This means that by default, your page can only load content (like scripts, images, CSS, etc.) from its own origin.
            scriptSrc: ["'self'"],  // It specifies where scripts can be loaded from. Here, it allows scripts from the same origin.
            objectSrc: ["'none'"],  // It prevents the page from loading plugins (like Flash, Java applets).
            upgradeInsecureRequests: [], // It will upgrade all HTTP requests to HTTPS in browsers that support this directive.
        },
    })
);
// X-Content-Type-Options
app.use(helmet.noSniff()); // It prevents browsers from trying to guess (“sniff”) the MIME type, which can have security implications. It forces the browser to use the type provided in the Content-Type header.
// X-Frame-Options
app.use(helmet.frameguard({ action: 'deny' })); // It instructs the browser to prevent any framing of the site, which can help protect against clickjacking attacks.


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
        description: 'A CRUD Auth API application',
    },
    servers: [
        {
            url: process.env.BASE_URL || localhost,
            description: 'Authentication microservices',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    tags: [
        { name: '1st', description: 'Registeration' },
        { name: '2nd', description: 'Activation'},
        { name: '3rd', description: 'Login'},
        { name: '4th', description: 'User Details'},
        // ... add other tags alphabetically ... 
    ],
};

// Options for the swagger docs
const options = {
    swaggerDefinition,
    // Absolute paths to files containing Swagger annotations
    apis: ['src/routes/*.js'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

if (typeof process.env.DOC_USER === 'undefined' || typeof process.env.DOC_PASS === 'undefined') {
    console.error('Environment variable DOC_USER or DOC_PASS is not defined.');
    // Handle the error appropriately, e.g., exit the process or throw an error
    if(process.env.NODE_ENV !== 'test')
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

module.exports = app;
