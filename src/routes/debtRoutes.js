const express = require('express');
const router = express.Router();
// const authMiddleware = require('../middlewares/authMiddleware');
const debtController = require('../controllers/debtController');

// router.use(authMiddleware);

router.get('/', debtController.getAllDebts);
router.post('/', debtController.createDebt);
router.put('/:id', debtController.updateDebt);
router.delete('/:id', debtController.deleteDebt);

module.exports = router;