const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar todas as dívidas
const getAllDebts = async (req, res) => {
  try {
    const debts = await prisma.debt.findMany({
      include: { debtor: true, payments: true }
    });
    res.json(debts);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dívidas' });
  }
};

// Criar dívida (status padrão será "PENDENTE")
const createDebt = async (req, res) => {
  const { description, totalAmount, dueDate, debtorId } = req.body;
  try {
    const newDebt = await prisma.debt.create({
      data: {
        description,
        totalAmount,
        dueDate: new Date(dueDate),
        debtorId,
        status: 'PENDENTE' // <-- explícito, embora o Prisma já defina por padrão
      },
    });
    res.status(201).json(newDebt);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar dívida' });
  }
};

// Atualizar dívida (com opção de alterar o status manualmente, se quiser)
const updateDebt = async (req, res) => {
  const { id } = req.params;
  const { description, totalAmount, dueDate, status } = req.body;
  try {
    const updated = await prisma.debt.update({
      where: { id },
      data: {
        description,
        totalAmount,
        dueDate: new Date(dueDate),
        ...(status && { status }) // <-- só atualiza o status se for enviado
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar dívida' });
  }
};

// Deletar dívida
const deleteDebt = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.debt.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar dívida' });
  }
};

// Buscar dívida por ID
const getDebtById = async (req, res) => {
  const { id } = req.params;
  try {
    const debt = await prisma.debt.findUnique({
      where: { id },
      include: { debtor: true, payments: true },
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    res.json(debt);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dívida' });
  }
};

// Listar dívidas por status
const getDebtsByStatus = async (req, res) => {
  const { status } = req.params; // status = "PENDENTE" ou "PAGA"

  if (!['PENDENTE', 'PAGA'].includes(status.toUpperCase())) {
    return res.status(400).json({ error: 'Status inválido. Use PENDENTE ou PAGA.' });
  }

  try {
    const debts = await prisma.debt.findMany({
      where: { status: status.toUpperCase() },
      include: { debtor: true, payments: true },
    });
    res.json(debts);
  } catch (err) {
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