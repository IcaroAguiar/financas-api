const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar todos os devedores
const getAllDebtors = async (req, res) => {
  try {
    const debtors = await prisma.debtor.findMany();
    res.json(debtors);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar devedores' });
  }
};

// Criar devedor
const createDebtor = async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const newDebtor = await prisma.debtor.create({
      data: { name, email, phone },
    });
    res.status(201).json(newDebtor);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar devedor' });
  }
};

// Atualizar devedor
const updateDebtor = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  try {
    const updated = await prisma.debtor.update({
      where: { id },
      data: { name, email, phone },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar devedor' });
  }
};

// Deletar devedor
const deleteDebtor = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.debtor.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar devedor' });
  }
};

module.exports = {
    getAllDebtors,
    createDebtor,
    updateDebtor,
    deleteDebtor,
};