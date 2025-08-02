const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar pagamento para uma dívida específica
const createPayment = async (req, res) => {
  const { debtId } = req.params;
  const { amount, paymentDate, notes } = req.body;

  try {
    // Validar se a dívida existe
    const debt = await prisma.debt.findUnique({
      where: { id: debtId }
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada.' });
    }

    // Validar campos obrigatórios
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'O valor do pagamento deve ser maior que zero.' });
    }

    // Criar dados do pagamento
    const paymentData = {
      amount: parseFloat(amount),
      debtId: debtId,
    };

    // Adicionar campos opcionais se fornecidos
    if (paymentDate) {
      paymentData.paymentDate = new Date(paymentDate);
    }
    // Se paymentDate não for fornecido, usa o @default(now()) do schema

    if (notes) {
      paymentData.notes = notes;
    }

    // Criar o pagamento
    const newPayment = await prisma.payment.create({
      data: paymentData,
      include: {
        debt: {
          include: {
            debtor: true
          }
        }
      }
    });

    res.status(201).json(newPayment);
  } catch (err) {
    console.error('Erro ao criar pagamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao criar pagamento.' });
  }
};

// Listar todos os pagamentos de uma dívida específica
const getPaymentsByDebt = async (req, res) => {
  const { debtId } = req.params;

  try {
    // Verificar se a dívida existe
    const debt = await prisma.debt.findUnique({
      where: { id: debtId }
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada.' });
    }

    // Buscar pagamentos da dívida
    const payments = await prisma.payment.findMany({
      where: { debtId: debtId },
      orderBy: { paymentDate: 'desc' }, // Mais recentes primeiro
      include: {
        debt: {
          select: {
            id: true,
            description: true,
            totalAmount: true
          }
        }
      }
    });

    res.json(payments);
  } catch (err) {
    console.error('Erro ao buscar pagamentos:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao buscar pagamentos.' });
  }
};

// Deletar um pagamento específico
const deletePayment = async (req, res) => {
  const { paymentId } = req.params;

  try {
    // Verificar se o pagamento existe
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado.' });
    }

    // Deletar o pagamento
    await prisma.payment.delete({
      where: { id: paymentId }
    });

    res.status(204).send();
  } catch (err) {
    console.error('Erro ao deletar pagamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao deletar pagamento.' });
  }
};

module.exports = {
  createPayment,
  getPaymentsByDebt,
  deletePayment,
};