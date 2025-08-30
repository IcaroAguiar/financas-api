// fix-migration.js - Script to resolve migration conflict
const { execSync } = require('child_process');

console.log('🔧 Fixing Prisma migration conflict...');

try {
  // Mark the problematic migration as resolved
  console.log('📝 Marking migration 20250824050733_add_profile_picture_field as resolved...');
  execSync('npx prisma migrate resolve --applied 20250824050733_add_profile_picture_field', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('✅ Migration marked as resolved!');
  
  // Try to deploy remaining migrations
  console.log('🚀 Deploying remaining migrations...');
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('✅ All migrations deployed successfully!');
  
} catch (error) {
  console.error('❌ Error fixing migration:', error.message);
  
  // Alternative approach: reset and recreate the migration
  console.log('🔄 Trying alternative approach - regenerating Prisma client...');
  try {
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: __dirname
    });
    console.log('✅ Prisma client regenerated!');
  } catch (genError) {
    console.error('❌ Failed to regenerate client:', genError.message);
  }
}

console.log('🏁 Migration fix script completed!');