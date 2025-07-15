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

// Criar dívida
const createDebt = async (req, res) => {
  const { description, totalAmount, dueDate, debtorId } = req.body;
  try {
    const newDebt = await prisma.debt.create({
      data: { description, totalAmount, dueDate: new Date(dueDate), debtorId },
    });
    res.status(201).json(newDebt);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar dívida' });
  }
};

// Atualizar dívida
const updateDebt = async (req, res) => {
  const { id } = req.params;
  const { description, totalAmount, dueDate } = req.body;
  try {
    const updated = await prisma.debt.update({
      where: { id },
      data: { description, totalAmount, dueDate: new Date(dueDate) },
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

module.exports = {
  getAllDebts,
  createDebt,
  updateDebt,
  deleteDebt,
};