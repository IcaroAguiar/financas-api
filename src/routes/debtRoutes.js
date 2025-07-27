const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debtController');
// router.use(authMiddleware);
// Listagem geral
router.get('/', debtController.getAllDebts);
// Buscar por ID
router.get('/:id', debtController.getDebtById);
// Filtrar por status (PENDENTE ou PAGA)
router.get('/status/:status', debtController.getDebtsByStatus);
// Criar dívida
router.post('/', debtController.createDebt);
// Atualizar dívida inteira
router.put('/:id', debtController.updateDebt);
// Deletar dívida
router.delete('/:id', debtController.deleteDebt);
module.exports = router;