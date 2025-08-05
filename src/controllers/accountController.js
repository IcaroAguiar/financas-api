// src/controllers/accountController.js

const prisma = require("../lib/prisma");

// --- CRIAR UMA NOVA CONTA (CREATE) ---
const createAccount = async (req, res) => {
  try {
    const { name, type, balance } = req.body;
    const userId = req.user.id; // ID do usuário logado

    // Validação
    if (!name || !type) {
      return res
        .status(400)
        .json({ error: "O nome e tipo da conta são obrigatórios." });
    }

    // Prisma vai garantir a unicidade de (userId, name) definida no schema
    // Mas podemos adicionar uma verificação manual para um erro mais amigável
    const existingAccount = await prisma.account.findFirst({
      where: { userId, name: { equals: name, mode: "insensitive" } }, // Ignora maiúsculas/minúsculas
    });

    if (existingAccount) {
      return res
        .status(409)
        .json({ error: "Você já possui uma conta com este nome." });
    }

    const newAccount = await prisma.account.create({
      data: {
        name,
        type,
        balance: balance || 0.0,
        userId,
      },
    });

    res.status(201).json(newAccount);
  } catch (error) {
    // Trata o erro de unicidade que o banco pode jogar, como um fallback
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Você já possui uma conta com este nome." });
    }
    console.error("Erro ao criar conta:", error);
    res.status(500).json({ error: "Não foi possível criar a conta." });
  }
};

// --- LISTAR TODAS AS CONTAS DO USUÁRIO (READ) ---
const getAllAccounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { name: "asc" }, // Ordena por nome
    });

    res.status(200).json(accounts);
  } catch (error) {
    console.error("Erro ao listar contas:", error);
    res.status(500).json({ error: "Não foi possível listar as contas." });
  }
};

// --- OBTER UMA CONTA ESPECÍFICA (READ ONE) ---
const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { date: "desc" },
          take: 10, // Últimas 10 transações
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: "Conta não encontrada." });
    }

    if (account.userId !== userId) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    res.status(200).json(account);
  } catch (error) {
    console.error("Erro ao obter conta:", error);
    res.status(500).json({ error: "Não foi possível obter a conta." });
  }
};

// --- ATUALIZAR UMA CONTA (UPDATE) ---
const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, balance } = req.body;
    const userId = req.user.id;

    const account = await prisma.account.findUnique({ where: { id } });

    if (!account) {
      return res.status(404).json({ error: "Conta não encontrada." });
    }

    if (account.userId !== userId) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: { name, type, balance },
    });

    res.status(200).json(updatedAccount);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "O nome da conta já está em uso." });
    }
    console.error("Erro ao atualizar conta:", error);
    res.status(500).json({ error: "Não foi possível atualizar a conta." });
  }
};

// --- DELETAR UMA CONTA (DELETE) ---
const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const account = await prisma.account.findUnique({ where: { id } });

    if (!account) {
      return res.status(404).json({ error: "Conta não encontrada." });
    }

    if (account.userId !== userId) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    // Graças ao relacionamento opcional no schema, as transações associadas
    // terão seu `accountId` definido como nulo automaticamente.
    await prisma.account.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar conta:", error);
    res.status(500).json({ error: "Não foi possível deletar a conta." });
  }
};

module.exports = {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
};