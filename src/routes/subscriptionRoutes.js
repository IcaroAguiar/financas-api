const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  toggleSubscriptionStatus,
  processSubscriptions,
  getUpcomingSubscriptions
} = require('../controllers/subscriptionController');

// Todas as rotas requerem autenticação
router.use(auth);

// GET /api/subscriptions - Listar todas as assinaturas do usuário
router.get('/', getSubscriptions);

// GET /api/subscriptions/upcoming - Buscar assinaturas que vencerão em breve
router.get('/upcoming', getUpcomingSubscriptions);

// POST /api/subscriptions/process - Processar assinaturas (gerar transações)
router.post('/process', processSubscriptions);

// GET /api/subscriptions/:id - Buscar assinatura específica
router.get('/:id', getSubscriptionById);

// POST /api/subscriptions - Criar nova assinatura
router.post('/', createSubscription);

// PUT /api/subscriptions/:id - Atualizar assinatura
router.put('/:id', updateSubscription);

// PATCH /api/subscriptions/:id/toggle - Pausar/Despausar assinatura
router.patch('/:id/toggle', toggleSubscriptionStatus);

// DELETE /api/subscriptions/:id - Deletar assinatura
router.delete('/:id', deleteSubscription);

module.exports = router;