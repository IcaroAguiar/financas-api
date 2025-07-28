const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentsController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply authentication middleware to all payment routes
router.use(authMiddleware);

// Criar pagamento
/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *               debtId:
 *                 type: string
 *     responses:
 *       201:
 *         description: The payment was successfully created
 *       400:
 *         description: Bad request
 */
router.post('/', paymentController.createPayment);

/**
 * @swagger
 * /api/payments/debt/{debtId}:
 *   get:
 *     summary: Get all payments for a specific debt
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: debtId
 *         schema:
 *           type: string
 *         required: true
 *         description: The debt id
 *     responses:
 *       200:
 *         description: A list of payments for the specified debt
 *       401:
 *         description: Unauthorized
 */
router.get('/debt/:debtId', paymentController.getPaymentsByDebtId);

/**
 * @swagger
 * /api/payments/{id}:
 *   delete:
 *     summary: Delete a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The payment id
 *     responses:
 *       200:
 *         description: The payment was successfully deleted
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
