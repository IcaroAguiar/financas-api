// src/routes/userRoutes.js

// Importa o Router do express
const { Router } = require("express");

// Importa o controlador de usuário
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware"); // Importa o middleware

// Cria uma instância do roteador
const router = Router();

// Define a rota para o método POST que irá criar um usuário
// A URL será '/users', mas o prefixo '/api' será adicionado no server.js
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: The user was successfully created
 *       400:
 *         description: Bad request
 */
router.post("/", userController.createUser);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: The user was successfully logged in
 *       401:
 *         description: Unauthorized
 */
router.post("/login", userController.loginUser);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get the current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The current user
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authMiddleware, userController.getMe);

/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Password reset email sent (if email exists)
 *       400:
 *         description: Bad request - email required
 *       500:
 *         description: Internal server error
 */
router.post("/forgot-password", userController.requestPasswordReset);

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *             required:
 *               - token
 *               - newPassword
 *     responses:
 *       200:
 *         description: Password successfully reset
 *       400:
 *         description: Invalid or expired token, or validation error
 *       500:
 *         description: Internal server error
 */
router.post("/reset-password", userController.resetPassword);

/**
 * @swagger
 * /api/users/verify-reset-token/{token}:
 *   get:
 *     summary: Verify if a reset token is valid
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The password reset token
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 email:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Token is invalid or expired
 *       500:
 *         description: Internal server error
 */
router.get("/verify-reset-token/:token", userController.verifyResetToken);

// Exporta o roteador
module.exports = router;

