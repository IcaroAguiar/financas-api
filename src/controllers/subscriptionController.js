const prisma = require("../lib/prisma");

// Utility function to calculate next payment date
const calculateNextPaymentDate = (startDate, frequency, lastProcessedAt = null) => {
  const baseDate = lastProcessedAt ? new Date(lastProcessedAt) : new Date(startDate);
  const nextDate = new Date(baseDate);
  
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
      throw new Error('Frequência de assinatura inválida');
  }
  
  return nextDate;
};

// Listar todas as assinaturas do usuário
const getSubscriptions = async (req, res) => {
  const userId = req.user.id;

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        category: true,
        account: true,
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add computed fields
    const subscriptionsWithDetails = subscriptions.map(subscription => ({
      ...subscription,
      isOverdue: subscription.isActive && new Date(subscription.nextPaymentDate) < new Date(),
      transactionCount: subscription._count.transactions
    }));

    res.json(subscriptionsWithDetails);
  } catch (err) {
    console.error('Erro ao buscar assinaturas:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao buscar assinaturas.' });
  }
};

// Buscar assinatura específica
const getSubscriptionById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { id, userId },
      include: {
        category: true,
        account: true,
        transactions: {
          orderBy: { date: 'desc' },
          take: 10 // Last 10 transactions
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada.' });
    }

    res.json(subscription);
  } catch (err) {
    console.error('Erro ao buscar assinatura:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao buscar assinatura.' });
  }
};

// Criar nova assinatura
const createSubscription = async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    description,
    amount,
    type,
    frequency,
    startDate,
    endDate,
    categoryId,
    accountId
  } = req.body;

  try {
    // Validar campos obrigatórios
    if (!name || !amount || !type || !frequency || !startDate) {
      return res.status(400).json({ 
        error: 'Nome, valor, tipo, frequência e data de início são obrigatórios.' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'O valor deve ser maior que zero.' });
    }

    // Validar se categoria existe (se fornecida)
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId }
      });
      if (!category) {
        return res.status(400).json({ error: 'Categoria não encontrada.' });
      }
    }

    // Validar se conta existe (se fornecida)
    if (accountId) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId }
      });
      if (!account) {
        return res.status(400).json({ error: 'Conta não encontrada.' });
      }
    }

    // Verificar se já existe assinatura com o mesmo nome
    const existingSubscription = await prisma.subscription.findFirst({
      where: { name, userId }
    });
    if (existingSubscription) {
      return res.status(400).json({ error: 'Já existe uma assinatura com este nome.' });
    }

    // Calcular próxima data de pagamento
    const nextPaymentDate = calculateNextPaymentDate(startDate, frequency);

    // Criar assinatura
    const subscription = await prisma.subscription.create({
      data: {
        name,
        description,
        amount: parseFloat(amount),
        type,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        nextPaymentDate,
        userId,
        categoryId,
        accountId
      },
      include: {
        category: true,
        account: true
      }
    });

    res.status(201).json(subscription);
  } catch (err) {
    console.error('Erro ao criar assinatura:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao criar assinatura.' });
  }
};

// Atualizar assinatura
const updateSubscription = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    name,
    description,
    amount,
    type,
    frequency,
    startDate,
    endDate,
    isActive,
    categoryId,
    accountId
  } = req.body;

  try {
    // Verificar se assinatura existe e pertence ao usuário
    const existingSubscription = await prisma.subscription.findFirst({
      where: { id, userId }
    });

    if (!existingSubscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada.' });
    }

    // Validar valor se fornecido
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({ error: 'O valor deve ser maior que zero.' });
    }

    // Verificar nome duplicado se mudou
    if (name && name !== existingSubscription.name) {
      const duplicateName = await prisma.subscription.findFirst({
        where: { name, userId, id: { not: id } }
      });
      if (duplicateName) {
        return res.status(400).json({ error: 'Já existe uma assinatura com este nome.' });
      }
    }

    // Preparar dados para atualização
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (type !== undefined) updateData.type = type;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (accountId !== undefined) updateData.accountId = accountId;

    // Recalcular próxima data de pagamento se frequência ou data inicial mudaram
    if (frequency !== undefined || startDate !== undefined) {
      const newFrequency = frequency || existingSubscription.frequency;
      const newStartDate = startDate || existingSubscription.startDate;
      updateData.nextPaymentDate = calculateNextPaymentDate(
        newStartDate, 
        newFrequency, 
        existingSubscription.lastProcessedAt
      );
    }

    // Atualizar assinatura
    const subscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        account: true
      }
    });

    res.json(subscription);
  } catch (err) {
    console.error('Erro ao atualizar assinatura:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao atualizar assinatura.' });
  }
};

// Deletar assinatura
const deleteSubscription = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Verificar se assinatura existe e pertence ao usuário
    const subscription = await prisma.subscription.findFirst({
      where: { id, userId }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada.' });
    }

    // Deletar assinatura (transações relacionadas mantêm a referência)
    await prisma.subscription.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (err) {
    console.error('Erro ao deletar assinatura:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao deletar assinatura.' });
  }
};

// Pausar/Despausar assinatura
const toggleSubscriptionStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { id, userId }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada.' });
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: { isActive: !subscription.isActive },
      include: {
        category: true,
        account: true
      }
    });

    res.json(updatedSubscription);
  } catch (err) {
    console.error('Erro ao alterar status da assinatura:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao alterar status da assinatura.' });
  }
};

// Processar assinaturas (gerar transações automáticas)
const processSubscriptions = async (req, res) => {
  const userId = req.user.id;

  try {
    const now = new Date();
    
    // Buscar assinaturas ativas que precisam ser processadas
    const subscriptionsToProcess = await prisma.subscription.findMany({
      where: {
        userId,
        isActive: true,
        nextPaymentDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      },
      include: {
        category: true,
        account: true
      }
    });

    const processedSubscriptions = [];
    const createdTransactions = [];

    for (const subscription of subscriptionsToProcess) {
      try {
        // Criar transação
        const transaction = await prisma.transaction.create({
          data: {
            description: `${subscription.name} - Cobrança automática`,
            amount: subscription.amount,
            date: subscription.nextPaymentDate,
            type: subscription.type,
            isRecurring: true,
            userId: subscription.userId,
            categoryId: subscription.categoryId,
            accountId: subscription.accountId,
            subscriptionId: subscription.id
          },
          include: {
            category: true,
            account: true,
            subscription: true
          }
        });

        // Calcular próxima data de pagamento
        const nextPaymentDate = calculateNextPaymentDate(
          subscription.startDate,
          subscription.frequency,
          subscription.nextPaymentDate
        );

        // Atualizar assinatura
        const updatedSubscription = await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            nextPaymentDate,
            lastProcessedAt: subscription.nextPaymentDate
          }
        });

        processedSubscriptions.push(updatedSubscription);
        createdTransactions.push(transaction);
      } catch (subscriptionError) {
        console.error(`Erro ao processar assinatura ${subscription.id}:`, subscriptionError);
      }
    }

    res.json({
      message: `${processedSubscriptions.length} assinaturas processadas com sucesso.`,
      processedCount: processedSubscriptions.length,
      createdTransactions: createdTransactions.length,
      subscriptions: processedSubscriptions
    });
  } catch (err) {
    console.error('Erro ao processar assinaturas:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao processar assinaturas.' });
  }
};

// Buscar assinaturas que vencerão em breve
const getUpcomingSubscriptions = async (req, res) => {
  const userId = req.user.id;
  const { days = 7 } = req.query; // Próximos 7 dias por padrão

  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + parseInt(days));

    const upcomingSubscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        isActive: true,
        nextPaymentDate: {
          gte: now,
          lte: futureDate
        }
      },
      include: {
        category: true,
        account: true
      },
      orderBy: { nextPaymentDate: 'asc' }
    });

    res.json(upcomingSubscriptions);
  } catch (err) {
    console.error('Erro ao buscar assinaturas próximas:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao buscar assinaturas próximas.' });
  }
};

module.exports = {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  toggleSubscriptionStatus,
  processSubscriptions,
  getUpcomingSubscriptions
};