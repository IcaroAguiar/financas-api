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

// Exporta o roteador
module.exports = router;
