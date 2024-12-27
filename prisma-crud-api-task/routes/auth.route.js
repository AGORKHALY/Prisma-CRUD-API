const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

router.post('/login', async (req, res, next) => {
    try {
        const { name, password } = req.body;

        if (!name || !password) {
            return res.status(400).json({
                message: "Name and password are required.",
                status: 400,
            });
        }

        // Fetch the user by name
        const user = await prisma.user.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive', // Case-insensitive match
                },
            },
            include: { UserPassword: true },
        });

        // Debug logs
        console.log("Debug Logs:");
        console.log("Request name:", name);
        console.log("User fetched from database:", user);

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                status: 404,
            });
        }

        if (!user.UserPassword || !user.UserPassword.password) {
            console.log("UserPassword relation or password missing.");
            return res.status(500).json({
                message: "Password not set for this user.",
                status: 500,
            });
        }

        console.log("Hashed password from database:", user.UserPassword.password);

        // Compare the provided password with the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.UserPassword.password);

        if (!isPasswordValid) {
            console.log("Password comparison failed.");
            return res.status(401).json({
                message: "Invalid password.",
                status: 401,
            });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: user.id, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: "Authentication successful.",
            status: 200,
            token,
        });
    } catch (error) {
        console.error("Error during login:", error.message);
        next(error);
    }
});

module.exports = router;

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate a user and generate a JWT token
 *     description: Authenticate a user by verifying the name and password. A valid JWT token is returned upon successful authentication.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Abhyudaya
 *               password:
 *                 type: string
 *                 example: AbhyudayaPassword123
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Authentication successful.
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Name and password are required.
 *                 status:
 *                   type: integer
 *                   example: 400
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found.
 *                 status:
 *                   type: integer
 *                   example: 404
 *       401:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid password.
 *                 status:
 *                   type: integer
 *                   example: 401
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password not set for this user.
 *                 status:
 *                   type: integer
 *                   example: 500
 */
