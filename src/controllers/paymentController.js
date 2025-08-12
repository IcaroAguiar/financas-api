const prisma = require("../lib/prisma");

// Função para verificar se uma dívida foi totalmente paga e criar transação de receita
const checkAndHandleDebtFullyPaid = async (debt) => {
  try {
    // Calcular total pago
    const totalPaid = debt.payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Verificar se a dívida foi totalmente paga
    if (totalPaid >= debt.totalAmount && debt.status !== 'PAGA') {
      // Marcar dívida como paga
      await prisma.debt.update({
        where: { id: debt.id },
        data: { status: 'PAGA' }
      });

      // Criar transação de receita automaticamente
      await prisma.transaction.create({
        data: {
          description: `Recebimento de cobrança: ${debt.debtor.name}`,
          amount: debt.totalAmount,
          date: new Date(),
          type: 'RECEITA',
          userId: debt.debtor.userId,
          isRecurring: false,
          // Podemos criar uma categoria específica para recebimentos de dívidas
          // ou deixar sem categoria por enquanto
        }
      });

      console.log(`✅ Dívida ${debt.id} marcada como PAGA e transação de receita criada automaticamente`);
    }
  } catch (error) {
    console.error('❌ Erro ao processar dívida totalmente paga:', error);
    // Não propagar o erro para não afetar o fluxo principal
  }
};

// Criar pagamento para uma dívida específica do usuário logado
const createPayment = async (req, res) => {
  const { debtId } = req.params;
  const { amount, paymentDate, notes } = req.body;
  const userId = req.user.id;

  try {
    // VERIFICAÇÃO CRÍTICA: A dívida pertence ao usuário logado?
    const debt = await prisma.debt.findFirst({
      where: {
        id: debtId,
        debtor: {
          userId // Só pode criar pagamento para dívidas cujos devedores são seus
        }
      },
      include: {
        debtor: true
      }
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada ou não pertence a você.' });
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
            debtor: true,
            payments: true
          }
        }
      }
    });

    // Verificar se a dívida foi totalmente paga após este pagamento
    await checkAndHandleDebtFullyPaid(newPayment.debt);

    res.status(201).json(newPayment);
  } catch (err) {
    console.error('Erro ao criar pagamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao criar pagamento.' });
  }
};

// Listar todos os pagamentos de uma dívida específica do usuário logado
const getPaymentsByDebt = async (req, res) => {
  const { debtId } = req.params;
  const userId = req.user.id;

  try {
    // VERIFICAÇÃO CRÍTICA: A dívida pertence ao usuário logado?
    const debt = await prisma.debt.findFirst({
      where: {
        id: debtId,
        debtor: {
          userId // Só pode listar pagamentos de dívidas cujos devedores são seus
        }
      }
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada ou não pertence a você.' });
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

// Deletar um pagamento específico do usuário logado
const deletePayment = async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;

  try {
    // VERIFICAÇÃO CRÍTICA: O pagamento pertence ao usuário logado?
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        debt: {
          debtor: {
            userId // Só pode deletar pagamentos de dívidas cujos devedores são seus
          }
        }
      },
      include: {
        debt: {
          include: {
            debtor: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado ou não pertence a você.' });
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

// Marcar dívida como paga manualmente
const markDebtAsPaid = async (req, res) => {
  const { debtId } = req.params;
  const userId = req.user.id;

  try {
    // VERIFICAÇÃO CRÍTICA: A dívida pertence ao usuário logado?
    const debt = await prisma.debt.findFirst({
      where: {
        id: debtId,
        debtor: {
          userId
        }
      },
      include: {
        debtor: true,
        payments: true
      }
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada ou não pertence a você.' });
    }

    if (debt.status === 'PAGA') {
      return res.status(400).json({ error: 'Esta dívida já está marcada como paga.' });
    }

    // Marcar dívida como paga
    const updatedDebt = await prisma.debt.update({
      where: { id: debtId },
      data: { status: 'PAGA' },
      include: {
        debtor: true,
        payments: true
      }
    });

    // Criar transação de receita automaticamente
    await prisma.transaction.create({
      data: {
        description: `Recebimento de cobrança: ${debt.debtor.name}`,
        amount: debt.totalAmount,
        date: new Date(),
        type: 'RECEITA',
        userId: debt.debtor.userId,
        isRecurring: false,
      }
    });

    console.log(`✅ Dívida ${debt.id} marcada como PAGA manualmente e transação de receita criada`);

    res.status(200).json(updatedDebt);
  } catch (err) {
    console.error('Erro ao marcar dívida como paga:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao marcar dívida como paga.' });
  }
};

module.exports = {
  createPayment,
  getPaymentsByDebt,
  deletePayment,
  markDebtAsPaid,
};