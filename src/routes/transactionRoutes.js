// src/routes/transactionRoutes.js

const { Router } = require('express');
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// Aplica o middleware de autenticação a TODAS as rotas deste arquivo
// Qualquer requisição para /api/transactions/* precisará de um token válido
router.use(authMiddleware);

// Define as rotas para o CRUD de Transações
/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [RECEITA, DESPESA]
 *               categoryId:
 *                 type: string
 *     responses:
 *       201:
 *         description: The transaction was successfully created
 *       400:
 *         description: Bad request
 */
router.post('/', transactionController.createTransaction);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of transactions
 *       401:
 *         description: Unauthorized
 */
router.get('/', transactionController.getAllTransactions);

/**
 * @swagger
 * /api/transactions/summary:
 *   get:
 *     summary: Get financial summary
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The financial summary
 *       401:
 *         description: Unauthorized
 */
router.get('/summary', transactionController.getFinancialSummary);

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The transaction id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [RECEITA, DESPESA]
 *               categoryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: The transaction was successfully updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', transactionController.updateTransaction);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The transaction id
 *     responses:
 *       200:
 *         description: The transaction was successfully deleted
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;