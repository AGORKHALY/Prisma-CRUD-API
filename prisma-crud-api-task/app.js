const express = require('express');
const createError = require('http-errors');
const morgan = require('morgan');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerSpec');
const authRoutes = require('./routes/auth.route');
const authenticateToken = require('./middleware/authenticateToken');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', async (req, res, next) => {
  res.send({ message: 'Awesome it works' });
});

// Public route for login
app.use('/auth', authRoutes);

// Example of a protected route
app.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({
    message: "Access granted to protected route.",
    user: req.user,
  });
});

//route
app.use('/api', require('./routes/api.route'));

// Handle 404 errors
app.use((req, res, next) => {
  next(createError.NotFound());
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    status: err.status || 500,
    message: err.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
