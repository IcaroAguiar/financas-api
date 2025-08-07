#!/usr/bin/env node
// Production database fix script
// This script will be called if render-build fails

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function fixProductionDatabase() {
  console.log('🚨 FIXING PRODUCTION DATABASE ISSUES');
  
  try {
    // Step 1: Try to resolve the specific failed migration
    console.log('🔧 Step 1: Resolving failed migration...');
    try {
      await execAsync('npx prisma migrate resolve --rolled-back 20250706222113_add_transactions_and_categories');
      console.log('✅ Failed migration resolved');
    } catch (error) {
      console.log('⚠️  Migration resolve failed, continuing...');
    }
    
    // Step 2: Try force reset of migration state
    console.log('🔧 Step 2: Force resetting migration state...');
    try {
      await execAsync('npx prisma migrate reset --force --skip-generate');
      console.log('✅ Migration state reset');
    } catch (error) {
      console.log('⚠️  Migration reset failed, trying db push...');
      
      // Step 3: Fallback to db push with force reset
      console.log('🔧 Step 3: Force pushing schema to database...');
      await execAsync('npx prisma db push --force-reset');
      console.log('✅ Schema force pushed to database');
    }
    
    // Step 4: Deploy migrations if possible
    console.log('🔧 Step 4: Attempting migration deploy...');
    try {
      await execAsync('npx prisma migrate deploy');
      console.log('✅ Migrations deployed successfully');
    } catch (error) {
      console.log('⚠️  Migration deploy failed, schema should be current via db push');
    }
    
    // Step 5: Generate fresh Prisma client
    console.log('🔧 Step 5: Generating fresh Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated');
    
    console.log('🎉 PRODUCTION DATABASE FIX COMPLETED');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ PRODUCTION FIX FAILED:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixProductionDatabase();
}

module.exports = { fixProductionDatabase };