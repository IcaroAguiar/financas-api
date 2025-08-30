// src/controllers/transactionController.js

const prisma = require("../lib/prisma");
const { TransactionType } = require("@prisma/client"); // Importa o Enum
const { addMonths, addWeeks } = require("date-fns");

// Lista das categorias pré-definidas válidas
const predefinedCategoryIds = [
  'alimentacao', 'transporte', 'moradia', 'saude', 'educacao', 
  'lazer', 'compras', 'contas', 'salario', 'freelance', 
  'investimentos', 'vendas', 'bonus'
];

// Map de categorias pré-definidas
const predefinedCategories = {
  'alimentacao': { id: 'alimentacao', name: 'Alimentação', color: '#FF6B6B' },
  'transporte': { id: 'transporte', name: 'Transporte', color: '#4ECDC4' },
  'moradia': { id: 'moradia', name: 'Moradia', color: '#45B7D1' },
  'saude': { id: 'saude', name: 'Saúde', color: '#FFA07A' },
  'educacao': { id: 'educacao', name: 'Educação', color: '#98D8C8' },
  'lazer': { id: 'lazer', name: 'Lazer', color: '#F7DC6F' },
  'compras': { id: 'compras', name: 'Compras', color: '#BB8FCE' },
  'contas': { id: 'contas', name: 'Contas', color: '#85C1E9' },
  'salario': { id: 'salario', name: 'Salário', color: '#52C41A' },
  'freelance': { id: 'freelance', name: 'Freelance', color: '#1890FF' },
  'investimentos': { id: 'investimentos', name: 'Investimentos', color: '#722ED1' },
  'vendas': { id: 'vendas', name: 'Vendas', color: '#FA8C16' },
  'bonus': { id: 'bonus', name: 'Bônus', color: '#EB2F96' }
};

// --- FUNÇÕES AUXILIARES PARA PROJEÇÕES DE TRANSAÇÕES RECORRENTES ---

// Calcula a próxima data baseada na frequência
const getNextPaymentDate = (currentDate, frequency) => {
  const nextDate = new Date(currentDate);
  
  switch (frequency) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      return null;
  }
  
  return nextDate;
};

// Gera transações virtuais para um período específico
const generateVirtualRecurringTransactions = async (userId, startOfMonth, endOfMonth) => {
  // Buscar todas as subscriptions ativas do usuário
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      isActive: true,
      startDate: {
        lte: endOfMonth // Deve ter começado antes do fim do período
      }
    },
    include: {
      account: true
    }
  });

  const virtualTransactions = [];

  for (const subscription of subscriptions) {
    let currentPaymentDate = new Date(subscription.nextPaymentDate);
    
    // Se a próxima data de pagamento é anterior ao período, calcular a próxima dentro do período
    while (currentPaymentDate < startOfMonth) {
      currentPaymentDate = getNextPaymentDate(currentPaymentDate, subscription.frequency);
      if (!currentPaymentDate) break;
    }

    // Gerar transações virtuais para todas as ocorrências no período
    while (currentPaymentDate && currentPaymentDate <= endOfMonth) {
      // Verificar se não passou da data de fim (se definida)
      if (subscription.endDate && currentPaymentDate > subscription.endDate) {
        break;
      }

      // Criar transação virtual
      const virtualTransaction = {
        id: `virtual_${subscription.id}_${currentPaymentDate.getTime()}`,
        description: subscription.name,
        amount: subscription.amount,
        date: currentPaymentDate.toISOString(),
        type: subscription.type,
        userId: subscription.userId,
        categoryId: subscription.categoryId,
        accountId: subscription.accountId,
        isRecurring: true,
        subscriptionId: subscription.id,
        isVirtual: true, // Flag para identificar como virtual
        category: subscription.category,
        account: subscription.account,
        installments: []
      };

      virtualTransactions.push(virtualTransaction);

      // Calcular próxima data
      currentPaymentDate = getNextPaymentDate(currentPaymentDate, subscription.frequency);
    }
  }

  return virtualTransactions;
};

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

    // Validação adicional para categoryId se fornecido
    if (categoryId) {
      // Verificar se é uma categoria pré-definida válida
      if (!predefinedCategoryIds.includes(categoryId)) {
        // Se não é pré-definida, verificar se existe no banco
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
        });

        if (!category) {
          return res.status(404).json({ error: "Categoria não encontrada." });
        }

        if (category.userId !== userId) {
          return res.status(403).json({ error: "Acesso negado à categoria especificada." });
        }
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
      accountId,
      isRecurring: Boolean(isRecurring),
      subscriptionId,
    };
    
    // Always set categoryId when provided (both user and predefined categories)
    if (categoryId) {
      transactionData.categoryId = categoryId;
    }

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
        account: true, // Inclui os dados da conta na resposta
        subscription: true, // Include subscription info if linked
        installments: true, // Include installments if this is an installment plan
      },
    });

    // Add custom category info if categoryId points to a custom category
    if (categoryId && !predefinedCategoryIds.includes(categoryId)) {
      const customCategory = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      if (customCategory) {
        newTransaction.category = customCategory;
      }
    }

    // Create installment records if this is an installment plan
    if (isInstallmentPlan && installmentCount && installmentFrequency) {
      const count = parseInt(installmentCount);
      const installmentAmount = parseFloat(amount) / count;
      const firstDate = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date(date);
      
      const installments = [];
      let currentDueDate = new Date(firstDate);
      
      for (let i = 1; i <= count; i++) {
        if (i > 1) {
          // For the second installment onwards, add time to the previous date
          if (installmentFrequency === 'MONTHLY') {
            currentDueDate = addMonths(currentDueDate, 1);
          } else if (installmentFrequency === 'WEEKLY') {
            currentDueDate = addWeeks(currentDueDate, 1);
          }
        }
        
        installments.push({
          installmentNumber: i,
          amount: installmentAmount,
          dueDate: new Date(currentDueDate), // Create a new Date object to avoid reference issues
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
              account: true,
          subscription: true,
          installments: {
            orderBy: { installmentNumber: 'asc' }
          },
        },
      });
      
      // Add predefined category info to response if applicable
      if (categoryId && predefinedCategoryIds.includes(categoryId)) {
        updatedTransaction.predefinedCategory = predefinedCategories[categoryId];
      }
      
      return res.status(201).json(updatedTransaction);
    }

    // Add predefined category info to response if applicable
    if (categoryId && predefinedCategoryIds.includes(categoryId)) {
      newTransaction.predefinedCategory = predefinedCategories[categoryId];
    }
    
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("❌ DETAILED CREATE TRANSACTION ERROR:", error.message);
    console.error("❌ ERROR STACK:", error.stack);
    console.error("❌ REQUEST DATA:", req.body);
    res.status(500).json({ error: "Não foi possível criar a transação." });
  }
};

// --- LISTAR TODAS AS TRANSAÇÕES DO USUÁRIO (READ) ---
const getAllTransactions = async (req, res) => {
  try {
    // Debug log removed for cleaner output
    
    const userId = req.user?.id;
    
    // Check if user is properly authenticated
    if (!userId) {
      console.error("❌ CONTROLLER: No userId found");
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    
    const { accountId, month, year } = req.query; // Filtros opcionais

    // Constrói o filtro de busca
    let whereClause = { userId };
    if (accountId) {
      whereClause.accountId = accountId;
    }

    // Adiciona filtro de mês e ano se fornecidos
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      // Validações
      if (monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: "Mês deve estar entre 1 e 12." });
      }
      
      if (yearNum < 1900 || yearNum > 2100) {
        return res.status(400).json({ error: "Ano deve estar entre 1900 e 2100." });
      }

      // Criando início e fim do mês para filtro
      const startOfMonth = new Date(yearNum, monthNum - 1, 1); // Mês em JS é 0-indexed
      const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999); // Último dia do mês
      
      // Para filtro por período, precisa incluir:
      // 1. Transações não parceladas criadas no período
      // 2. Transações parceladas que tenham parcelas no período
      whereClause = {
        userId,
        ...(accountId && { accountId }),
        OR: [
          {
            // Transações não parceladas criadas no período
            isInstallmentPlan: false,
            date: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
          {
            // Transações parceladas que tenham parcelas no período
            isInstallmentPlan: true,
            installments: {
              some: {
                dueDate: {
                  gte: startOfMonth,
                  lte: endOfMonth
                }
              }
            }
          }
        ]
      };
      
    }
    

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: "desc" }, // Ordena da mais recente para a mais antiga
      include: { 
          account: true, // Inclui dados da conta
        installments: {
          orderBy: { installmentNumber: 'asc' }
        }, // Include installments for payment plan transactions
      },
    });

    // Fetch custom categories for transactions that have categoryId not in predefined list
    const transactionIds = transactions.map(t => t.id);
    const customCategoriesMap = {};
    
    if (transactionIds.length > 0) {
      // Get all unique custom category IDs from transactions
      const customCategoryIds = [...new Set(
        transactions
          .map(t => t.categoryId)
          .filter(id => id && !predefinedCategoryIds.includes(id))
      )];
      
      if (customCategoryIds.length > 0) {
        const customCategories = await prisma.category.findMany({
          where: { id: { in: customCategoryIds } }
        });
        
        // Create map from category ID to category object
        const categoryMap = {};
        customCategories.forEach(cat => {
          categoryMap[cat.id] = cat;
        });
        
        // Map transactions to their custom categories
        transactions.forEach(t => {
          if (t.categoryId && categoryMap[t.categoryId]) {
            customCategoriesMap[t.id] = categoryMap[t.categoryId];
          }
        });
      }
    }


    // Se há filtro de mês/ano, incluir transações virtuais recorrentes
    let allTransactions = transactions;
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      const startOfMonth = new Date(yearNum, monthNum - 1, 1);
      const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
      
      const virtualTransactions = await generateVirtualRecurringTransactions(userId, startOfMonth, endOfMonth);
      
      // Combinar transações reais e virtuais
      allTransactions = [...transactions, ...virtualTransactions];
      
      // Reordenar por data
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Add category info to transactions (both predefined and custom categories)
    const transactionsWithCategories = allTransactions.map(transaction => {
      // If transaction has a categoryId that matches a predefined category, add the predefined category info
      if (transaction.categoryId && predefinedCategoryIds.includes(transaction.categoryId)) {
        transaction.predefinedCategory = predefinedCategories[transaction.categoryId];
      }
      // If transaction has a custom category, add it from our map
      else if (transaction.categoryId && customCategoriesMap[transaction.id]) {
        transaction.category = customCategoriesMap[transaction.id];
      }
      
      return transaction;
    });

    res.status(200).json(transactionsWithCategories);
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
          account: true, // Inclui dados da conta
      },
    });

    // Add predefined category info to response if applicable
    if (updatedTransaction.categoryId && predefinedCategoryIds.includes(updatedTransaction.categoryId)) {
      updatedTransaction.predefinedCategory = predefinedCategories[updatedTransaction.categoryId];
    }
    // If transaction has a custom category, fetch it from database
    else if (updatedTransaction.categoryId && !predefinedCategoryIds.includes(updatedTransaction.categoryId)) {
      const customCategory = await prisma.category.findUnique({
        where: { id: updatedTransaction.categoryId }
      });
      if (customCategory) {
        updatedTransaction.category = customCategory;
      }
    }

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

    // Buscar todas as transações de receita com dados de parcelamento
    const incomeTransactions = await prisma.transaction.findMany({
      where: { 
        userId, 
        type: TransactionType.RECEITA 
      },
      select: {
        amount: true,
        isInstallmentPlan: true,
        installments: {
          select: {
            amount: true
          }
        }
      }
    });

    // Buscar todas as transações de despesa com dados de parcelamento
    const expenseTransactions = await prisma.transaction.findMany({
      where: { 
        userId, 
        type: TransactionType.DESPESA 
      },
      select: {
        amount: true,
        isInstallmentPlan: true,
        installments: {
          select: {
            amount: true
          }
        }
      }
    });

    // Calcular totais considerando parcelas
    let totalIncomeAmount = 0;
    incomeTransactions.forEach(transaction => {
      if (transaction.isInstallmentPlan) {
        // Para transações parceladas, somar todas as parcelas
        totalIncomeAmount += transaction.installments.reduce((sum, installment) => sum + installment.amount, 0);
      } else {
        // Para transações não parceladas, usar o valor total
        totalIncomeAmount += transaction.amount;
      }
    });

    let totalExpensesAmount = 0;
    expenseTransactions.forEach(transaction => {
      if (transaction.isInstallmentPlan) {
        // Para transações parceladas, somar todas as parcelas
        totalExpensesAmount += transaction.installments.reduce((sum, installment) => sum + installment.amount, 0);
      } else {
        // Para transações não parceladas, usar o valor total
        totalExpensesAmount += transaction.amount;
      }
    });

    // Busca as últimas transações
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
      include: { }
    });

    // Calcula resumo do mês atual
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Buscar transações do mês atual considerando parcelas
    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      select: {
        amount: true,
        type: true,
        isInstallmentPlan: true,
        installments: {
          where: {
            dueDate: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
          select: {
            amount: true
          }
        }
      }
    });

    // Calcular resumo mensal considerando lógica de parcelas
    let monthlyIncomeAmount = 0;
    let monthlyExpensesAmount = 0;
    
    monthlyTransactions.forEach(transaction => {
      let amountToAdd = 0;
      
      if (transaction.isInstallmentPlan && transaction.installments.length > 0) {
        // Para transações parceladas, somar apenas as parcelas que vencem no mês
        amountToAdd = transaction.installments.reduce((sum, installment) => sum + installment.amount, 0);
      } else if (!transaction.isInstallmentPlan) {
        // Para transações não parceladas, usar o valor total
        amountToAdd = transaction.amount;
      }
      
      if (transaction.type === 'RECEITA') {
        monthlyIncomeAmount += amountToAdd;
      } else if (transaction.type === 'DESPESA') {
        monthlyExpensesAmount += amountToAdd;
      }
    });

    const summary = {
      totalIncome: totalIncomeAmount,
      totalExpenses: totalExpensesAmount,
      balance: totalIncomeAmount - totalExpensesAmount,
      recentTransactions,
      monthly: {
        income: monthlyIncomeAmount,
        expenses: monthlyExpensesAmount,
        balance: monthlyIncomeAmount - monthlyExpensesAmount
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

// --- RESUMO FINANCEIRO MENSAL ---
const getSummary = async (req, res) => {
  try {
    
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    
    const { month, year } = req.query;
    
    // Se mês e ano não foram fornecidos, usar mês/ano atual
    const currentDate = new Date();
    const monthNum = month ? parseInt(month) : currentDate.getMonth() + 1;
    const yearNum = year ? parseInt(year) : currentDate.getFullYear();
    
    // Validações
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: "Mês deve estar entre 1 e 12." });
    }
    
    if (yearNum < 1900 || yearNum > 2100) {
      return res.status(400).json({ error: "Ano deve estar entre 1900 e 2100." });
    }
    
    // Criando início e fim do mês para filtro
    const startOfMonth = new Date(yearNum, monthNum - 1, 1);
    const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    
    // ===== CORREÇÃO CRÍTICA: NOVA LÓGICA DE CÁLCULO =====
    // Agora o cálculo principal será baseado na tabela TransactionInstallment
    
    // 1. Buscar todas as parcelas que vencem no período
    const installmentsInPeriod = await prisma.transactionInstallment.findMany({
      where: {
        dueDate: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        transaction: {
          userId: userId
        }
      },
      include: {
        transaction: {
          select: {
            type: true,
            userId: true
          }
        }
      }
    });

    // 2. Buscar transações não parceladas criadas no período
    const nonInstallmentTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        isInstallmentPlan: false,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      select: {
        amount: true,
        type: true
      }
    });
    
    // 3. Gerar transações virtuais recorrentes para o período
    const virtualTransactions = await generateVirtualRecurringTransactions(userId, startOfMonth, endOfMonth);

    // 4. Calcular totais usando a nova lógica
    let totalIncome = 0;
    let totalExpenses = 0;
    
    // Somar parcelas que vencem no período (apenas o valor da parcela individual)
    installmentsInPeriod.forEach(installment => {
      if (installment.transaction.type === 'RECEITA') {
        totalIncome += installment.amount;
      } else if (installment.transaction.type === 'DESPESA') {
        totalExpenses += installment.amount;
      }
      // PAGO é ignorado no cálculo de resumo
    });
    
    // Somar transações não parceladas
    nonInstallmentTransactions.forEach(transaction => {
      if (transaction.type === 'RECEITA') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'DESPESA') {
        totalExpenses += transaction.amount;
      }
      // PAGO é ignorado no cálculo de resumo
    });
    
    // Somar transações virtuais (recorrentes)
    virtualTransactions.forEach(transaction => {
      if (transaction.type === 'RECEITA') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'DESPESA') {
        totalExpenses += transaction.amount;
      }
    });
    
    const balance = totalIncome - totalExpenses;
    
    const totalTransactionCount = installmentsInPeriod.length + nonInstallmentTransactions.length + virtualTransactions.length;
    
    const summary = {
      period: {
        month: monthNum,
        year: yearNum,
        monthName: new Date(yearNum, monthNum - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })
      },
      totalIncome,
      totalExpenses,
      balance,
      transactionCount: totalTransactionCount
    };
    
    res.status(200).json(summary);
    
  } catch (error) {
    console.error("❌ CONTROLLER ERROR getSummary:", error);
    res.status(500).json({ error: "Não foi possível gerar resumo financeiro." });
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
  getSummary,
};
