const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentsController');

// router.use(authMiddleware);

// Criar pagamento
router.post('/', paymentController.createPayment);

module.exports = router;
