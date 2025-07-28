const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const debtorController = require('../controllers/debtorController');

// Apply authentication middleware to all debtor routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/debtors:
 *   get:
 *     summary: Get all debtors
 *     tags: [Debtors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of debtors
 *       401:
 *         description: Unauthorized
 */
router.get('/', debtorController.getAllDebtors);

/**
 * @swagger
 * /api/debtors:
 *   post:
 *     summary: Create a new debtor
 *     tags: [Debtors]
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
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: The debtor was successfully created
 *       400:
 *         description: Bad request
 */
router.post('/', debtorController.createDebtor);

/**
 * @swagger
 * /api/debtors/{id}:
 *   put:
 *     summary: Update a debtor
 *     tags: [Debtors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The debtor id
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
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: The debtor was successfully updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', debtorController.updateDebtor);

/**
 * @swagger
 * /api/debtors/{id}:
 *   delete:
 *     summary: Delete a debtor
 *     tags: [Debtors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The debtor id
 *     responses:
 *       200:
 *         description: The debtor was successfully deleted
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', debtorController.deleteDebtor);

/**
 * @swagger
 * /api/debtors/{id}/debts:
 *   get:
 *     summary: Get all debts for a specific debtor
 *     tags: [Debtors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The debtor id
 *     responses:
 *       200:
 *         description: A list of debts for the specified debtor
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/debts', debtorController.getDebtsByDebtorId);

module.exports = router;
