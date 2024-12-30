const router = require('express').Router();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/authenticateToken');

const prisma = new PrismaClient();

router.get('/users', authenticateToken, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: { Location: true },
    });
    res.status(200).json({
      message: "All data displayed",
      status: 200,
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch user by ID
    const user = await prisma.user.findUnique({
      where: {
        id: Number(id),
      },
      include: { Location: true },
    });

    if (!user) {
      return res.status(404).json({
        message: `No user found with ID ${id}`,
        status: 404,
        data: null,
      });
    }

    res.status(200).json({
      message: "Required data displayed",
      status: 200,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      message: `Error fetching user with ID ${req.params.id}`,
      status: 500,
      error: error.message || "Internal Server Error",
    });
  }
});

// Create a user (Public Route)
router.post('/users', async (req, res, next) => {
  try {
    const { name, salary, status, Location, password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Password is required.",
        status: 400,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 16);

    const user = await prisma.user.create({
      data: {
        name,
        salary,
        status,
        Location: {
          create: Location,
        },
        UserPassword: {
          create: {
            password: hashedPassword,
          },
        },
      },
      include: {
        Location: true,
        UserPassword: true,
      },
    });

    res.status(200).json({
      message: "User, associated locations, and password added successfully",
      status: 200,
      data: user,
    });
  } catch (error) {
    let statusCode;
    let errorMessage;

    if (error.name === "PrismaClientValidationError") {
      statusCode = 400;
      errorMessage = "Validation error: Invalid data provided.";
    } else if (error.name === "PrismaClientKnownRequestError") {
      statusCode = 500;
      errorMessage = "Database error occurred while creating the user.";
    } else {
      statusCode = 500;
      errorMessage = "An unexpected error occurred.";
    }

    res.status(statusCode).json({
      message: errorMessage,
      status: statusCode,
      error: error.message || "Unknown error",
    });
  }
});

router.delete('/users/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({
        message: "Invalid ID provided.",
        status: 400,
      });
    }

    await prisma.userPassword.deleteMany({
      where: {
        empId: Number(id),
      },
    });

    await prisma.location.deleteMany({
      where: {
        empId: Number(id),
      },
    });

    await prisma.user.delete({
      where: {
        id: Number(id),
      },
    });

    res.status(200).json({
      message: "User, associated locations, and password deleted successfully",
      status: 200,
    });
  } catch (error) {
    let statusCode;
    let errorMessage;

    if (error.name === "PrismaClientKnownRequestError" && error.code === "P2025") {
      statusCode = 404;
      errorMessage = `User with ID ${req.params.id} not found.`;
    } else {
      statusCode = 500;
      errorMessage = "An unexpected error occurred.";
    }

    res.status(statusCode).json({
      message: errorMessage,
      status: statusCode,
      error: error.message || "Unknown error",
    });
  }
});

router.patch('/users/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, salary, status, Location, password } = req.body;

    if (isNaN(Number(id))) {
      return res.status(400).json({
        message: "Invalid ID provided.",
        status: 400,
      });
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 16);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: Number(id),
      },
      data: {
        name,
        salary,
        status,
        Location: Location
          ? {
            upsert: Location.map((location) => ({
              where: { id: location.id },
              create: {
                country: location.country,
                district: location.district,
                street: location.street,
              },
              update: {
                country: location.country,
                district: location.district,
                street: location.street,
              },
            })),
          }
          : undefined,
        UserPassword: hashedPassword
          ? {
            upsert: {
              where: { empId: Number(id) },
              create: { password: hashedPassword },
              update: { password: hashedPassword },
            },
          }
          : undefined,
      },
      include: {
        Location: true,
        UserPassword: true,
      },
    });

    res.status(200).json({
      message: "User, associated locations, and password updated successfully",
      status: 200,
      data: updatedUser,
    });
  } catch (error) {
    let statusCode;
    let errorMessage;

    if (error.name === "PrismaClientKnownRequestError" && error.code === "P2025") {
      statusCode = 404;
      errorMessage = `User with ID ${req.params.id} not found.`;
    } else {
      statusCode = 500;
      errorMessage = "An unexpected error occurred.";
    }

    res.status(statusCode).json({
      message: errorMessage,
      status: statusCode,
      error: error.message || "Unknown error",
    });
  }
});

module.exports = router;





/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve all users
 *     description: Fetch a list of all users from the database.
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All data displayed
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       salary:
 *                         type: integer
 *                       status:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */



/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Retrieve a user by ID
 *     description: Fetch a specific user from the database by their ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the user to retrieve.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Required data displayed
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     salary:
 *                       type: integer
 *                     status:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: User not found.
 */



/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Add a new user to the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               salary:
 *                 type: integer
 *                 example: 50000
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data added successfully
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     salary:
 *                       type: integer
 *                     status:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 */




/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update a user by ID
 *     description: Update the details of an existing user.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the user to update.
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               salary:
 *                 type: integer
 *                 example: 60000
 *               status:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: User updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data updated successfully
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     salary:
 *                       type: integer
 *                     status:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: User not found.
 */



/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     description: Remove a user from the database by their ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the user to delete.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data deleted successfully
 *                 status:
 *                   type: integer
 *                   example: 200
 *       404:
 *         description: User not found.
 */


