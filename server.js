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
app.use(express.json());

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

// CRITICAL: SUPER PROTECTED database reset endpoint - REQUIRES EXPLICIT CONFIRMATION
app.post("/emergency-db-reset", async (req, res) => {
  // AUDIT LOG: Record every attempt to access this dangerous endpoint
  const timestamp = new Date().toISOString();
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  
  console.log(`🔒 AUDIT LOG: Emergency reset endpoint accessed at ${timestamp}`);
  console.log(`🔒 AUDIT LOG: Client IP: ${clientIP}`);
  console.log(`🔒 AUDIT LOG: User Agent: ${userAgent}`);
  console.log(`🔒 AUDIT LOG: Request Body Keys: ${Object.keys(req.body).join(', ')}`);

  // PROTECTION 1: Environment check
  if (process.env.NODE_ENV !== 'production') {
    console.log("🔒 AUDIT LOG: Access denied - not in production environment");
    return res.status(403).json({ error: 'Only available in production' });
  }

  // PROTECTION 2: Require explicit confirmation parameter
  const { confirmDeletion, emergencyKey } = req.body;
  if (confirmDeletion !== "YES_DELETE_ALL_DATA_PERMANENTLY") {
    console.log("🛡️  PROTECTION: Emergency reset blocked - missing confirmation");
    return res.status(403).json({ 
      error: 'PROTEÇÃO ATIVA: Para executar este endpoint perigoso, inclua confirmDeletion: "YES_DELETE_ALL_DATA_PERMANENTLY" no body da requisição' 
    });
  }

  // PROTECTION 3: Require emergency key
  if (emergencyKey !== "EMERGENCY_2025_RESET_KEY") {
    console.log("🛡️  PROTECTION: Emergency reset blocked - invalid emergency key");
    return res.status(403).json({ 
      error: 'PROTEÇÃO ATIVA: Chave de emergência inválida. Necessário emergencyKey correto.' 
    });
  }

  // PROTECTION 4: Additional safety delay
  console.log("🚨 ATENÇÃO: Reset do banco será executado em 5 segundos...");
  console.log("⚠️  ÚLTIMA CHANCE: Pressione Ctrl+C para cancelar!");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    console.log("🚨 CRITICAL PRODUCTION FIX FOR TESTERS INITIATED");
    console.log("⚠️  Raw SQL database reset - bypassing Prisma for drops");
    
    // Use raw PostgreSQL connection to avoid Prisma schema conflicts
    const { Pool } = require('pg');
    
    // Create direct PostgreSQL connection
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
        rejectUnauthorized: false
      }
    });
    
    console.log("🔗 Connected directly to PostgreSQL");
    
    // Step 1: Drop all tables using raw PostgreSQL
    console.log("🗑️  Dropping all tables with raw SQL...");
    
    const dropCommands = [
      'DROP TABLE IF EXISTS "Payment" CASCADE;',
      'DROP TABLE IF EXISTS "Installment" CASCADE;', 
      'DROP TABLE IF EXISTS "TransactionInstallment" CASCADE;',
      'DROP TABLE IF EXISTS "Debt" CASCADE;',
      'DROP TABLE IF EXISTS "Debtor" CASCADE;',
      'DROP TABLE IF EXISTS "Transaction" CASCADE;',
      'DROP TABLE IF EXISTS "Subscription" CASCADE;',
      'DROP TABLE IF EXISTS "Account" CASCADE;',
      'DROP TABLE IF EXISTS "Category" CASCADE;',
      'DROP TABLE IF EXISTS "User" CASCADE;',
      'DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;'
    ];
    
    for (const dropSql of dropCommands) {
      try {
        await pool.query(dropSql);
        console.log(`✅ Executed: ${dropSql}`);
      } catch (error) {
        console.log(`⚠️  ${dropSql} - ${error.message}`);
      }
    }
    
    await pool.end();
    console.log("✅ All tables dropped via raw SQL");
    
    // Step 2: Apply comprehensive fix using our proven script
    console.log("🔄 Applying comprehensive database fix...");
    const { exec } = require('child_process');
    
    const comprehensiveFixResult = await new Promise((resolve) => {
      exec('npx prisma db push --force-reset --accept-data-loss && npx prisma generate', (error, stdout, stderr) => {
        console.log("Comprehensive fix stdout:", stdout);
        if (stderr) console.log("Comprehensive fix stderr:", stderr);
        resolve({ error, stdout, stderr, success: !error });
      });
    });
    
    console.log("Comprehensive fix result:", comprehensiveFixResult.success ? "SUCCESS" : "FAILED");
    
    // Step 3: Force complete Prisma client refresh
    console.log("🔄 Forcing complete Prisma client refresh...");
    
    // Clear all Prisma-related caches
    Object.keys(require.cache).forEach(key => {
      if (key.includes('prisma') || key.includes('@prisma')) {
        delete require.cache[key];
      }
    });
    
    // Wait a moment for the schema sync to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 4: Create test data with fresh Prisma client
    console.log("👤 Creating test data for testers...");
    
    // Import completely fresh Prisma client after cache clear
    const { PrismaClient } = require("@prisma/client");
    const testPrisma = new PrismaClient();
    
    // Create comprehensive test data for testers
    const testUser = await testPrisma.user.create({
      data: {
        name: "Tester User",
        email: "tester@financas.app", 
        password: "$2b$10$rQ8K8wGjFjKdUZzqfqzqHeKoOYj7J7YgZRjXj.pJ7Ks5lXKJF3lR6" // password: "123456"
      }
    });
    
    const testAccount = await testPrisma.account.create({
      data: {
        name: "Conta Corrente",
        type: "CORRENTE", 
        balance: 150000, // R$ 1500,00
        userId: testUser.id
      }
    });
    
    const testCategory = await testPrisma.category.create({
      data: {
        name: "Alimentação",
        color: "#FF6B6B",
        userId: testUser.id
      }
    });
    
    // Create multiple test transactions
    const transactions = [];
    
    for (let i = 0; i < 5; i++) {
      const transaction = await testPrisma.transaction.create({
        data: {
          description: `Transação Teste ${i + 1}`,
          amount: Math.floor(Math.random() * 10000) + 1000, // R$ 10,00 - R$ 100,00
          date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date within last 30 days
          type: i % 2 === 0 ? "RECEITA" : "DESPESA", 
          userId: testUser.id,
          categoryId: testCategory.id,
          accountId: testAccount.id,
          isRecurring: false
        },
        include: {
          account: true,
          category: true
        }
      });
      transactions.push(transaction);
    }
    
    await testPrisma.$disconnect();
    
    console.log("🎉 PRODUCTION API READY FOR TESTERS!");
    console.log(`📧 Test User: ${testUser.email} | Password: 123456`);
    console.log(`💰 Test Account: ${testAccount.name} | Balance: R$ ${(testAccount.balance / 100).toFixed(2)}`);
    console.log(`📊 Created ${transactions.length} test transactions with account relationships`);
    
    res.json({
      status: "success", 
      message: "Production API normalized for testers",
      testData: {
        user: {
          email: testUser.email,
          password: "123456",
          id: testUser.id
        },
        account: {
          name: testAccount.name,
          balance: testAccount.balance,
          id: testAccount.id
        },
        category: {
          name: testCategory.name,
          color: testCategory.color,
          id: testCategory.id
        },
        transactions: transactions.length,
        allTransactionsHaveAccount: transactions.every(t => !!t.account)
      }
    });
    
  } catch (error) {
    console.error("❌ COMPLETE RESET FAILED:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
});

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

