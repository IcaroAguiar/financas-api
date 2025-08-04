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

// --- OBTER RESUMO FINANCEIRO DO USUÁRIO (DASHBOARD) ---
const getFinancialSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Calcula o total de receitas
    const totalIncome = await prisma.transaction.aggregate({
      where: { 
        userId, 
        type: TransactionType.RECEBIMENTO 
      },
      _sum: { amount: true }
    });

    // Calcula o total de despesas
    const totalExpenses = await prisma.transaction.aggregate({
      where: { 
        userId, 
        type: TransactionType.DESPESA 
      },
      _sum: { amount: true }
    });

    // Busca as últimas transações
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
      include: { category: true }
    });

    // Calcula resumo do mês atual
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthlyIncome = await prisma.transaction.aggregate({
      where: { 
        userId,
        type: TransactionType.RECEBIMENTO,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: { amount: true }
    });

    const monthlyExpenses = await prisma.transaction.aggregate({
      where: { 
        userId,
        type: TransactionType.DESPESA,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: { amount: true }
    });

    const summary = {
      totalIncome: totalIncome._sum.amount || 0,
      totalExpenses: totalExpenses._sum.amount || 0,
      balance: (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0),
      recentTransactions,
      monthly: {
        income: monthlyIncome._sum.amount || 0,
        expenses: monthlyExpenses._sum.amount || 0,
        balance: (monthlyIncome._sum.amount || 0) - (monthlyExpenses._sum.amount || 0)
      }
    };

    res.status(200).json(summary);
  } catch (error) {
    console.error("Erro ao obter resumo financeiro:", error);
    res.status(500).json({ error: "Não foi possível obter o resumo financeiro." });
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  updateTransaction,
  deleteTransaction,
  getFinancialSummary,
};
