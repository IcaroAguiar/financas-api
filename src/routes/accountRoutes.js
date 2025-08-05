// src/routes/accountRoutes.js

const { Router } = require('express');
const accountController = require('../controllers/accountController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// Protege todas as rotas de conta com autenticação
router.use(authMiddleware);

// Define as rotas para o CRUD de Contas
/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               balance:
 *                 type: number
 *     responses:
 *       201:
 *         description: The account was successfully created
 *       400:
 *         description: Bad request
 */
router.post('/', accountController.createAccount);

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get all accounts
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of accounts
 *       401:
 *         description: Unauthorized
 */
router.get('/', accountController.getAllAccounts);

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Get account by ID
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The account id
 *     responses:
 *       200:
 *         description: Account details with recent transactions
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Account not found
 */
router.get('/:id', accountController.getAccountById);

/**
 * @swagger
 * /api/accounts/{id}:
 *   put:
 *     summary: Update an account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The account id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               balance:
 *                 type: number
 *     responses:
 *       200:
 *         description: The account was successfully updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', accountController.updateAccount);

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Delete an account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The account id
 *     responses:
 *       204:
 *         description: The account was successfully deleted
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', accountController.deleteAccount);

// Exporta o roteador
module.exports = router;