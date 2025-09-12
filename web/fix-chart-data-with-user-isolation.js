#!/usr/bin/env node

/**
 * Fix Chart Data API with Proper User Isolation
 * 
 * Issue: Chart data API returns empty data after emergency fix
 * Solution: Implement proper data fetching with bulletproof user isolation
 */

const fs = require('fs');
const path = require('path');

function fixChartDataAPI() {
  console.log('📊 FIXING CHART DATA API WITH USER ISOLATION');
  console.log('='.repeat(60));

  const chartApiPath = path.join(__dirname, 'src/app/api/chart-data/route.ts');
  const chartApiContent = `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PrismaClient } from '../../../generated/prisma';

export async function GET(request: NextRequest) {
  console.log('📊 Chart Data API: Starting request');
  
  try {
    // CRITICAL: Fresh session check
    const session = await getServerSession(authOptions);
    console.log('📊 Chart Data API: Session check', { 
      hasSession: !!session, 
      userId: session?.user?.id 
    });

    if (!session?.user?.id) {
      console.log('❌ Chart Data API: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      });
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const metric = url.searchParams.get('metric');

    console.log(\`📊 Chart Data API: Request for metric "\${metric}" by user \${userId}\`);

    if (!metric) {
      console.log('❌ Chart Data API: No metric specified');
      return NextResponse.json({ error: 'Metric parameter required' }, { status: 400 });
    }

    // CRITICAL: Fresh Prisma client
    const prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    try {
      // CRITICAL: Verify user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true }
      });

      if (!userExists) {
        console.log('❌ Chart Data API: User not found:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      console.log(\`✅ Chart Data API: User verified: \${userExists.email}\`);

      // CRITICAL: Get extracted metrics with STRICT user filtering
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
      });

      console.log(\`📊 Chart Data API: Found \${extractedMetrics.length} metrics for \${metric}\`);

      // CRITICAL: Verify ALL returned data belongs to requesting user
      const contaminated = extractedMetrics.filter(m => m.report.userId !== userId);
      if (contaminated.length > 0) {
        console.error('🚨 CRITICAL: Chart data contamination detected!', {
          requestingUser: userId,
          contaminatedMetrics: contaminated.map(m => ({ 
            id: m.id, 
            reportUserId: m.report.userId 
          }))
        });
        
        // Return empty data if contamination detected
        return NextResponse.json({
          data: [],
          metric: metric,
          userId: userId,
          error: 'Data contamination detected'
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'X-User-ID': userId,
            'X-Contamination-Detected': 'true'
          }
        });
      }

      // Transform to chart data format
      const chartData = extractedMetrics.map(metric => ({
        date: metric.report.reportDate || metric.report.createdAt,
        value: metric.value || 0,
        unit: metric.unit || '',
        reportId: metric.report.id,
        metricId: metric.id
      }));

      console.log(\`✅ Chart Data API: Returning \${chartData.length} clean data points for user \${userId}\`);

      const response = {
        data: chartData,
        metric: metric,
        userId: userId,
        count: chartData.length
      };

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'X-User-ID': userId,
          'X-Metric': metric,
          'X-Data-Count': chartData.length.toString()
        }
      });

    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('❌ Chart Data API: Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      metric: new URL(request.url).searchParams.get('metric')
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  }
}`;

  fs.writeFileSync(chartApiPath, chartApiContent);
  console.log('✅ Fixed chart data API with proper user isolation and data fetching');

  // Create test script
  const testScriptPath = path.join(__dirname, 'test-chart-data-fix.js');
  const testScriptContent = `#!/usr/bin/env node

/**
 * Test Chart Data Fix
 */

console.log('🧪 TESTING CHART DATA FIX');
console.log('='.repeat(50));

console.log('\\n📋 TESTING STEPS:');
console.log('1. Login to dashboard');
console.log('2. Check that charts show data (not empty)');
console.log('3. Verify each user sees only their own chart data');
console.log('4. Check browser console for chart data logs');

console.log('\\n🔍 WHAT TO LOOK FOR:');
console.log('✅ Dashboard charts show actual data points');
console.log('✅ Console shows: "Found X metrics for [metric]"');
console.log('✅ Console shows: "Returning X clean data points"');
console.log('✅ No contamination warnings in console');

console.log('\\n📊 EXPECTED BEHAVIOR:');
console.log('- Users with uploaded reports should see chart data');
console.log('- Users without reports should see empty charts');
console.log('- Each user sees only their own medical data');
console.log('- No cross-contamination between users');

console.log('\\n🚨 RED FLAGS:');
console.log('❌ All charts still empty despite having reports');
console.log('❌ Console shows "Data contamination detected"');
console.log('❌ Users see other users\\' chart data');
console.log('❌ API errors in browser network tab');`;

  fs.writeFileSync(testScriptPath, testScriptContent);
  console.log('✅ Created chart data test script');

  console.log('\\n🎯 CHART DATA FIX COMPLETE');
  console.log('='.repeat(60));
  console.log('✅ Implemented proper data fetching with user isolation');
  console.log('✅ Added contamination detection for chart data');
  console.log('✅ Maintained bulletproof security measures');
  console.log('✅ Created testing procedures');
  
  console.log('\\n📋 NEXT STEPS:');
  console.log('1. Build and deploy the fix');
  console.log('2. Test dashboard charts show data');
  console.log('3. Verify user isolation is maintained');
  console.log('4. Check for any remaining issues');
}

// Run the fix
fixChartDataAPI();