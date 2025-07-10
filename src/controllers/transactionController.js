// src/controllers/transactionController.js

const prisma = require("../lib/prisma");
const { TransactionType } = require("@prisma/client"); // Importa o Enum

// --- CRIAR UMA NOVA TRANSAÇÃO (CREATE) ---
const createTransaction = async (req, res) => {
  try {
    const { description, amount, date, type, categoryId } = req.body;
    const userId = req.user.id; // O ID do usuário vem do middleware de autenticação

    // Validação básica
    if (!description || !amount || !date || !type) {
      return res
        .status(400)
        .json({
          error:
            "Todos os campos (descrição, valor, data, tipo) são obrigatórios.",
        });
    }

    if (type !== TransactionType.RECEITA && type !== TransactionType.DESPESA) {
      return res
        .status(400)
        .json({ error: "O tipo da transação deve ser RECEITA ou DESPESA." });
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        description,
        amount: parseFloat(amount), // Garante que o valor é um número
        date: new Date(date), // Garante que a data é um objeto Date
        type,
        userId,
        categoryId, // Pode ser nulo se não for fornecido
      },
      include: {
        category: true, // Inclui os dados da categoria na resposta
      },
    });

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    res.status(500).json({ error: "Não foi possível criar a transação." });
  }
};

// --- LISTAR TODAS AS TRANSAÇÕES DO USUÁRIO (READ) ---
const getAllTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" }, // Ordena da mais recente para a mais antiga
      include: { category: true },
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Erro ao listar transações:", error);
    res.status(500).json({ error: "Não foi possível listar as transações." });
  }
};

// --- ATUALIZAR UMA TRANSAÇÃO (UPDATE) ---
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params; // Pega o ID da transação da URL
    const dataToUpdate = req.body;
    const userId = req.user.id;

    // Primeiro, verifica se a transação pertence ao usuário logado
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transação não encontrada." });
    }

    if (transaction.userId !== userId) {
      return res
        .status(403)
        .json({
          error: "Acesso negado. Você não pode modificar esta transação.",
        });
    }

    // Se pertence, atualiza
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: dataToUpdate,
      include: { category: true },
    });

    res.status(200).json(updatedTransaction);
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    res.status(500).json({ error: "Não foi possível atualizar a transação." });
  }
};

// --- DELETAR UMA TRANSAÇÃO (DELETE) ---
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Mesma verificação de segurança do Update
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transação não encontrada." });
    }

    if (transaction.userId !== userId) {
      return res
        .status(403)
        .json({
          error: "Acesso negado. Você não pode deletar esta transação.",
        });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    // Código 204 significa "No Content", resposta padrão para delete com sucesso
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar transação:", error);
    res.status(500).json({ error: "Não foi possível deletar a transação." });
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  updateTransaction,
  deleteTransaction,
};
