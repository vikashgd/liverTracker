/**
 * DATABASE OPTIMIZATION - PHASE 1
 * SAFEST CHANGE: Reduce warmup frequency from 4min to 30min
 * This is the lowest risk change that will immediately reduce costs
 */

const fs = require('fs');
const path = require('path');

async function implementPhase1() {
  console.log('🚀 DATABASE OPTIMIZATION - PHASE 1');
  console.log('===================================');
  console.log('📋 Change: Reduce warmup frequency 4min → 30min');
  console.log('🎯 Risk Level: VERY LOW');
  console.log('💰 Expected Savings: ~60% of warmup costs');
  
  try {
    // 1. Backup current warmup configuration
    await backupCurrentConfig();
    
    // 2. Update warmup interval
    await updateWarmupInterval();
    
    // 3. Verify changes
    await verifyChanges();
    
    console.log('\n✅ PHASE 1 COMPLETED SUCCESSFULLY');
    console.log('📊 Expected Impact:');
    console.log('   - Warmup queries: 360/day → 48/day (87% reduction)');
    console.log('   - Monthly warmup queries: 10,800 → 1,440 (87% reduction)');
    console.log('   - Estimated cost savings: $20-25/month');
    console.log('\n⏰ Monitor for 24 hours before proceeding to Phase 2');
    
    return true;
  } catch (error) {
    console.error('❌ PHASE 1 FAILED:', error.message);
    console.log('\n🔄 Attempting automatic rollback...');
    await rollbackPhase1();
    return false;
  }
}

async function backupCurrentConfig() {
  console.log('\n📦 Creating backup of current configuration...');
  
  const warmupFile = path.join(__dirname, 'src/lib/db-warmup.ts');
  const backupFile = path.join(__dirname, 'src/lib/db-warmup.ts.backup-phase1');
  
  if (fs.existsSync(warmupFile)) {
    fs.copyFileSync(warmupFile, backupFile);
    console.log('   ✅ Backup created: db-warmup.ts.backup-phase1');
  } else {
    throw new Error('db-warmup.ts not found');
  }
}

async function updateWarmupInterval() {
  console.log('\n🔧 Updating warmup interval...');
  
  const warmupFile = path.join(__dirname, 'src/lib/db-warmup.ts');
  let content = fs.readFileSync(warmupFile, 'utf8');
  
  // Find and replace the warmup interval
  const oldInterval = 'const WARMUP_INTERVAL = 4 * 60 * 1000; // 4 minutes (before 5-minute sleep)';
  const newInterval = 'const WARMUP_INTERVAL = 30 * 60 * 1000; // 30 minutes (optimized for cost)';
  
  if (content.includes(oldInterval)) {
    content = content.replace(oldInterval, newInterval);
    fs.writeFileSync(warmupFile, content);
    console.log('   ✅ Warmup interval updated: 4min → 30min');
  } else {
    throw new Error('Could not find warmup interval to update');
  }
}

async function verifyChanges() {
  console.log('\n🔍 Verifying changes...');
  
  const warmupFile = path.join(__dirname, 'src/lib/db-warmup.ts');
  const content = fs.readFileSync(warmupFile, 'utf8');
  
  if (content.includes('30 * 60 * 1000')) {
    console.log('   ✅ Warmup interval correctly set to 30 minutes');
  } else {
    throw new Error('Warmup interval not properly updated');
  }
  
  if (content.includes('// 30 minutes (optimized for cost)')) {
    console.log('   ✅ Comment updated to reflect optimization');
  } else {
    throw new Error('Comment not properly updated');
  }
}

async function rollbackPhase1() {
  console.log('\n🔄 Rolling back Phase 1 changes...');
  
  try {
    const warmupFile = path.join(__dirname, 'src/lib/db-warmup.ts');
    const backupFile = path.join(__dirname, 'src/lib/db-warmup.ts.backup-phase1');
    
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, warmupFile);
      console.log('   ✅ Rollback completed - warmup interval restored to 4 minutes');
    } else {
      throw new Error('Backup file not found for rollback');
    }
  } catch (error) {
    console.error('   ❌ Rollback failed:', error.message);
    console.log('   🚨 MANUAL INTERVENTION REQUIRED');
    console.log('   📝 Manually restore db-warmup.ts from git or backup');
  }
}

async function testPhase1() {
  console.log('\n🧪 Testing Phase 1 changes...');
  
  try {
    // Test that the warmup still works, just less frequently
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test basic database connectivity
    await prisma.$queryRaw\`SELECT 1 as test\`;
    await prisma.$disconnect();
    
    console.log('   ✅ Database connectivity test passed');
    
    // Check if warmup file has correct interval
    const warmupFile = path.join(__dirname, 'src/lib/db-warmup.ts');
    const content = fs.readFileSync(warmupFile, 'utf8');
    
    if (content.includes('30 * 60 * 1000')) {
      console.log('   ✅ Warmup interval correctly set to 30 minutes');
      return true;
    } else {
      throw new Error('Warmup interval not properly set');
    }
  } catch (error) {
    console.error('   ❌ Phase 1 test failed:', error.message);
    return false;
  }
}

// Run Phase 1 if called directly
if (require.main === module) {
  implementPhase1()
    .then(success => {
      if (success) {
        console.log('\n🎉 PHASE 1 DEPLOYMENT SUCCESSFUL');
        console.log('📈 Monitor your Neon dashboard for reduced query frequency');
        console.log('⏰ Wait 24 hours, then run Phase 2');
        process.exit(0);
      } else {
        console.log('\n⚠️  PHASE 1 DEPLOYMENT FAILED');
        console.log('🔍 Check logs above for details');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 PHASE 1 CRASHED:', error);
      process.exit(1);
    });
}

module.exports = { implementPhase1, rollbackPhase1, testPhase1 };