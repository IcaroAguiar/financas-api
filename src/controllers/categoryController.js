// src/controllers/categoryController.js

const prisma = require("../lib/prisma");

// --- CRIAR UMA NOVA CATEGORIA (CREATE) ---
const createCategory = async (req, res) => {
  try {
    const { name, color } = req.body;
    const userId = req.user.id; // ID do usuário logado

    // Validação
    if (!name) {
      return res
        .status(400)
        .json({ error: "O nome da categoria é obrigatório." });
    }

    // Prisma vai garantir a unicidade de (userId, name) definida no schema
    // Mas podemos adicionar uma verificação manual para um erro mais amigável
    const existingCategory = await prisma.category.findFirst({
      where: { userId, name: { equals: name, mode: "insensitive" } }, // Ignora maiúsculas/minúsculas
    });

    if (existingCategory) {
      return res
        .status(409)
        .json({ error: "Você já possui uma categoria com este nome." });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        color,
        userId,
      },
    });

    res.status(201).json(newCategory);
  } catch (error) {
    // Trata o erro de unicidade que o banco pode jogar, como um fallback
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Você já possui uma categoria com este nome." });
    }
    console.error("Erro ao criar categoria:", error);
    res.status(500).json({ error: "Não foi possível criar a categoria." });
  }
};

// --- LISTAR TODAS AS CATEGORIAS DO USUÁRIO (READ) ---
const getAllCategories = async (req, res) => {
  try {
    const userId = req.user.id;

    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" }, // Ordena por nome
    });

    res.status(200).json(categories);
  } catch (error) {
    console.error("Erro ao listar categorias:", error);
    res.status(500).json({ error: "Não foi possível listar as categorias." });
  }
};

// --- ATUALIZAR UMA CATEGORIA (UPDATE) ---
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const userId = req.user.id;

    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      return res.status(404).json({ error: "Categoria não encontrada." });
    }

    if (category.userId !== userId) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name, color },
    });

    res.status(200).json(updatedCategory);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "O nome da categoria já está em uso." });
    }
    console.error("Erro ao atualizar categoria:", error);
    res.status(500).json({ error: "Não foi possível atualizar a categoria." });
  }
};

// --- DELETAR UMA CATEGORIA (DELETE) ---
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      return res.status(404).json({ error: "Categoria não encontrada." });
    }

    if (category.userId !== userId) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    // Graças ao "onDelete: SetNull" no schema, as transações associadas
    // terão seu `categoryId` definido como nulo automaticamente.
    await prisma.category.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);
    res.status(500).json({ error: "Não foi possível deletar a categoria." });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
