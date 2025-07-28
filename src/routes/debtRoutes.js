const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debtController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply authentication middleware to all debt routes
router.use(authMiddleware);
// Listagem geral
/**
 * @swagger
 * /api/debts:
 *   get:
 *     summary: Get all debts
 *     tags: [Debts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of debts
 *       401:
 *         description: Unauthorized
 */
router.get('/', debtController.getAllDebts);

/**
 * @swagger
 * /api/debts/{id}:
 *   get:
 *     summary: Get a debt by id
 *     tags: [Debts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The debt id
 *     responses:
 *       200:
 *         description: The debt description by id
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', debtController.getDebtById);

/**
 * @swagger
 * /api/debts/status/{status}:
 *   get:
 *     summary: Get debts by status
 *     tags: [Debts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDENTE, PAGA]
 *         required: true
 *         description: The debt status
 *     responses:
 *       200:
 *         description: A list of debts with the specified status
 *       401:
 *         description: Unauthorized
 */
router.get('/status/:status', debtController.getDebtsByStatus);

/**
 * @swagger
 * /api/debts:
 *   post:
 *     summary: Create a new debt
 *     tags: [Debts]
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
 *               totalAmount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               debtorId:
 *                 type: string
 *     responses:
 *       201:
 *         description: The debt was successfully created
 *       400:
 *         description: Bad request
 */
router.post('/', debtController.createDebt);

/**
 * @swagger
 * /api/debts/{id}:
 *   put:
 *     summary: Update a debt
 *     tags: [Debts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The debt id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [PENDENTE, PAGA]
 *     responses:
 *       200:
 *         description: The debt was successfully updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', debtController.updateDebt);

/**
 * @swagger
 * /api/debts/{id}:
 *   delete:
 *     summary: Delete a debt
 *     tags: [Debts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The debt id
 *     responses:
 *       200:
 *         description: The debt was successfully deleted
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', debtController.deleteDebt);
module.exports = router;