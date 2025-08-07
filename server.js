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

// Debug middleware removed

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

// TEMPORARY: Complete database schema reset endpoint (REMOVE AFTER USE)
app.post("/emergency-db-reset", async (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    return res.status(403).json({ error: 'Only available in production' });
  }
  
  try {
    const { PrismaClient } = require("@prisma/client");
    const { exec } = require('child_process');
    
    console.log("🚨 COMPLETE DATABASE SCHEMA RESET INITIATED");
    console.log("⚠️  This will DROP ALL TABLES and recreate from scratch!");
    
    // Step 1: Drop all tables using raw SQL
    console.log("🗑️  Dropping all tables...");
    const prisma = new PrismaClient();
    
    try {
      // Drop tables in reverse dependency order to avoid foreign key constraints
      const dropTables = [
        'DROP TABLE IF EXISTS "Payment" CASCADE',
        'DROP TABLE IF EXISTS "Installment" CASCADE', 
        'DROP TABLE IF EXISTS "TransactionInstallment" CASCADE',
        'DROP TABLE IF EXISTS "Debt" CASCADE',
        'DROP TABLE IF EXISTS "Debtor" CASCADE',
        'DROP TABLE IF EXISTS "Transaction" CASCADE',
        'DROP TABLE IF EXISTS "Subscription" CASCADE',
        'DROP TABLE IF EXISTS "Account" CASCADE',
        'DROP TABLE IF EXISTS "Category" CASCADE',
        'DROP TABLE IF EXISTS "User" CASCADE',
        'DROP TABLE IF EXISTS "_prisma_migrations" CASCADE'
      ];
      
      for (const dropSql of dropTables) {
        try {
          await prisma.$executeRawUnsafe(dropSql);
          console.log(`✅ Executed: ${dropSql}`);
        } catch (error) {
          console.log(`⚠️  ${dropSql} - ${error.message}`);
        }
      }
      
      await prisma.$disconnect();
      console.log("✅ All tables dropped");
      
    } catch (error) {
      console.log("❌ Error during table dropping:", error.message);
      await prisma.$disconnect();
    }
    
    // Step 2: Deploy all migrations from scratch
    console.log("🔄 Deploying all migrations from scratch...");
    const migrationResult = await new Promise((resolve) => {
      exec('npx prisma migrate deploy --schema=./prisma/schema.prisma', (error, stdout, stderr) => {
        console.log("Migration stdout:", stdout);
        if (stderr) console.log("Migration stderr:", stderr);
        if (error) {
          console.log("Migration error:", error.message);
        }
        resolve({ error, stdout, stderr });
      });
    });
    
    // Step 3: Generate fresh Prisma client
    console.log("🔄 Generating fresh Prisma client...");
    const generateResult = await new Promise((resolve) => {
      exec('npx prisma generate', (error, stdout, stderr) => {
        console.log("Generate stdout:", stdout);
        if (stderr) console.log("Generate stderr:", stderr);
        if (error) {
          console.log("Generate error:", error.message);
        }
        resolve({ error, stdout, stderr });
      });
    });
    
    // Step 4: Create fresh Prisma client instance and test data
    console.log("👤 Creating fresh test data...");
    const newPrisma = new PrismaClient();
    
    // Create test user
    const testUser = await newPrisma.user.create({
      data: {
        name: "Production Test User",
        email: "prod.test@example.com", 
        password: "$2b$10$rQ8K8wGjFjKdUZzqfqzqHeKoOYj7J7YgZRjXj.pJ7Ks5lXKJF3lR6" // "123456"
      }
    });
    console.log(`✅ Test user created: ${testUser.email}`);
    
    // Create test account  
    const testAccount = await newPrisma.account.create({
      data: {
        name: "Test Account",
        type: "CORRENTE", 
        balance: 10000, // R$ 100,00
        userId: testUser.id
      }
    });
    console.log(`✅ Test account created: ${testAccount.name}`);
    
    // Create test category
    const testCategory = await newPrisma.category.create({
      data: {
        name: "Test Category",
        color: "#007BFF",
        userId: testUser.id
      }
    });
    console.log(`✅ Test category created: ${testCategory.name}`);
    
    // Create test transaction with account relationship
    const testTransaction = await newPrisma.transaction.create({
      data: {
        description: "Test Transaction with Account",
        amount: 5000, // R$ 50,00
        date: new Date(),
        type: "RECEITA", 
        userId: testUser.id,
        categoryId: testCategory.id,
        accountId: testAccount.id,
        isRecurring: false
      },
      include: {
        account: true,
        category: true,
        installments: true
      }
    });
    console.log(`✅ Test transaction created: ${testTransaction.description}`);
    console.log(`   Account relationship: ${testTransaction.account ? testTransaction.account.name : 'None'}`);
    
    await newPrisma.$disconnect();
    
    console.log("🎉 COMPLETE DATABASE RESET SUCCESS!");
    
    res.json({
      status: "success",
      message: "Complete database schema reset completed",
      summary: {
        tablesDropped: "All tables dropped and recreated",
        migrationsApplied: !!migrationResult.stdout,
        clientRegenerated: !!generateResult.stdout,
        testUser: { email: testUser.email, id: testUser.id },
        testAccount: { name: testAccount.name, id: testAccount.id },
        testTransaction: { 
          id: testTransaction.id, 
          description: testTransaction.description,
          hasAccount: !!testTransaction.account,
          accountName: testTransaction.account?.name 
        }
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

