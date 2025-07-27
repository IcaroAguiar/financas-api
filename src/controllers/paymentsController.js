const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar um novo pagamento e atualizar status da dívida
const createPayment = async (req, res) => {
  const { debtId, amount, date } = req.body;

  try {
    // Verifica se a dívida existe
    const debt = await prisma.debt.findUnique({
      where: { id: debtId },
      include: { payments: true }
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada.' });
    }

    // Cria o pagamento
    const payment = await prisma.payment.create({
      data: {
        debtId,
        amount,
        date: new Date(date),
      }
    });

    // Soma os pagamentos existentes + o novo
    const totalPago = debt.payments.reduce((acc, p) => acc + p.amount, 0) + amount;

    // Atualiza o status da dívida, se necessário
    const novoStatus = totalPago >= debt.totalAmount ? 'PAGA' : 'PENDENTE';

    await prisma.debt.update({
      where: { id: debtId },
      data: { status: novoStatus }
    });

    res.status(201).json({
      mensagem: 'Pagamento registrado com sucesso.',
      statusAtualDaDivida: novoStatus,
      pagamento: payment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar pagamento.' });
  }
};

module.exports = {
  createPayment,
};
