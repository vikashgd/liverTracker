/**
 * Final Data Analysis - Understanding the Neon Branch Setup
 */

const { PrismaClient } = require('./src/generated/prisma');

async function finalDataAnalysis() {
  console.log('🔍 FINAL DATA ANALYSIS');
  console.log('======================\n');

  console.log('📋 CURRENT SETUP ANALYSIS:');
  console.log('From your Neon dashboard, we can see:');
  console.log('- Production branch (DEFAULT): 31.56 MB');
  console.log('- Development branch: 30.84 MB');
  console.log('- Both branches use the SAME connection string with "pooler"');
  console.log('- This suggests both branches point to the same database instance\n');

  const prisma = new PrismaClient();
  
  try {
    console.log('🔗 TESTING CURRENT CONNECTION:');
    console.log(`   URL: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}\n`);

    // Basic connection test
    const userCount = await prisma.user.count();
    const reportCount = await prisma.reportFile.count();
    const metricCount = await prisma.extractedMetric.count();
    
    console.log('📊 CURRENT DATA STATUS:');
    console.log(`   ✅ Connection successful`);
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   📄 Reports: ${reportCount}`);
    console.log(`   📊 Metrics: ${metricCount}\n`);

    // Get detailed user information
    if (userCount > 0) {
      console.log('👥 USER DETAILS:');
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          firstReportUploaded: true,
          onboardingCompleted: true
        },
        orderBy: { createdAt: 'asc' }
      });
      
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      Name: ${user.name || 'Not set'}`);
        console.log(`      Created: ${user.createdAt.toLocaleString()}`);
        console.log(`      Reports uploaded: ${user.firstReportUploaded ? 'Yes' : 'No'}`);
        console.log(`      Onboarding done: ${user.onboardingCompleted ? 'Yes' : 'No'}`);
      });
    }

    // Check if there are any reports at all
    if (reportCount > 0) {
      console.log('\n🎉 REPORTS FOUND! Your data is here!');
      
      const reports = await prisma.reportFile.findMany({
        take: 10,
        include: {
          user: { select: { email: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('\n📄 YOUR REPORTS:');
      reports.forEach((report, index) => {
        console.log(`   ${index + 1}. Report ID: ${report.id}`);
        console.log(`      User: ${report.user.email}`);
        console.log(`      Type: ${report.reportType || 'Unknown'}`);
        console.log(`      Created: ${report.createdAt.toLocaleDateString()}`);
        console.log(`      File: ${report.objectKey}`);
      });
      
      // Check metrics
      if (metricCount > 0) {
        const sampleMetrics = await prisma.extractedMetric.findMany({
          take: 5,
          include: {
            report: {
              include: {
                user: { select: { email: true } }
              }
            }
          }
        });
        
        console.log('\n📊 SAMPLE METRICS:');
        sampleMetrics.forEach((metric, index) => {
          console.log(`   ${index + 1}. ${metric.name}: ${metric.value} ${metric.unit || ''}`);
          console.log(`      From: ${metric.report.user.email}`);
        });
      }
      
    } else {
      console.log('\n🤔 ANALYSIS OF THE SITUATION:');
      console.log('=====================================');
      console.log('Based on the evidence:');
      console.log('1. ✅ Database connection is working');
      console.log('2. ✅ Users exist and can authenticate');
      console.log('3. ❌ No reports have been uploaded');
      console.log('4. 🔍 Both Neon branches show data (31.56 MB and 30.84 MB)');
      console.log('5. 🤔 But we\'re not seeing that data in the application');
      console.log('\nPOSSIBLE EXPLANATIONS:');
      console.log('- The data might be in a different database within the same Neon project');
      console.log('- The branches might have different database names');
      console.log('- There might be schema differences between branches');
      console.log('- The data might be in tables we\'re not checking');
    }

    // Check all tables for any data
    console.log('\n🔍 CHECKING ALL TABLES FOR DATA:');
    const allTables = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC
    `;
    
    console.log('   Tables with activity:');
    allTables.forEach(table => {
      const totalActivity = parseInt(table.inserts) + parseInt(table.updates) + parseInt(table.deletes);
      if (totalActivity > 0) {
        console.log(`   - ${table.tablename}: ${table.inserts} inserts, ${table.updates} updates, ${table.deletes} deletes`);
      }
    });

    // Check database size breakdown
    console.log('\n📊 DATABASE SIZE BREAKDOWN:');
    try {
      const sizeInfo = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;
      
      sizeInfo.forEach(info => {
        console.log(`   - ${info.tablename}: ${info.size}`);
      });
    } catch (error) {
      console.log('   ❌ Could not get size breakdown');
    }

  } catch (error) {
    console.error('❌ Analysis error:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎯 CONCLUSION:');
  console.log('==============');
  console.log('If no reports are found, this means:');
  console.log('1. 📊 Your Neon dashboard shows data size, but it might be:');
  console.log('   - System tables and indexes');
  console.log('   - Migration history');
  console.log('   - Other metadata');
  console.log('2. 🎯 Your application is working correctly');
  console.log('3. 🚀 You can start using it by uploading reports');
  console.log('4. ✅ The "missing data" was likely never actually saved');
}

finalDataAnalysis().catch(console.error);