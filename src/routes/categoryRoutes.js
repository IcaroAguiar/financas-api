// src/routes/categoryRoutes.js

const { Router } = require('express');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// Protege todas as rotas de categoria com autenticação
router.use(authMiddleware);

// Define as rotas para o CRUD de Categorias
router.post('/', categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);
// Exporta o roteador
module.exports = router;