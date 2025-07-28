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

// Listar todos os pagamentos de uma dívida
const getPaymentsByDebtId = async (req, res) => {
  const { debtId } = req.params;

  try {
    const payments = await prisma.payment.findMany({
      where: { debtId },
      orderBy: { date: 'desc' }
    });

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar pagamentos.' });
  }
};

// Deletar um pagamento e atualizar status da dívida
const deletePayment = async (req, res) => {
  const { id } = req.params;

  try {
    // Busca o pagamento para pegar o debtId
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { debt: { include: { payments: true } } }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado.' });
    }

    // Remove o pagamento
    await prisma.payment.delete({
      where: { id }
    });

    // Recalcula o total pago (excluindo o pagamento deletado)
    const totalPago = payment.debt.payments
      .filter(p => p.id !== id)
      .reduce((acc, p) => acc + p.amount, 0);

    // Atualiza o status da dívida
    const novoStatus = totalPago >= payment.debt.totalAmount ? 'PAGA' : 'PENDENTE';

    await prisma.debt.update({
      where: { id: payment.debtId },
      data: { status: novoStatus }
    });

    res.json({
      mensagem: 'Pagamento removido com sucesso.',
      statusAtualDaDivida: novoStatus
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar pagamento.' });
  }
};

module.exports = {
  createPayment,
  getPaymentsByDebtId,
  deletePayment,
};
