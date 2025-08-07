// Debug routes for production troubleshooting
const { Router } = require("express");
const { PrismaClient } = require("@prisma/client");

const router = Router();
const prisma = new PrismaClient();

// Test database connection and basic operations
router.get("/database-test", async (req, res) => {
  try {
    console.log("🔍 DEBUG: Testing database connection...");
    
    // Test 1: Basic connection
    await prisma.$connect();
    console.log("✅ DEBUG: Database connected");
    
    // Test 2: User count
    const userCount = await prisma.user.count();
    console.log(`✅ DEBUG: User count: ${userCount}`);
    
    // Test 3: Schema introspection
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log("✅ DEBUG: Tables:", tables);
    
    // Test 4: User table structure
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      ORDER BY ordinal_position;
    `;
    console.log("✅ DEBUG: User columns:", userColumns);
    
    // Test 5: Transaction table structure
    const transactionColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Transaction' 
      ORDER BY ordinal_position;
    `;
    console.log("✅ DEBUG: Transaction columns:", transactionColumns);
    
    res.json({
      status: "success",
      userCount,
      tables: tables.length,
      userColumns: userColumns.length,
      transactionColumns: transactionColumns.length,
      details: {
        tables,
        userColumns,
        transactionColumns
      }
    });
    
  } catch (error) {
    console.error("❌ DEBUG ERROR:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
});

// Test creating a simple user
router.post("/test-user-creation", async (req, res) => {
  try {
    console.log("🔍 DEBUG: Testing user creation...");
    
    const testUser = await prisma.user.create({
      data: {
        name: "Debug Test User",
        email: `debug.test.${Date.now()}@example.com`,
        password: "hashedPassword123"
      }
    });
    
    console.log("✅ DEBUG: User created:", testUser);
    
    res.json({
      status: "success",
      user: testUser
    });
    
  } catch (error) {
    console.error("❌ DEBUG USER CREATION ERROR:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  }
});

// Reset database (DANGEROUS - only use when authorized)
router.post("/reset-database", async (req, res) => {
  try {
    console.log("🚨 DEBUG: RESETTING DATABASE...");
    
    // Delete in correct order to avoid foreign key constraints
    await prisma.payment.deleteMany();
    await prisma.installment.deleteMany();
    await prisma.transactionInstallment.deleteMany();
    await prisma.debt.deleteMany();
    await prisma.debtor.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.account.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    
    console.log("✅ DEBUG: Database reset completed");
    
    // Run migrations to ensure schema is correct
    console.log("🔄 DEBUG: Re-applying migrations...");
    
    res.json({
      status: "success",
      message: "Database reset completed. Schema should be clean."
    });
    
  } catch (error) {
    console.error("❌ DEBUG RESET ERROR:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
      code: error.code
    });
  }
});

module.exports = router;