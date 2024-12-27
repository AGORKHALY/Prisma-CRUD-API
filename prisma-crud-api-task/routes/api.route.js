const router = require('express').Router();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

router.get('/users', async (req, res, next) => {
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


router.get('/users/:id', async (req, res, next) => {
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
      // If no user is found, return a 404 response
      return res.status(404).json({
        message: `No user found with ID ${id}`,
        status: 404,
        data: null,
      });
    }

    // If user is found, return the structured response
    res.status(200).json({
      message: "Required data displayed",
      status: 200,
      data: user,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      message: `Error fetching user with ID ${req.params.id}`,
      status: 500,
      error: error.message || "Internal Server Error",
    });
  }
});


router.post('/users', async (req, res, next) => {
  try {
    const { name, salary, status, Location, password } = req.body; // Include 'password' in the request body

    // Validate the presence of a password
    if (!password) {
      return res.status(400).json({
        message: "Password is required.",
        status: 400,
      });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 16);

    // Create a new user with associated locations and password in the database
    const user = await prisma.user.create({
      data: {
        name,
        salary,
        status,
        Location: {
          create: Location, // Use nested create for Location model
        },
        UserPassword: {
          create: {
            password: hashedPassword, // Store the hashed password
          },
        },
      },
      include: {
        Location: true, // Include related Location data in the response
        UserPassword: true, // Include the password in the response
      },
    });

    // Return a structured response
    res.status(200).json({
      message: "User, associated locations, and password added successfully",
      status: 200,
      data: user,
    });
  } catch (error) {
    // Handle errors
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



router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Ensure the ID is a valid number
    if (isNaN(Number(id))) {
      return res.status(400).json({
        message: "Invalid ID provided.",
        status: 400,
      });
    }

    // Delete associated UserPassword
    await prisma.userPassword.deleteMany({
      where: {
        empId: Number(id),
      },
    });

    // Delete associated locations
    await prisma.location.deleteMany({
      where: {
        empId: Number(id),
      },
    });

    // Delete the user
    await prisma.user.delete({
      where: {
        id: Number(id),
      },
    });

    // Return a structured success response
    res.status(200).json({
      message: "User, associated locations, and password deleted successfully",
      status: 200,
    });
  } catch (error) {
    let statusCode;
    let errorMessage;

    // Handle specific Prisma error for record not found
    if (error.name === "PrismaClientKnownRequestError" && error.code === "P2025") {
      statusCode = 404;
      errorMessage = `User with ID ${req.params.id} not found.`;
    } else {
      // Handle generic errors
      statusCode = 500;
      errorMessage = "An unexpected error occurred.";
    }

    // Return an error response without crashing the server
    res.status(statusCode).json({
      message: errorMessage,
      status: statusCode,
      error: error.message || "Unknown error",
    });
  }
});



router.patch('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, salary, status, Location, password } = req.body; // Include 'password' in the request body

    // Ensure the ID is a valid number
    if (isNaN(Number(id))) {
      return res.status(400).json({
        message: "Invalid ID provided.",
        status: 400,
      });
    }

    // Hash the password if it exists in the request body
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 16); // Generate a 16-byte hashed password
    }

    // Update the user and associated locations
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
              where: { id: location.id }, // Correctly check if the location exists by ID
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
              where: { empId: Number(id) }, // Check if password exists for the user
              create: { password: hashedPassword },
              update: { password: hashedPassword },
            },
          }
          : undefined,
      },
      include: {
        Location: true, // Include the updated locations in the response
        UserPassword: true, // Include the updated password in the response
      },
    });

    // Return a structured response for success
    res.status(200).json({
      message: "User, associated locations, and password updated successfully",
      status: 200,
      data: updatedUser,
    });
  } catch (error) {
    let statusCode;
    let errorMessage;

    // Handle specific Prisma error for record not found
    if (error.name === "PrismaClientKnownRequestError" && error.code === "P2025") {
      statusCode = 404;
      errorMessage = `User with ID ${req.params.id} not found.`;
    } else {
      // Handle generic errors
      statusCode = 500;
      errorMessage = "An unexpected error occurred.";
    }

    // Return an error response without crashing the server
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


