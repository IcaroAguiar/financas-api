// src/routes/transactionRoutes.js

const { Router } = require('express');
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// Aplica o middleware de autenticação a TODAS as rotas deste arquivo
// Qualquer requisição para /api/transactions/* precisará de um token válido
router.use(authMiddleware);

// Define as rotas para o CRUD de Transações
router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getAllTransactions);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;