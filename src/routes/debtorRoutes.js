const express = require('express');
const router = express.Router();
// const authMiddleware = require('../middlewares/authMiddleware');
const debtorController = require('../controllers/debtorController');

// router.use(authMiddleware);

router.get('/', debtorController.getAllDebtors);
router.post('/', debtorController.createDebtor);
router.put('/:id', debtorController.updateDebtor);
router.delete('/:id', debtorController.deleteDebtor);
router.get('/:id/debts', debtorController.getDebtsByDebtorId);

module.exports = router;
