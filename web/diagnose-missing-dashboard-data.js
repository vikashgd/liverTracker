#!/usr/bin/env node

/**
 * DIAGNOSE MISSING DASHBOARD DATA
 * Comprehensive check for why recently uploaded data isn't showing on dashboard
 */

const { PrismaClient } = require('./src/generated/prisma');

async function diagnoseMissingDashboardData() {
  console.log('🔍 DIAGNOSING MISSING DASHBOARD DATA');
  console.log('=====================================\n');

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Step 1: Check recent uploads
    console.log('📁 STEP 1: Checking Recent Uploads');
    console.log('----------------------------------');
    
    const recentReports = await prisma.reportFile.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        user: {
          select: { id: true, email: true }
        },
        metrics: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`Found ${recentReports.length} reports uploaded in last 24 hours:`);
    
    if (recentReports.length === 0) {
      console.log('❌ NO RECENT UPLOADS FOUND');
      console.log('   - Check if upload actually completed');
      console.log('   - Check if files are in Google Cloud Storage');
      console.log('   - Check upload logs for errors\n');
      return;
    }

    recentReports.forEach((report, index) => {
      const minutesAgo = Math.round((Date.now() - report.createdAt.getTime()) / (1000 * 60));
      console.log(`\n${index + 1}. Report ID: ${report.id}`);
      console.log(`   User: ${report.user.email} (${report.user.id})`);
      console.log(`   Uploaded: ${minutesAgo} minutes ago`);
      console.log(`   Report Date: ${report.reportDate || 'Not set'}`);
      console.log(`   Report Type: ${report.reportType || 'Not set'}`);
      console.log(`   Object Key: ${report.objectKey}`);
      console.log(`   Extracted Metrics: ${report.metrics.length}`);
      console.log(`   Has Extracted JSON: ${!!report.extractedJson}`);
    });

    // Step 2: Check AI extraction status
    console.log('\n\n🤖 STEP 2: Checking AI Extraction Status');
    console.log('----------------------------------------');
    
    const reportsWithoutExtraction = recentReports.filter(r => !r.extractedJson);
    const reportsWithoutMetrics = recentReports.filter(r => r.metrics.length === 0);
    
    if (reportsWithoutExtraction.length > 0) {
      console.log(`❌ ${reportsWithoutExtraction.length} reports missing AI extraction:`);
      reportsWithoutExtraction.forEach(report => {
        console.log(`   - ${report.id} (${report.user.email})`);
      });
      console.log('\n   POSSIBLE CAUSES:');
      console.log('   - AI extraction service failed');
      console.log('   - PDF processing error');
      console.log('   - Network timeout during extraction');
    }

    if (reportsWithoutMetrics.length > 0) {
      console.log(`❌ ${reportsWithoutMetrics.length} reports missing extracted metrics:`);
      reportsWithoutMetrics.forEach(report => {
        console.log(`   - ${report.id} (${report.user.email})`);
      });
      console.log('\n   POSSIBLE CAUSES:');
      console.log('   - Medical platform processing failed');
      console.log('   - Data normalization error');
      console.log('   - Database insertion failed');
    }

    // Step 3: Check specific metrics extraction
    console.log('\n\n📊 STEP 3: Checking Extracted Metrics Details');
    console.log('---------------------------------------------');
    
    const allMetrics = await prisma.extractedMetric.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        report: {
          include: {
            user: {
              select: { id: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${allMetrics.length} metrics extracted in last 24 hours:`);
    
    if (allMetrics.length === 0) {
      console.log('❌ NO METRICS EXTRACTED');
      console.log('   This is the main problem - no data to show on dashboard');
    } else {
      // Group by user
      const metricsByUser = {};
      allMetrics.forEach(metric => {
        const userId = metric.report.userId;
        const userEmail = metric.report.user.email;
        if (!metricsByUser[userId]) {
          metricsByUser[userId] = {
            email: userEmail,
            metrics: []
          };
        }
        metricsByUser[userId].metrics.push(metric);
      });

      Object.entries(metricsByUser).forEach(([userId, data]) => {
        console.log(`\n👤 User: ${data.email} (${userId})`);
        console.log(`   Metrics extracted: ${data.metrics.length}`);
        
        // Show metric breakdown
        const metricCounts = {};
        data.metrics.forEach(m => {
          metricCounts[m.name] = (metricCounts[m.name] || 0) + 1;
        });
        
        console.log('   Metric breakdown:');
        Object.entries(metricCounts).forEach(([name, count]) => {
          console.log(`     - ${name}: ${count}`);
        });
      });
    }

    // Step 4: Check dashboard API response
    console.log('\n\n🌐 STEP 4: Testing Dashboard API');
    console.log('--------------------------------');
    
    // Test chart-data API for recent users
    const recentUsers = [...new Set(recentReports.map(r => r.userId))];
    
    for (const userId of recentUsers.slice(0, 3)) { // Test first 3 users
      const user = recentReports.find(r => r.userId === userId).user;
      console.log(`\n🧪 Testing API for user: ${user.email}`);
      
      // Test common metrics
      const testMetrics = ['ALT', 'AST', 'Bilirubin', 'Albumin', 'Platelets'];
      
      for (const metric of testMetrics) {
        try {
          const chartMetrics = await prisma.extractedMetric.findMany({
            where: {
              name: metric,
              report: {
                userId: userId
              }
            },
            include: {
              report: {
                select: {
                  reportDate: true,
                  createdAt: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          });

          if (chartMetrics.length > 0) {
            console.log(`   ✅ ${metric}: ${chartMetrics.length} data points`);
            const latest = chartMetrics[0];
            const minutesAgo = Math.round((Date.now() - latest.createdAt.getTime()) / (1000 * 60));
            console.log(`      Latest: ${latest.value} ${latest.unit} (${minutesAgo} min ago)`);
          } else {
            console.log(`   ❌ ${metric}: No data found`);
          }
        } catch (error) {
          console.log(`   ❌ ${metric}: API Error - ${error.message}`);
        }
      }
    }

    // Step 5: Check caching issues
    console.log('\n\n💾 STEP 5: Checking Potential Caching Issues');
    console.log('--------------------------------------------');
    
    console.log('Dashboard uses no-cache headers, but check:');
    console.log('1. Browser cache - Try hard refresh (Ctrl+F5)');
    console.log('2. CDN cache - If using Vercel/Cloudflare');
    console.log('3. API response headers - Should have no-cache');
    console.log('4. Session contamination - Check user isolation');

    // Step 6: Check database connectivity
    console.log('\n\n🔌 STEP 6: Database Connectivity Check');
    console.log('-------------------------------------');
    
    try {
      const dbTest = await prisma.$queryRaw`SELECT NOW() as current_time`;
      console.log('✅ Database connection: OK');
      console.log(`   Current DB time: ${dbTest[0].current_time}`);
    } catch (error) {
      console.log('❌ Database connection: FAILED');
      console.log(`   Error: ${error.message}`);
    }

    // Step 7: Summary and recommendations
    console.log('\n\n📋 STEP 7: Summary & Recommendations');
    console.log('====================================');
    
    const hasRecentUploads = recentReports.length > 0;
    const hasExtractedData = allMetrics.length > 0;
    const hasCompleteProcessing = recentReports.some(r => r.extractedJson && r.metrics.length > 0);
    
    console.log('\n🔍 DIAGNOSIS:');
    
    if (!hasRecentUploads) {
      console.log('❌ PRIMARY ISSUE: No recent uploads found');
      console.log('   → Check if upload process completed successfully');
    } else if (!hasExtractedData) {
      console.log('❌ PRIMARY ISSUE: Upload succeeded but no metrics extracted');
      console.log('   → AI extraction or medical platform processing failed');
    } else if (!hasCompleteProcessing) {
      console.log('❌ PRIMARY ISSUE: Partial processing - some steps failed');
      console.log('   → Check extraction and normalization pipeline');
    } else {
      console.log('✅ Data pipeline appears healthy');
      console.log('   → Issue might be frontend caching or API routing');
    }

    console.log('\n🛠️  IMMEDIATE ACTIONS:');
    console.log('1. Hard refresh dashboard (Ctrl+F5)');
    console.log('2. Check browser console for API errors');
    console.log('3. Verify you\'re logged in as the correct user');
    console.log('4. Check if data appears in Reports page');
    console.log('5. Try manual lab entry to test dashboard updates');

    if (!hasCompleteProcessing) {
      console.log('\n🔧 TECHNICAL FIXES NEEDED:');
      console.log('1. Check AI extraction service logs');
      console.log('2. Verify medical platform processing');
      console.log('3. Check database constraints and validations');
      console.log('4. Review error handling in upload pipeline');
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    console.log('\nThis error suggests a fundamental database or connection issue.');
  } finally {
    await prisma.$disconnect();
  }
}

// Run diagnosis
diagnoseMissingDashboardData().catch(console.error);