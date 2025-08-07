// Debug Prisma Client Generation
const { PrismaClient } = require("@prisma/client");

console.log("🔍 DEBUGGING PRISMA CLIENT...");

try {
  const prisma = new PrismaClient();
  
  // Check if Prisma client has the expected fields
  console.log("📋 Checking Prisma client structure...");
  
  // Test transaction model structure
  console.log("Transaction model available:", !!prisma.transaction);
  
  if (prisma.transaction) {
    console.log("Transaction methods:", Object.getOwnPropertyNames(prisma.transaction));
  }
  
  // Test user model structure
  console.log("User model available:", !!prisma.user);
  
  // Check Prisma client version and generation
  console.log("Prisma client info:", {
    version: require("@prisma/client").version || "unknown",
    clientVersion: prisma._clientVersion || "unknown"
  });
  
  // Try to introspect the database schema
  console.log("🔍 Testing database connection...");
  prisma.$connect().then(async () => {
    console.log("✅ Database connected successfully");
    
    // Try to get basic table info
    try {
      const result = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;
      console.log("📊 Database tables:", result);
    } catch (error) {
      console.error("❌ Database query failed:", error.message);
    }
    
    prisma.$disconnect();
  }).catch(error => {
    console.error("❌ Database connection failed:", error.message);
  });
  
} catch (error) {
  console.error("❌ Prisma client initialization failed:", error.message);
  console.error("Stack:", error.stack);
}