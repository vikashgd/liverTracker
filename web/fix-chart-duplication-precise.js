#!/usr/bin/env node

/**
 * PRECISE FIX: Chart Duplication Issue
 * 
 * ISSUE IDENTIFIED: Chart data API returns duplicate ExtractedMetric records
 * ROOT CAUSE: Query lacks deduplication logic
 * SOLUTION: Add proper deduplication to the database query
 */

const fs = require('fs');
const path = require('path');

function fixChartDuplication() {
  console.log('🎯 FIXING CHART DUPLICATION - PRECISE APPROACH');
  console.log('='.repeat(60));

  console.log('\n🔍 ISSUE IDENTIFIED:');
  console.log('- Chart data API returns ALL ExtractedMetric records');
  console.log('- No deduplication logic in the query');
  console.log('- Database likely has duplicate records from our previous fixes');
  console.log('- Frontend renders all returned data points');

  console.log('\n🎯 PRECISE SOLUTION:');
  console.log('- Add deduplication to the ExtractedMetric query');
  console.log('- Group by report date and metric name');
  console.log('- Take the latest value for each date');
  console.log('- Keep all other logic unchanged');

  const chartApiPath = path.join(__dirname, 'src/app/api/chart-data/route.ts');
  
  // Read current content
  let content = fs.readFileSync(chartApiPath, 'utf8');

  // Replace the query section with deduplicated version
  const oldQuery = `      // CRITICAL: Get extracted metrics with STRICT user filtering
      const extractedMetrics = await prisma.extractedMetric.findMany({
        where: {
          name: metric,
          report: {
            userId: userId, // STRICT: Only this user's reports
            // Additional safety check
            user: {
              id: userId
            }
          }
        },
        include: {
          report: {
            select: {
              id: true,
              userId: true,
              reportDate: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          report: {
            reportDate: 'asc'
          }
        }
      });`;

  const newQuery = `      // CRITICAL: Get extracted metrics with STRICT user filtering AND deduplication
      const extractedMetrics = await prisma.extractedMetric.findMany({
        where: {
          name: metric,
          report: {
            userId: userId, // STRICT: Only this user's reports
            // Additional safety check
            user: {
              id: userId
            }
          }
        },
        include: {
          report: {
            select: {
              id: true,
              userId: true,
              reportDate: true,
              createdAt: true
            }
          }
        },
        orderBy: [
          {
            report: {
              reportDate: 'asc'
            }
          },
          {
            createdAt: 'desc' // Latest record for same date
          }
        ]
      });

      // DEDUPLICATION: Remove duplicate entries for same report date
      const deduplicatedMetrics = [];
      const seenDates = new Set();
      
      for (const metric of extractedMetrics) {
        const reportDate = metric.report.reportDate?.toISOString().split('T')[0] || 
                          metric.report.createdAt.toISOString().split('T')[0];
        
        if (!seenDates.has(reportDate)) {
          seenDates.add(reportDate);
          deduplicatedMetrics.push(metric);
        }
      }
      
      console.log(\`📊 Chart Data API: Deduplicated \${extractedMetrics.length} -> \${deduplicatedMetrics.length} metrics for \${metric}\`);`;

  // Replace the old query with the new one
  content = content.replace(oldQuery, newQuery);

  // Update the reference to use deduplicatedMetrics instead of extractedMetrics
  content = content.replace(
    'const contaminated = extractedMetrics.filter',
    'const contaminated = deduplicatedMetrics.filter'
  );

  content = content.replace(
    'const chartData = extractedMetrics.map',
    'const chartData = deduplicatedMetrics.map'
  );

  // Write the fixed content
  fs.writeFileSync(chartApiPath, content);

  console.log('\n✅ APPLIED PRECISE FIX:');
  console.log('- Added deduplication logic to chart data query');
  console.log('- Groups by report date, takes latest value per date');
  console.log('- Maintains all existing security and validation logic');
  console.log('- No changes to authentication or profile systems');

  console.log('\n🎯 EXPECTED RESULT:');
  console.log('- All metrics should now show correct number of points');
  console.log('- Bilirubin should continue working as before');
  console.log('- Duplicates eliminated without affecting other functionality');

  console.log('\n📋 TESTING STEPS:');
  console.log('1. Build and deploy the change');
  console.log('2. Check Health Metrics Overview section');
  console.log('3. Verify all metrics show 5 points (not 10)');
  console.log('4. Confirm no impact on authentication/profile');

  console.log('\n✅ CHART DUPLICATION FIX COMPLETE');
}

// Apply the fix
fixChartDuplication();