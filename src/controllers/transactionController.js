// src/controllers/transactionController.js

const prisma = require("../lib/prisma");
const { TransactionType } = require("@prisma/client"); // Importa o Enum

// --- CRIAR UMA NOVA TRANSAÇÃO (CREATE) ---
const createTransaction = async (req, res) => {
  try {
    const { 
      description, 
      amount, 
      date, 
      type, 
      categoryId, 
      accountId, 
      isRecurring, 
      subscriptionFrequency, 
      debtId,
      // Payment plan fields
      isInstallmentPlan,
      installmentCount,
      installmentFrequency,
      firstInstallmentDate
    } = req.body;
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

    if (type !== TransactionType.RECEITA && type !== TransactionType.DESPESA && type !== TransactionType.PAGO) {
      return res
        .status(400)
        .json({ error: "O tipo da transação deve ser RECEITA, DESPESA ou PAGO." });
    }

    // Validação adicional para accountId se fornecido
    if (accountId) {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        return res.status(404).json({ error: "Conta não encontrada." });
      }

      if (account.userId !== userId) {
        return res.status(403).json({ error: "Acesso negado à conta especificada." });
      }
    }

    // Handle recurring transaction logic
    let subscriptionId = null;
    if (isRecurring && subscriptionFrequency) {
      // Create a subscription for this recurring transaction
      const subscription = await prisma.subscription.create({
        data: {
          name: description,
          description: `Auto-generated from transaction: ${description}`,
          amount: parseFloat(amount),
          type,
          frequency: subscriptionFrequency,
          startDate: new Date(date),
          nextPaymentDate: new Date(date),
          isActive: true,
          userId,
          categoryId,
          accountId,
        }
      });
      subscriptionId = subscription.id;
    }

    // Handle debt payment logic
    if (debtId && type === 'RECEITA') {
      // Verify debt exists and belongs to user
      const debt = await prisma.debt.findFirst({
        where: {
          id: debtId,
          debtor: {
            userId: userId
          }
        },
        include: {
          payments: true
        }
      });

      if (!debt) {
        return res.status(404).json({ error: "Dívida não encontrada." });
      }

      // Create payment record
      await prisma.payment.create({
        data: {
          amount: parseFloat(amount),
          paymentDate: new Date(date),
          debtId: debtId,
          notes: `Pagamento via transação: ${description}`
        }
      });
    }

    // Handle payment plan logic
    let transactionData = {
      description,
      amount: parseFloat(amount),
      date: new Date(date),
      type,
      userId,
      categoryId,
      accountId,
      isRecurring: Boolean(isRecurring),
      subscriptionId,
    };

    // Add installment plan fields if provided
    if (isInstallmentPlan && installmentCount && installmentFrequency) {
      // Validation for installment plan
      const count = parseInt(installmentCount);
      if (count < 2 || count > 48) {
        return res.status(400).json({ 
          error: "O número de parcelas deve estar entre 2 e 48." 
        });
      }

      if (!['MONTHLY', 'WEEKLY'].includes(installmentFrequency)) {
        return res.status(400).json({ 
          error: "A frequência das parcelas deve ser MONTHLY ou WEEKLY." 
        });
      }

      const installmentAmount = parseFloat(amount) / count;
      const firstDate = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date(date);

      transactionData = {
        ...transactionData,
        isInstallmentPlan: true,
        installmentCount: count,
        installmentFrequency,
        installmentAmount,
        firstInstallmentDate: firstDate,
      };
    }

    const newTransaction = await prisma.transaction.create({
      data: transactionData,
      include: {
        category: true, // Inclui os dados da categoria na resposta
        account: true, // Inclui os dados da conta na resposta
        subscription: true, // Include subscription info if linked
        installments: true, // Include installments if this is an installment plan
      },
    });

    // Create installment records if this is an installment plan
    if (isInstallmentPlan && installmentCount && installmentFrequency) {
      const count = parseInt(installmentCount);
      const installmentAmount = parseFloat(amount) / count;
      const firstDate = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date(date);
      
      const installments = [];
      for (let i = 0; i < count; i++) {
        let dueDate = new Date(firstDate);
        
        if (installmentFrequency === 'MONTHLY') {
          dueDate.setMonth(firstDate.getMonth() + i);
        } else if (installmentFrequency === 'WEEKLY') {
          dueDate.setDate(firstDate.getDate() + (i * 7));
        }
        
        installments.push({
          installmentNumber: i + 1,
          amount: installmentAmount,
          dueDate: dueDate,
          status: 'PENDENTE',
          transactionId: newTransaction.id,
        });
      }
      
      // Create all installments in batch
      await prisma.transactionInstallment.createMany({
        data: installments,
      });
      
      // Fetch the transaction again with installments included
      const updatedTransaction = await prisma.transaction.findUnique({
        where: { id: newTransaction.id },
        include: {
          category: true,
          account: true,
          subscription: true,
          installments: {
            orderBy: { installmentNumber: 'asc' }
          },
        },
      });
      
      return res.status(201).json(updatedTransaction);
    }

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    res.status(500).json({ error: "Não foi possível criar a transação." });
  }
};

// --- LISTAR TODAS AS TRANSAÇÕES DO USUÁRIO (READ) ---
const getAllTransactions = async (req, res) => {
  try {
    console.error("🔍 CONTROLLER: getAllTransactions called");
    
    const userId = req.user?.id;
    console.error("🔍 CONTROLLER: userId =", userId);
    
    // Check if user is properly authenticated
    if (!userId) {
      console.error("❌ CONTROLLER: No userId found");
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    
    const { accountId } = req.query; // Filtro opcional por conta
    console.error("🔍 CONTROLLER: accountId =", accountId);

    // Constrói o filtro de busca
    const whereClause = { userId };
    if (accountId) {
      whereClause.accountId = accountId;
    }
    
    console.error("🔍 CONTROLLER: whereClause =", whereClause);

    console.error("🔍 CONTROLLER: About to call prisma.transaction.findMany");
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: "desc" }, // Ordena da mais recente para a mais antiga
      include: { 
        category: true,
        account: true, // Inclui dados da conta
        installments: {
          orderBy: { installmentNumber: 'asc' }
        }, // Include installments for payment plan transactions
      },
    });

    console.error("🔍 CONTROLLER: Found transactions:", transactions.length);
    res.status(200).json(transactions);
  } catch (error) {
    console.error("❌ CONTROLLER ERROR:", error.message);
    console.error("❌ CONTROLLER ERROR STACK:", error.stack);
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

    // Validação adicional para accountId se fornecido na atualização
    if (dataToUpdate.accountId) {
      const account = await prisma.account.findUnique({
        where: { id: dataToUpdate.accountId },
      });

      if (!account) {
        return res.status(404).json({ error: "Conta não encontrada." });
      }

      if (account.userId !== userId) {
        return res.status(403).json({ error: "Acesso negado à conta especificada." });
      }
    }

    // Se pertence, atualiza
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: dataToUpdate,
      include: { 
        category: true,
        account: true, // Inclui dados da conta
      },
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
        type: TransactionType.RECEITA 
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
        type: TransactionType.RECEITA,
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

// --- MARCAR PARCELA DE TRANSAÇÃO COMO PAGA ---
const markTransactionInstallmentPaid = async (req, res) => {
  try {
    const { transactionId, installmentId } = req.params;
    const userId = req.user.id;

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: userId
      },
      include: {
        installments: {
          where: { id: installmentId }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transação não encontrada." });
    }

    if (transaction.installments.length === 0) {
      return res.status(404).json({ error: "Parcela não encontrada." });
    }

    const installment = transaction.installments[0];

    if (installment.status === 'PAGO') {
      return res.status(400).json({ error: "Esta parcela já foi paga." });
    }

    // Mark installment as paid
    const updatedInstallment = await prisma.transactionInstallment.update({
      where: { id: installmentId },
      data: {
        status: 'PAGO',
        paidDate: new Date()
      }
    });

    res.status(200).json(updatedInstallment);
  } catch (error) {
    console.error("Erro ao marcar parcela como paga:", error);
    res.status(500).json({ error: "Não foi possível marcar a parcela como paga." });
  }
};

// --- MARCAR TRANSAÇÃO INTEIRA COMO PAGA ---
const markTransactionPaid = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: userId
      },
      include: {
        installments: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transação não encontrada." });
    }

    if (transaction.isInstallmentPlan) {
      // Mark all pending installments as paid
      await prisma.transactionInstallment.updateMany({
        where: {
          transactionId: transactionId,
          status: 'PENDENTE'
        },
        data: {
          status: 'PAGO',
          paidDate: new Date()
        }
      });
    }

    // Change transaction type from DESPESA to PAGO when marking as paid
    let updateData = {};
    if (transaction.type === 'DESPESA') {
      updateData.type = 'PAGO';
    }

    // Update transaction type if needed
    if (Object.keys(updateData).length > 0) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: updateData
      });
    }

    // Fetch updated transaction with installments
    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        category: true,
        account: true,
        installments: {
          orderBy: { installmentNumber: 'asc' }
        }
      }
    });

    res.status(200).json(updatedTransaction);
  } catch (error) {
    console.error("Erro ao marcar transação como paga:", error);
    res.status(500).json({ error: "Não foi possível marcar a transação como paga." });
  }
};

// --- REGISTRAR PAGAMENTO PARCIAL DE TRANSAÇÃO ---
const registerPartialPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "O valor do pagamento deve ser maior que zero." });
    }

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: userId
      },
      include: {
        installments: {
          where: { status: 'PENDENTE' },
          orderBy: { installmentNumber: 'asc' }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transação não encontrada." });
    }

    if (!transaction.isInstallmentPlan) {
      return res.status(400).json({ error: "Pagamento parcial só é permitido para transações parceladas." });
    }

    const pendingInstallments = transaction.installments;
    if (pendingInstallments.length === 0) {
      return res.status(400).json({ error: "Não há parcelas pendentes para esta transação." });
    }

    // Apply payment to pending installments starting from the earliest
    let remainingAmount = parseFloat(amount);
    const updatedInstallments = [];

    for (const installment of pendingInstallments) {
      if (remainingAmount <= 0) break;

      if (remainingAmount >= installment.amount) {
        // Pay installment completely
        const updated = await prisma.transactionInstallment.update({
          where: { id: installment.id },
          data: {
            status: 'PAGO',
            paidDate: new Date()
          }
        });
        updatedInstallments.push(updated);
        remainingAmount -= installment.amount;
      } else {
        // Partial payment of this installment - we could split it, but for now just apply to the first one
        break;
      }
    }

    // Fetch updated transaction
    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        category: true,
        account: true,
        installments: {
          orderBy: { installmentNumber: 'asc' }
        }
      }
    });

    res.status(200).json({
      transaction: updatedTransaction,
      paidAmount: parseFloat(amount) - remainingAmount,
      remainingAmount: remainingAmount
    });
  } catch (error) {
    console.error("Erro ao registrar pagamento parcial:", error);
    res.status(500).json({ error: "Não foi possível registrar o pagamento parcial." });
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  updateTransaction,
  deleteTransaction,
  getFinancialSummary,
  markTransactionInstallmentPaid,
  markTransactionPaid,
  registerPartialPayment,
};
