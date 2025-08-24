const prisma = require("../lib/prisma");

// Helper function to calculate debt fields
const calculateDebtFields = (debt) => {
  const paidAmount = debt.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const remainingAmount = debt.totalAmount - paidAmount;
  const calculatedStatus = remainingAmount <= 0 ? 'PAGA' : 'PENDENTE';
  
  // Only auto-calculate status if it's not manually set to PAGA
  // This allows manual status overrides while still calculating for payment-based status
  const finalStatus = debt.status === 'PAGA' ? 'PAGA' : calculatedStatus;
  
  return {
    ...debt,
    paidAmount,
    remainingAmount,
    status: finalStatus,
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
      include: { 
        debtor: true, 
        payments: true,
        category: true,
        account: true
      }
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
  const { description, totalAmount, dueDate, debtorId, categoryId, accountId } = req.body;
  const userId = req.user.id;
  
  try {
    // Write to file for debugging since console logs aren't showing
    const fs = require('fs');
    const debugLog = {
      timestamp: new Date().toISOString(),
      requestBody: req.body,
      extractedFields: { description, totalAmount, dueDate, debtorId, categoryId, accountId, userId }
    };
    fs.writeFileSync('debt-debug.json', JSON.stringify(debugLog, null, 2));
    
    console.log('🐛 DEBT CREATION DEBUG - Full request body:', JSON.stringify(req.body, null, 2));
    console.log('🐛 DEBT CREATION DEBUG - Extracted fields:', {
      description: `"${description}"`,
      totalAmount: totalAmount,
      totalAmountType: typeof totalAmount,
      dueDate: dueDate,
      dueDateType: typeof dueDate,
      debtorId: `"${debtorId}"`,
      categoryId: `"${categoryId}"`,
      accountId: `"${accountId}"`,
      userId: `"${userId}"`
    });
    
    // Validação (dueDate is now optional)
    console.log('🐛 DEBT CREATION DEBUG - Validation checks:', {
      hasDescription: !!description,
      descriptionCheck: !description,
      descriptionTrimmed: description?.trim?.(),
      hasTotalAmount: totalAmount !== undefined && totalAmount !== null,
      totalAmountUndefined: totalAmount === undefined,
      totalAmountNull: totalAmount === null,
      totalAmountValue: totalAmount,
      totalAmountType: typeof totalAmount,
      hasDebtorId: !!debtorId,
      debtorIdCheck: !debtorId,
      debtorIdTrimmed: debtorId?.trim?.()
    });
    
    // More detailed validation check
    const validationFailed = !description || totalAmount === undefined || totalAmount === null || !debtorId;
    console.log('🐛 DEBT CREATION DEBUG - Overall validation failed?', validationFailed);
    
    if (validationFailed) {
      console.log('❌ DEBT CREATION DEBUG - Validation FAILED - Details:');
      console.log('❌ Description check (!description):', !description);
      console.log('❌ TotalAmount undefined check:', totalAmount === undefined);
      console.log('❌ TotalAmount null check:', totalAmount === null);
      console.log('❌ DebtorId check (!debtorId):', !debtorId);
      return res.status(400).json({ 
        error: 'Descrição, valor e devedor são obrigatórios.',
        debug: {
          description: !!description,
          totalAmount: totalAmount,
          totalAmountType: typeof totalAmount,
          debtorId: !!debtorId,
          rawBody: req.body
        }
      });
    }
    
    console.log('✅ DEBT CREATION DEBUG - Validation PASSED');
    
    // VERIFICAÇÃO CRÍTICA: O devedor pertence ao usuário logado?
    console.log('🐛 DEBT CREATION DEBUG - Looking for debtor with:', { debtorId, userId });
    const debtor = await prisma.debtor.findFirst({
      where: {
        id: debtorId,
        userId // Só pode criar dívida para seus próprios devedores
      }
    });
    
    console.log('🐛 DEBT CREATION DEBUG - Found debtor:', debtor ? 'YES' : 'NO');
    if (!debtor) {
      console.log('❌ DEBT CREATION DEBUG - Debtor not found or not owned by user');
      return res.status(404).json({ error: 'Devedor não encontrado ou não pertence a você.' });
    }
    
    // Verificar se a categoria pertence ao usuário (se fornecida)
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId }
      });
      if (!category) {
        return res.status(400).json({ error: 'Categoria não encontrada ou não pertence ao usuário.' });
      }
    }
    
    // Verificar se a conta pertence ao usuário (se fornecida)
    if (accountId) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId }
      });
      if (!account) {
        return res.status(400).json({ error: 'Conta não encontrada ou não pertence ao usuário.' });
      }
    }
    
    console.log('🐛 DEBT CREATION DEBUG - Parsing amount:', totalAmount);
    const parsedAmount = parseFloat(totalAmount);
    console.log('🐛 DEBT CREATION DEBUG - Parsed amount:', parsedAmount);
    
    const debtData = {
      description,
      totalAmount: parsedAmount,
      debtorId,
      categoryId,
      accountId,
      status: 'PENDENTE'
    };

    // Handle dueDate - accept null, undefined, or valid date string
    console.log('🐛 DEBT CREATION DEBUG - Processing dueDate:', dueDate, typeof dueDate);
    if (dueDate === null || dueDate === undefined || dueDate === '') {
      console.log('🐛 DEBT CREATION DEBUG - Setting dueDate to null (was null/undefined/empty)');
      debtData.dueDate = null;
    } else if (typeof dueDate === 'string' && dueDate.trim().length > 0) {
      console.log('🐛 DEBT CREATION DEBUG - Parsing dueDate string:', dueDate);
      try {
        const parsedDate = new Date(dueDate.trim());
        if (isNaN(parsedDate.getTime())) {
          console.log('❌ DEBT CREATION DEBUG - Invalid date format:', dueDate);
          return res.status(400).json({ error: 'Data de vencimento inválida.' });
        }
        debtData.dueDate = parsedDate;
        console.log('🐛 DEBT CREATION DEBUG - Parsed dueDate:', debtData.dueDate);
      } catch (dateError) {
        console.log('❌ DEBT CREATION DEBUG - Date parsing error:', dateError);
        return res.status(400).json({ error: 'Data de vencimento inválida.' });
      }
    } else {
      console.log('🐛 DEBT CREATION DEBUG - Setting dueDate to null (fallback)');
      debtData.dueDate = null;
    }
    
    console.log('🐛 DEBT CREATION DEBUG - Final debt data:', JSON.stringify(debtData, null, 2));

    console.log('🐛 DEBT CREATION DEBUG - Creating debt in database...');
    const newDebt = await prisma.debt.create({
      data: debtData,
      include: { 
        debtor: true, 
        payments: true,
        category: true,
        account: true
      }
    });
    console.log('✅ DEBT CREATION DEBUG - Debt created successfully:', newDebt.id);
    
    // Add calculated fields
    const debtWithCalculatedFields = calculateDebtFields(newDebt);
    console.log('✅ DEBT CREATION DEBUG - Sending response');
    
    res.status(201).json(debtWithCalculatedFields);
  } catch (err) {
    console.error("Erro ao criar dívida:", err);
    res.status(500).json({ error: 'Erro ao criar dívida' });
  }
};

// Atualizar dívida (apenas se pertencer ao usuário logado)
const updateDebt = async (req, res) => {
  const { id } = req.params;
  const { description, totalAmount, dueDate, status, categoryId, accountId } = req.body;
  const userId = req.user.id;
  
  console.log('🔧 UPDATE DEBT DEBUG - Request params:', { id });
  console.log('🔧 UPDATE DEBT DEBUG - Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔧 UPDATE DEBT DEBUG - User ID:', userId);
  
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
    
    // Verificar se a categoria pertence ao usuário (se fornecida)
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId }
      });
      if (!category) {
        return res.status(400).json({ error: 'Categoria não encontrada ou não pertence ao usuário.' });
      }
    }
    
    // Verificar se a conta pertence ao usuário (se fornecida)
    if (accountId) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId }
      });
      if (!account) {
        return res.status(400).json({ error: 'Conta não encontrada ou não pertence ao usuário.' });
      }
    }
    
    // Build update data object
    const updateData = {
      ...(description && { description }),
      ...(totalAmount && { totalAmount: parseFloat(totalAmount) }),
      ...(status && { status }),
      ...(categoryId !== undefined && { categoryId }),
      ...(accountId !== undefined && { accountId }),
      // Handle installment fields
      ...(req.body.isInstallment !== undefined && { isInstallment: req.body.isInstallment }),
      ...(req.body.installmentCount && { installmentCount: parseInt(req.body.installmentCount) }),
      ...(req.body.installmentFrequency && { installmentFrequency: req.body.installmentFrequency }),
      // Handle notification field
      ...(req.body.notificationId !== undefined && { notificationId: req.body.notificationId })
    };

    // Handle dueDate separately with proper validation
    if (dueDate !== undefined) {
      console.log('🔧 Processing dueDate:', dueDate, typeof dueDate);
      if (dueDate === null || dueDate === '' || (typeof dueDate === 'string' && dueDate.trim() === '')) {
        console.log('🔧 Setting dueDate to null (empty/null value)');
        updateData.dueDate = null;
      } else if (typeof dueDate === 'string' && dueDate.trim().length > 0) {
        try {
          const parsedDate = new Date(dueDate.trim());
          if (isNaN(parsedDate.getTime())) {
            console.log('🔧 Invalid date string, setting to null:', dueDate);
            updateData.dueDate = null;
          } else {
            console.log('🔧 Valid date parsed:', parsedDate);
            updateData.dueDate = parsedDate;
          }
        } catch (dateError) {
          console.log('🔧 Date parsing error, setting to null:', dateError);
          updateData.dueDate = null;
        }
      } else {
        console.log('🔧 Setting dueDate to null (fallback)');
        updateData.dueDate = null;
      }
    }
    
    console.log('🔧 UPDATE DEBT DEBUG - Update data:', JSON.stringify(updateData, null, 2));
    
    const updated = await prisma.debt.update({
      where: { id },
      data: updateData,
      include: { 
        debtor: true, 
        payments: true,
        category: true,
        account: true
      }
    });
    
    // Add calculated fields
    const debtWithCalculatedFields = calculateDebtFields(updated);
    
    res.json(debtWithCalculatedFields);
  } catch (err) {
    console.error("🚨 UPDATE DEBT ERROR - Full error:", err);
    console.error("🚨 UPDATE DEBT ERROR - Error message:", err.message);
    console.error("🚨 UPDATE DEBT ERROR - Error code:", err.code);
    console.error("🚨 UPDATE DEBT ERROR - Stack trace:", err.stack);
    res.status(500).json({ 
      error: 'Erro ao atualizar dívida',
      details: err.message,
      code: err.code
    });
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
      include: { 
        debtor: true, 
        payments: true,
        category: true,
        account: true
      },
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
      include: { 
        debtor: true, 
        payments: true,
        category: true,
        account: true
      },
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