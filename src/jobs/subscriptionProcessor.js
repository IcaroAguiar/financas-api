const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Utility function to calculate next payment date
const calculateNextPaymentDate = (startDate, frequency, lastProcessedAt = null) => {
  const baseDate = lastProcessedAt ? new Date(lastProcessedAt) : new Date(startDate);
  const nextDate = new Date(baseDate);
  
  switch (frequency) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      throw new Error(`Frequência de assinatura inválida: ${frequency}`);
  }
  
  return nextDate;
};

// Processar todas as assinaturas que venceram
const processAllSubscriptions = async () => {
  console.log('🔄 Iniciando processamento automático de assinaturas...');
  
  try {
    const now = new Date();
    
    // Buscar assinaturas ativas que precisam ser processadas
    const subscriptionsToProcess = await prisma.subscription.findMany({
      where: {
        isActive: true,
        nextPaymentDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: true,
        account: true
      }
    });

    console.log(`📋 Encontradas ${subscriptionsToProcess.length} assinaturas para processar`);

    if (subscriptionsToProcess.length === 0) {
      console.log('✅ Nenhuma assinatura precisa ser processada no momento');
      return {
        success: true,
        processedCount: 0,
        errors: []
      };
    }

    const results = {
      processedCount: 0,
      errors: [],
      createdTransactions: []
    };

    // Processar cada assinatura
    for (const subscription of subscriptionsToProcess) {
      try {
        console.log(`💰 Processando assinatura "${subscription.name}" (${subscription.id})`);
        
        // Criar transação
        const transaction = await prisma.transaction.create({
          data: {
            description: `${subscription.name} - Cobrança automática`,
            amount: subscription.amount,
            date: subscription.nextPaymentDate,
            type: subscription.type,
            isRecurring: true,
            userId: subscription.userId,
            categoryId: subscription.categoryId,
            accountId: subscription.accountId,
            subscriptionId: subscription.id
          },
          include: {
            category: true,
            account: true,
            subscription: { select: { name: true } }
          }
        });

        // Calcular próxima data de pagamento
        const nextPaymentDate = calculateNextPaymentDate(
          subscription.startDate,
          subscription.frequency,
          subscription.nextPaymentDate
        );

        // Atualizar assinatura
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            nextPaymentDate,
            lastProcessedAt: subscription.nextPaymentDate
          }
        });

        results.processedCount++;
        results.createdTransactions.push({
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount,
          subscriptionName: subscription.name,
          userName: subscription.user.name
        });

        console.log(`✅ Assinatura "${subscription.name}" processada com sucesso - Próximo pagamento: ${nextPaymentDate.toISOString()}`);
        
      } catch (subscriptionError) {
        console.error(`❌ Erro ao processar assinatura ${subscription.id} (${subscription.name}):`, subscriptionError);
        results.errors.push({
          subscriptionId: subscription.id,
          subscriptionName: subscription.name,
          error: subscriptionError.message
        });
      }
    }

    console.log(`🎉 Processamento concluído: ${results.processedCount} assinaturas processadas, ${results.errors.length} erros`);
    
    return {
      success: true,
      ...results
    };

  } catch (error) {
    console.error('💥 Erro geral no processamento de assinaturas:', error);
    return {
      success: false,
      error: error.message,
      processedCount: 0,
      errors: []
    };
  }
};

// Configurar intervalo de processamento (a cada hora)
const startSubscriptionProcessor = () => {
  console.log('🚀 Iniciando processador automático de assinaturas');
  console.log('⏰ Executará a cada hora (3600000ms)');
  
  // Executar imediatamente na inicialização
  processAllSubscriptions();
  
  // Configurar execução a cada hora
  const intervalId = setInterval(processAllSubscriptions, 60 * 60 * 1000); // 1 hora
  
  // Retornar ID do intervalo para poder cancelar se necessário
  return intervalId;
};

// Configurar intervalo de desenvolvimento (a cada 5 minutos)
const startSubscriptionProcessorDev = () => {
  console.log('🚀 Iniciando processador automático de assinaturas (MODO DESENVOLVIMENTO)');
  console.log('⏰ Executará a cada 5 minutos para testes');
  
  // Executar imediatamente na inicialização
  processAllSubscriptions();
  
  // Configurar execução a cada 5 minutos em desenvolvimento
  const intervalId = setInterval(processAllSubscriptions, 5 * 60 * 1000); // 5 minutos
  
  return intervalId;
};

module.exports = {
  processAllSubscriptions,
  startSubscriptionProcessor,
  startSubscriptionProcessorDev
};