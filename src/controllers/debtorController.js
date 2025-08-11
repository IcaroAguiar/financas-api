const prisma = require("../lib/prisma");

// Listar todos os devedores do usuário logado
const getAllDebtors = async (req, res) => {
  try {
    const userId = req.user.id; // ID do usuário logado vem do middleware de autenticação
    
    const debtors = await prisma.debtor.findMany({
      where: { userId }, // FILTRO CRÍTICO: apenas devedores do usuário logado
      include: {
        debts: {
          include: {
            payments: true
          }
        }
      }
    });
    
    res.json(debtors);
  } catch (err) {
    console.error("❌ DETAILED ERROR in getAllDebtors:", err.message);
    console.error("❌ ERROR STACK:", err.stack);
    console.error("❌ USER ID:", req.user?.id);
    res.status(500).json({ error: 'Erro ao buscar devedores' });
  }
};

// Criar devedor para o usuário logado
const createDebtor = async (req, res) => {
  const { name, email, phone } = req.body;
  const userId = req.user.id; // ID do usuário logado
  
  try {
    // Validação
    if (!name) {
      return res.status(400).json({ error: 'O nome do devedor é obrigatório.' });
    }
    
    const newDebtor = await prisma.debtor.create({
      data: { 
        name, 
        email, 
        phone,
        userId // CRÍTICO: associa o devedor ao usuário logado
      },
    });
    
    res.status(201).json(newDebtor);
  } catch (err) {
    console.error("❌ DETAILED CREATE ERROR:", err.message);
    console.error("❌ ERROR STACK:", err.stack);
    console.error("❌ USER ID:", userId);
    console.error("❌ REQUEST BODY:", req.body);
    res.status(500).json({ error: 'Erro ao criar devedor' });
  }
};

// Atualizar devedor (apenas se pertencer ao usuário logado)
const updateDebtor = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  const userId = req.user.id;
  
  console.log('🔧 updateDebtor called with:', {
    id,
    name,
    email,
    phone,
    userId
  });
  
  try {
    // Verificação de segurança: devedor pertence ao usuário?
    console.log('🔧 Looking for debtor with ID:', id);
    const debtor = await prisma.debtor.findUnique({ where: { id } });
    console.log('🔧 Found debtor:', debtor);
    
    if (!debtor) {
      console.log('🔧 Debtor not found');
      return res.status(404).json({ error: 'Devedor não encontrado.' });
    }
    
    console.log('🔧 Debtor userId:', debtor.userId, 'Current userId:', userId);
    if (debtor.userId !== userId) {
      console.log('🔧 Access denied - userId mismatch');
      return res.status(403).json({ error: 'Acesso negado. Você não pode modificar este devedor.' });
    }
    
    console.log('🔧 Updating debtor with data:', { name, email, phone });
    const updated = await prisma.debtor.update({
      where: { id },
      data: { name, email, phone },
    });
    
    console.log('🔧 Debtor updated successfully:', updated);
    res.json(updated);
  } catch (err) {
    console.error("❌ DETAILED UPDATE ERROR:", err.message);
    console.error("❌ ERROR STACK:", err.stack);
    console.error("❌ USER ID:", userId);
    console.error("❌ DEBTOR ID:", id);
    console.error("❌ REQUEST BODY:", req.body);
    res.status(500).json({ error: 'Erro ao atualizar devedor' });
  }
};

// Listar dívidas pelo ID do devedor (apenas se o devedor pertencer ao usuário logado)
const getDebtsByDebtorId = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const debtor = await prisma.debtor.findFirst({
      where: { 
        id,
        userId // FILTRO CRÍTICO: apenas se o devedor pertence ao usuário logado
      },
      include: {
        debts: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!debtor) {
      return res.status(404).json({ error: 'Devedor não encontrado.' });
    }

    res.json(debtor.debts);
  } catch (err) {
    console.error("Erro ao buscar dívidas do devedor:", err);
    res.status(500).json({ error: 'Erro ao buscar dívidas do devedor.' });
  }
};

// Deletar devedor (apenas se pertencer ao usuário logado)
const deleteDebtor = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    // Verificação de segurança: devedor pertence ao usuário?
    const debtor = await prisma.debtor.findUnique({ where: { id } });
    
    if (!debtor) {
      return res.status(404).json({ error: 'Devedor não encontrado.' });
    }
    
    if (debtor.userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado. Você não pode deletar este devedor.' });
    }
    
    await prisma.debtor.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("Erro ao deletar devedor:", err);
    res.status(500).json({ error: 'Erro ao deletar devedor' });
  }
};

module.exports = {
    getAllDebtors,
    createDebtor,
    updateDebtor,
    getDebtsByDebtorId,
    deleteDebtor,
};