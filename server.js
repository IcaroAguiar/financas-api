// server.js

// Importa o pacote 'dotenv' para carregar variáveis de ambiente do arquivo .env
require("dotenv").config();

// Importa o framework 'express' para criar o servidor
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Importa as rotas 
const userRoutes = require("./src/routes/userRoutes");
const transactionRoutes = require('./src/routes/transactionRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes'); 
const accountRoutes = require('./src/routes/accountRoutes');
// const testRoutes = require('./src/routes/testRoutes');
const debtorRoutes = require('./src/routes/debtorRoutes');
const debtRoutes = require('./src/routes/debtRoutes');
const paymentsRoutes = require('./src/routes/paymentsRoutes');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const debugRoutes = require('./src/routes/debugRoutes');

// Importa o processador de assinaturas
const { startSubscriptionProcessor, startSubscriptionProcessorDev } = require('./src/jobs/subscriptionProcessor');

// Cria uma instância do aplicativo express
const app = express();

// Define a porta do servidor, usando a variável de ambiente PORT ou 3000 como padrão
const PORT = process.env.PORT || 3000;

// Security headers middleware
app.use(helmet());

// Request logging middleware
app.use(morgan('combined'));

// Middleware para permitir que o express entenda requisições com corpo em JSON
// Aumenta o limite para 10MB para suportar imagens base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Simplified request logging for development
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 ${req.method} ${req.url}`);
  }
  next();
});

// CORS middleware para permitir requisições do frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:8090', 'exp://192.168.0.*:8081', 'exp://192.168.0.*:8082', 'exp://192.168.0.*:8090', 'exp://192.168.1.*:8081', 'exp://192.168.1.*:8082', 'exp://192.168.1.*:8090', 'exp://*'],
  credentials: true
}));

// Rota de teste para verificar se o servidor está funcionando
app.get("/", (req, res) => {
  res.json({ 
    message: "API de Finanças está no ar!", 
    version: "1.1.0",
    timestamp: new Date().toISOString(),
    status: "healthy"
  });
});

// Test endpoint for debugging
app.post("/api/test-debug", (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    console.log("🧪 TEST DEBUG ENDPOINT HIT!");
    console.log("🧪 Request body:", JSON.stringify(req.body, null, 2));
  }
  res.json({ message: "Debug endpoint working", receivedData: req.body });
});

// ENDPOINT REMOVIDO: emergency-db-reset foi removido por segurança
// Este endpoint causou perda catastrófica de dados em produção
// Nunca mais será implementado sem safeguards extremos

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/swaggerConfig');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Aponta os caminhos da API
app.use("/api/users", userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/debtors', debtorRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api', healthRoutes);
app.use('/api/debug', debugRoutes);


// Middleware de tratamento de erros (deve vir por último)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Se é um erro de validação do Prisma
  if (err.code === 'P2002') {
    return res.status(400).json({ 
      error: 'Dados duplicados. Este registro já existe.' 
    });
  }
  
  // Se é um erro de registro não encontrado
  if (err.code === 'P2025') {
    return res.status(404).json({ 
      error: 'Registro não encontrado.' 
    });
  }
  
  // Erro genérico
  res.status(500).json({ 
    error: 'Erro interno do servidor' 
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada' 
  });
});

// Exporta o app para testes
module.exports = app;

// Inicia o servidor apenas se o arquivo for executado diretamente (não em testes)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse em: http://192.168.0.24:${PORT}`);
    
    // Iniciar processador automático de assinaturas
    if (process.env.NODE_ENV === 'development') {
      startSubscriptionProcessorDev(); // Executa a cada 5 minutos em desenvolvimento
    } else {
      startSubscriptionProcessor(); // Executa a cada hora em produção
    }
  });
}

