/**
 * Emergency Reports API Fix
 * Replaces problematic Prisma constructors with standard ones
 */

const fs = require('fs');
const path = require('path');

function fixReportsAPI() {
  console.log('🚨 EMERGENCY REPORTS API FIX');
  console.log('============================\n');

  const filePath = path.join(__dirname, 'src/app/api/reports/route.ts');
  
  try {
    // Read the current file
    let content = fs.readFileSync(filePath, 'utf8');
    console.log('📖 Read reports API file');
    
    // Replace the problematic Prisma constructor pattern
    const problematicPattern = /const prisma = new PrismaClient\(\{\s*log: \['error', 'warn'\],\s*datasources: \{\s*db: \{\s*url: process\.env\.DATABASE_URL\s*\}\s*\}\s*\}\);/g;
    
    const fixedPattern = 'const prisma = new PrismaClient();';
    
    const originalContent = content;
    content = content.replace(problematicPattern, fixedPattern);
    
    if (content !== originalContent) {
      // Write the fixed content back
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('✅ Fixed Prisma client constructors in reports API');
      console.log('🔧 Replaced problematic constructors with standard ones');
    } else {
      console.log('ℹ️  No problematic patterns found to fix');
    }
    
  } catch (error) {
    console.error('❌ Error fixing reports API:', error.message);
  }
}

fixReportsAPI();