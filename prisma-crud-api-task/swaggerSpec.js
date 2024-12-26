const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Express API Documentation',
        version: '1.0.0',
        description: 'API documentation for the existing Express.js app',
    },
    servers: [
        {
            url: 'http://localhost:3000',
        },
    ],
};

const options = {
    swaggerDefinition,
    apis: ['./routes/*.js'], // Adjust path to include your route files
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
