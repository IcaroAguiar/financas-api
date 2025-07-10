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
router.post("/", userController.createUser);

// Define a rota para o método POST que irá autenticar um usuário
router.post("/login", userController.loginUser);

// A rota GET '/me' agora usa o `authMiddleware`.
// O middleware será executado ANTES da função `userController.getMe`.
// Se o token for inválido, o middleware retornará um erro e `getMe` nunca será chamado.
router.get("/me", authMiddleware, userController.getMe);

// Exporta o roteador
module.exports = router;
