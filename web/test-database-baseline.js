/**
 * DATABASE BASELINE TEST
 * Test all critical functionality BEFORE optimization changes
 * This establishes our baseline to compare against after changes
 */

const { PrismaClient } = require('@prisma/client');

// Test configuration
const TEST_USER_ID = 'cmg0ip2yc0000l804tadf7ilx'; // Your test user
const TEST_EMAIL = 'amzfan09@gmail.com';

async function runBaselineTests() {
  console.log('🧪 RUNNING DATABASE BASELINE TESTS');
  console.log('=====================================');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Database Connection
  await testDatabaseConnection(results);
  
  // Test 2: User Authentication Flow
  await testUserAuthentication(results);
  
  // Test 3: Profile Operations
  await testProfileOperations(results);
  
  // Test 4: Reports Operations
  await testReportsOperations(results);
  
  // Test 5: Chart Data API
  await testChartDataAPI(results);
  
  // Test 6: Onboarding API
  await testOnboardingAPI(results);
  
  // Test 7: File Operations
  await testFileOperations(results);
  
  // Summary
  console.log('\n📊 BASELINE TEST SUMMARY');
  console.log('========================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests.filter(t => !t.passed).forEach(test => {
      console.log(`   - ${test.name}: ${test.error}`);
    });
  }
  
  // Save baseline results
  const fs = require('fs');
  fs.writeFileSync('baseline-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Baseline results saved to baseline-test-results.json');
  
  return results.failed === 0;
}

async function testDatabaseConnection(results) {
  const testName = 'Database Connection';
  console.log(`\n🔍 Testing: ${testName}`);
  
  try {
    const prisma = new PrismaClient();
    await prisma.$queryRaw\`SELECT 1 as test\`;
    await prisma.$disconnect();
    
    console.log('   ✅ Database connection successful');
    results.passed++;
    results.tests.push({ name: testName, passed: true });
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message);
    results.failed++;
    results.tests.push({ name: testName, passed: false, error: error.message });
  }
}

async function testUserAuthentication(results) {
  const testName = 'User Authentication';
  console.log(`\n🔍 Testing: ${testName}`);
  
  try {
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: TEST_USER_ID },
      select: { id: true, email: true }
    });
    await prisma.$disconnect();
    
    if (user && user.email === TEST_EMAIL) {
      console.log('   ✅ User authentication data accessible');
      results.passed++;
      results.tests.push({ name: testName, passed: true });
    } else {
      throw new Error('User not found or email mismatch');
    }
  } catch (error) {
    console.log('   ❌ User authentication failed:', error.message);
    results.failed++;
    results.tests.push({ name: testName, passed: false, error: error.message });
  }
}

async function testProfileOperations(results) {
  const testName = 'Profile Operations';
  console.log(`\n🔍 Testing: ${testName}`);
  
  try {
    const prisma = new PrismaClient();
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: TEST_USER_ID }
    });
    await prisma.$disconnect();
    
    if (profile) {
      console.log('   ✅ Profile data accessible');
      console.log(`   📊 Profile: gender=${profile.gender}, height=${profile.height}, weight=${profile.weight}`);
      results.passed++;
      results.tests.push({ name: testName, passed: true });
    } else {
      throw new Error('Profile not found');
    }
  } catch (error) {
    console.log('   ❌ Profile operations failed:', error.message);
    results.failed++;
    results.tests.push({ name: testName, passed: false, error: error.message });
  }
}

async function testReportsOperations(results) {
  const testName = 'Reports Operations';
  console.log(`\n🔍 Testing: ${testName}`);
  
  try {
    const prisma = new PrismaClient();
    const reports = await prisma.reportFile.findMany({
      where: { userId: TEST_USER_ID },
      select: { id: true, filename: true, createdAt: true }
    });
    await prisma.$disconnect();
    
    console.log(`   ✅ Found ${reports.length} reports`);
    if (reports.length > 0) {
      console.log(`   📄 Latest report: ${reports[0].filename}`);
    }
    results.passed++;
    results.tests.push({ name: testName, passed: true });
  } catch (error) {
    console.log('   ❌ Reports operations failed:', error.message);
    results.failed++;
    results.tests.push({ name: testName, passed: false, error: error.message });
  }
}

async function testChartDataAPI(results) {
  const testName = 'Chart Data API';
  console.log(`\n🔍 Testing: ${testName}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/chart-data?metric=ALT', {
      headers: {
        'Cookie': 'next-auth.session-token=test' // This would need real session in practice
      }
    });
    
    if (response.status === 401) {
      console.log('   ✅ Chart Data API responding (auth required as expected)');
      results.passed++;
      results.tests.push({ name: testName, passed: true });
    } else {
      const data = await response.json();
      console.log('   ✅ Chart Data API responding');
      results.passed++;
      results.tests.push({ name: testName, passed: true });
    }
  } catch (error) {
    console.log('   ❌ Chart Data API failed:', error.message);
    results.failed++;
    results.tests.push({ name: testName, passed: false, error: error.message });
  }
}

async function testOnboardingAPI(results) {
  const testName = 'Onboarding API';
  console.log(`\n🔍 Testing: ${testName}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/onboarding');
    
    if (response.status === 401) {
      console.log('   ✅ Onboarding API responding (auth required as expected)');
      results.passed++;
      results.tests.push({ name: testName, passed: true });
    } else {
      const data = await response.json();
      console.log('   ✅ Onboarding API responding');
      results.passed++;
      results.tests.push({ name: testName, passed: true });
    }
  } catch (error) {
    console.log('   ❌ Onboarding API failed:', error.message);
    results.failed++;
    results.tests.push({ name: testName, passed: false, error: error.message });
  }
}

async function testFileOperations(results) {
  const testName = 'File Operations';
  console.log(`\n🔍 Testing: ${testName}`);
  
  try {
    const prisma = new PrismaClient();
    const fileCount = await prisma.reportFile.count({
      where: { userId: TEST_USER_ID }
    });
    await prisma.$disconnect();
    
    console.log(`   ✅ File operations working (${fileCount} files found)`);
    results.passed++;
    results.tests.push({ name: testName, passed: true });
  } catch (error) {
    console.log('   ❌ File operations failed:', error.message);
    results.failed++;
    results.tests.push({ name: testName, passed: false, error: error.message });
  }
}

// Run the tests
if (require.main === module) {
  runBaselineTests()
    .then(success => {
      if (success) {
        console.log('\n🎉 ALL BASELINE TESTS PASSED - READY FOR OPTIMIZATION');
        process.exit(0);
      } else {
        console.log('\n⚠️  SOME BASELINE TESTS FAILED - FIX BEFORE OPTIMIZATION');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 BASELINE TEST SUITE CRASHED:', error);
      process.exit(1);
    });
}

module.exports = { runBaselineTests };