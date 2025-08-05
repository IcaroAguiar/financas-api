const prisma = require("../lib/prisma");

// Helper function to calculate debt fields
const calculateDebtFields = (debt) => {
  const paidAmount = debt.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const remainingAmount = debt.totalAmount - paidAmount;
  const calculatedStatus = remainingAmount <= 0 ? 'PAGA' : 'PENDENTE';
  
  return {
    ...debt,
    paidAmount,
    remainingAmount,
    status: calculatedStatus,
  };
};

// Listar todas as dívidas do usuário logado
const getAllDebts = async (req, res) => {
  try {
    const userId = req.user.id; // ID do usuário logado
    
    const debts = await prisma.debt.findMany({
      where: {
        debtor: {
          userId // FILTRO CRÍTICO: apenas dívidas cujos devedores pertencem ao usuário logado
        }
      },
      include: { debtor: true, payments: true }
    });
    
    // Add calculated fields to each debt
    const debtsWithCalculatedFields = debts.map(calculateDebtFields);
    
    res.json(debtsWithCalculatedFields);
  } catch (err) {
    console.error("Erro ao buscar dívidas:", err);
    res.status(500).json({ error: 'Erro ao buscar dívidas' });
  }
};

// Criar dívida (apenas para devedores do usuário logado)
const createDebt = async (req, res) => {
  const { description, totalAmount, dueDate, debtorId } = req.body;
  const userId = req.user.id;
  
  try {
    // Validação
    if (!description || !totalAmount || !dueDate || !debtorId) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    
    // VERIFICAÇÃO CRÍTICA: O devedor pertence ao usuário logado?
    const debtor = await prisma.debtor.findFirst({
      where: {
        id: debtorId,
        userId // Só pode criar dívida para seus próprios devedores
      }
    });
    
    if (!debtor) {
      return res.status(404).json({ error: 'Devedor não encontrado ou não pertence a você.' });
    }
    
    const newDebt = await prisma.debt.create({
      data: {
        description,
        totalAmount: parseFloat(totalAmount),
        dueDate: new Date(dueDate),
        debtorId,
        status: 'PENDENTE'
      },
      include: { debtor: true, payments: true }
    });
    
    // Add calculated fields
    const debtWithCalculatedFields = calculateDebtFields(newDebt);
    
    res.status(201).json(debtWithCalculatedFields);
  } catch (err) {
    console.error("Erro ao criar dívida:", err);
    res.status(500).json({ error: 'Erro ao criar dívida' });
  }
};

// Atualizar dívida (apenas se pertencer ao usuário logado)
const updateDebt = async (req, res) => {
  const { id } = req.params;
  const { description, totalAmount, dueDate, status } = req.body;
  const userId = req.user.id;
  
  try {
    // VERIFICAÇÃO CRÍTICA: A dívida pertence ao usuário logado?
    const debt = await prisma.debt.findFirst({
      where: {
        id,
        debtor: {
          userId // Só pode atualizar dívidas cujos devedores são seus
        }
      },
      include: { debtor: true }
    });
    
    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada ou não pertence a você.' });
    }
    
    const updated = await prisma.debt.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(totalAmount && { totalAmount: parseFloat(totalAmount) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(status && { status })
      },
      include: { debtor: true, payments: true }
    });
    
    // Add calculated fields
    const debtWithCalculatedFields = calculateDebtFields(updated);
    
    res.json(debtWithCalculatedFields);
  } catch (err) {
    console.error("Erro ao atualizar dívida:", err);
    res.status(500).json({ error: 'Erro ao atualizar dívida' });
  }
};

// Deletar dívida (apenas se pertencer ao usuário logado)
const deleteDebt = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    // VERIFICAÇÃO CRÍTICA: A dívida pertence ao usuário logado?
    const debt = await prisma.debt.findFirst({
      where: {
        id,
        debtor: {
          userId // Só pode deletar dívidas cujos devedores são seus
        }
      }
    });
    
    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada ou não pertence a você.' });
    }
    
    await prisma.debt.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("Erro ao deletar dívida:", err);
    res.status(500).json({ error: 'Erro ao deletar dívida' });
  }
};

// Buscar dívida por ID (apenas se pertencer ao usuário logado)
const getDebtById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    const debt = await prisma.debt.findFirst({
      where: {
        id,
        debtor: {
          userId // FILTRO CRÍTICO: só busca dívidas cujos devedores pertencem ao usuário
        }
      },
      include: { debtor: true, payments: true },
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    // Add calculated fields to the debt
    const debtWithCalculatedFields = calculateDebtFields(debt);
    
    res.json(debtWithCalculatedFields);
  } catch (err) {
    console.error("Erro ao buscar dívida:", err);
    res.status(500).json({ error: 'Erro ao buscar dívida' });
  }
};

// Listar dívidas por status do usuário logado (calculado)
const getDebtsByStatus = async (req, res) => {
  const { status } = req.params; // status = "PENDENTE" ou "PAGA"
  const userId = req.user.id;

  if (!['PENDENTE', 'PAGA'].includes(status.toUpperCase())) {
    return res.status(400).json({ error: 'Status inválido. Use PENDENTE ou PAGA.' });
  }

  try {
    // Get all debts for the user and filter by calculated status
    const debts = await prisma.debt.findMany({
      where: {
        debtor: {
          userId // FILTRO CRÍTICO: apenas dívidas cujos devedores pertencem ao usuário
        }
      },
      include: { debtor: true, payments: true },
    });
    
    // Add calculated fields and filter by calculated status
    const debtsWithCalculatedFields = debts.map(calculateDebtFields);
    const filteredDebts = debtsWithCalculatedFields.filter(debt => debt.status === status.toUpperCase());
    
    res.json(filteredDebts);
  } catch (err) {
    console.error("Erro ao buscar dívidas por status:", err);
    res.status(500).json({ error: 'Erro ao buscar dívidas por status' });
  }
};


module.exports = {
  getAllDebts,
  createDebt,
  updateDebt,
  deleteDebt,
  getDebtById,
  getDebtsByStatus,
};