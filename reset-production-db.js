// Production Database Reset Script
// DANGER: This will delete ALL data - only run when authorized

const { PrismaClient } = require("@prisma/client");

async function resetProductionDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log("🚨 STARTING PRODUCTION DATABASE RESET...");
    console.log("⚠️  This will delete ALL data!");
    
    // Connect to database
    await prisma.$connect();
    console.log("✅ Connected to database");
    
    // Delete all data in correct order (respecting foreign key constraints)
    console.log("🗑️  Deleting payments...");
    const paymentsDeleted = await prisma.payment.deleteMany();
    console.log(`   Deleted ${paymentsDeleted.count} payments`);
    
    console.log("🗑️  Deleting installments...");
    const installmentsDeleted = await prisma.installment.deleteMany();
    console.log(`   Deleted ${installmentsDeleted.count} installments`);
    
    console.log("🗑️  Deleting transaction installments...");
    const transactionInstallmentsDeleted = await prisma.transactionInstallment.deleteMany();
    console.log(`   Deleted ${transactionInstallmentsDeleted.count} transaction installments`);
    
    console.log("🗑️  Deleting debts...");
    const debtsDeleted = await prisma.debt.deleteMany();
    console.log(`   Deleted ${debtsDeleted.count} debts`);
    
    console.log("🗑️  Deleting debtors...");
    const debtorsDeleted = await prisma.debtor.deleteMany();
    console.log(`   Deleted ${debtorsDeleted.count} debtors`);
    
    console.log("🗑️  Deleting transactions...");
    const transactionsDeleted = await prisma.transaction.deleteMany();
    console.log(`   Deleted ${transactionsDeleted.count} transactions`);
    
    console.log("🗑️  Deleting subscriptions...");
    const subscriptionsDeleted = await prisma.subscription.deleteMany();
    console.log(`   Deleted ${subscriptionsDeleted.count} subscriptions`);
    
    console.log("🗑️  Deleting accounts...");
    const accountsDeleted = await prisma.account.deleteMany();
    console.log(`   Deleted ${accountsDeleted.count} accounts`);
    
    console.log("🗑️  Deleting categories...");
    const categoriesDeleted = await prisma.category.deleteMany();
    console.log(`   Deleted ${categoriesDeleted.count} categories`);
    
    console.log("🗑️  Deleting users...");
    const usersDeleted = await prisma.user.deleteMany();
    console.log(`   Deleted ${usersDeleted.count} users`);
    
    // Create a test user to verify everything works
    console.log("👤 Creating test user...");
    const testUser = await prisma.user.create({
      data: {
        name: "Production Test User",
        email: "prod.test@example.com",
        password: "$2b$10$rQ8K8wGjFjKdUZzqfqzqHeKoOYj7J7YgZRjXj.pJ7Ks5lXKJF3lR6" // "123456"
      }
    });
    console.log(`✅ Test user created: ${testUser.email}`);
    
    // Create a test category
    console.log("📁 Creating test category...");
    const testCategory = await prisma.category.create({
      data: {
        name: "Test Category",
        color: "#007BFF",
        userId: testUser.id
      }
    });
    console.log(`✅ Test category created: ${testCategory.name}`);
    
    // Create a test account
    console.log("🏦 Creating test account...");
    const testAccount = await prisma.account.create({
      data: {
        name: "Test Account",
        type: "CORRENTE",
        balance: 0,
        userId: testUser.id
      }
    });
    console.log(`✅ Test account created: ${testAccount.name}`);
    
    // Create a test transaction with account relationship
    console.log("💰 Creating test transaction...");
    const testTransaction = await prisma.transaction.create({
      data: {
        description: "Test Transaction",
        amount: 10000, // R$ 100,00
        date: new Date(),
        type: "RECEITA",
        userId: testUser.id,
        categoryId: testCategory.id,
        accountId: testAccount.id,
        isRecurring: false
      },
      include: {
        category: true,
        account: true,
        installments: true
      }
    });
    console.log(`✅ Test transaction created: ${testTransaction.description}`);
    console.log(`   Account relationship: ${testTransaction.account ? testTransaction.account.name : 'None'}`);
    
    console.log("🎉 DATABASE RESET COMPLETED SUCCESSFULLY!");
    console.log("📊 Summary:");
    console.log(`   - Users deleted: ${usersDeleted.count}`);
    console.log(`   - Transactions deleted: ${transactionsDeleted.count}`);
    console.log(`   - Accounts deleted: ${accountsDeleted.count}`);
    console.log(`   - Test user created: ${testUser.email}`);
    console.log(`   - Test transaction with account: ${testTransaction.account ? 'YES' : 'NO'}`);
    
    return {
      success: true,
      summary: {
        usersDeleted: usersDeleted.count,
        transactionsDeleted: transactionsDeleted.count,
        accountsDeleted: accountsDeleted.count,
        testUser: testUser.email,
        testTransactionHasAccount: !!testTransaction.account
      }
    };
    
  } catch (error) {
    console.error("❌ DATABASE RESET FAILED:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  resetProductionDatabase()
    .then((result) => {
      console.log("✅ Reset completed:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Reset failed:", error);
      process.exit(1);
    });
}

module.exports = { resetProductionDatabase };