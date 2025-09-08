/**
 * Comprehensive fix for trends data issue
 * This script will identify and fix common problems with trends data
 */

const fs = require('fs');
const path = require('path');

function fixTrendsDataIssue() {
  console.log('🔧 Applying comprehensive fixes for trends data issue...\n');

  // Fix 1: Update the medical data aggregator to handle missing chart data gracefully
  console.log('1. 📝 Updating medical data aggregator...');
  
  const aggregatorPath = 'src/lib/medical-sharing/medical-data-aggregator.ts';
  let aggregatorContent = fs.readFileSync(aggregatorPath, 'utf8');
  
  // Add fallback trend data generation if platform fails
  const fallbackTrendMethod = `
  /**
   * Generate fallback trend data directly from database when platform fails
   */
  private async getFallbackTrendData(userId: string): Promise<ChartSeries[]> {
    try {
      console.log('📊 [Fallback] Generating trend data directly from database');
      
      const { prisma } = await import('@/lib/db');
      const commonMetrics = ['ALT', 'AST', 'Bilirubin', 'Platelets', 'Albumin', 'Creatinine', 'INR'];
      const trends: ChartSeries[] = [];

      for (const targetMetric of commonMetrics) {
        // Get metrics that match this target (flexible matching)
        const metrics = await prisma.extractedMetric.findMany({
          where: {
            report: { userId },
            OR: [
              { name: { contains: targetMetric, mode: 'insensitive' } },
              { name: { contains: targetMetric.toLowerCase(), mode: 'insensitive' } },
              { name: { contains: targetMetric.toUpperCase(), mode: 'insensitive' } }
            ],
            value: { not: null }
          },
          include: {
            report: {
              select: {
                reportDate: true
              }
            }
          },
          orderBy: {
            report: { reportDate: 'asc' }
          },
          take: 100
        });

        if (metrics.length > 0) {
          console.log('📊 [Fallback] Found', metrics.length, 'data points for', targetMetric);
          
          // Group by date and take the best value per day
          const dailyData = new Map();
          metrics.forEach(metric => {
            const dateKey = metric.report.reportDate.toISOString().split('T')[0];
            if (!dailyData.has(dateKey) || metric.value !== null) {
              dailyData.set(dateKey, {
                date: metric.report.reportDate,
                value: metric.value,
                unit: metric.unit
              });
            }
          });

          const chartData = Array.from(dailyData.values())
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(point => ({
              date: point.date,
              value: point.value,
              isAbnormal: this.isValueAbnormal(targetMetric, point.value),
              confidence: 0.8
            }));

          if (chartData.length > 0) {
            trends.push({
              name: targetMetric,
              data: chartData,
              unit: this.getStandardUnit(targetMetric),
              referenceRange: this.getStandardReferenceRange(targetMetric)
            });
          }
        }
      }

      console.log('📊 [Fallback] Generated', trends.length, 'trend series');
      return trends;
    } catch (error) {
      console.error('❌ [Fallback] Error generating fallback trend data:', error);
      return [];
    }
  }

  private isValueAbnormal(metric: string, value: number): boolean {
    const ranges = {
      'ALT': { min: 7, max: 40 },
      'AST': { min: 8, max: 40 },
      'Bilirubin': { min: 0.2, max: 1.2 },
      'Platelets': { min: 150, max: 450 },
      'Albumin': { min: 3.5, max: 5.0 },
      'Creatinine': { min: 0.6, max: 1.2 },
      'INR': { min: 0.8, max: 1.2 }
    };
    
    const range = ranges[metric];
    if (!range) return false;
    
    return value < range.min || value > range.max;
  }

  private getStandardUnit(metric: string): string {
    const units = {
      'ALT': 'U/L',
      'AST': 'U/L',
      'Bilirubin': 'mg/dL',
      'Platelets': '×10³/μL',
      'Albumin': 'g/dL',
      'Creatinine': 'mg/dL',
      'INR': ''
    };
    
    return units[metric] || '';
  }

  private getStandardReferenceRange(metric: string): { min: number; max: number; unit: string } | undefined {
    const ranges = {
      'ALT': { min: 7, max: 40, unit: 'U/L' },
      'AST': { min: 8, max: 40, unit: 'U/L' },
      'Bilirubin': { min: 0.2, max: 1.2, unit: 'mg/dL' },
      'Platelets': { min: 150, max: 450, unit: '×10³/μL' },
      'Albumin': { min: 3.5, max: 5.0, unit: 'g/dL' },
      'Creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL' },
      'INR': { min: 0.8, max: 1.2, unit: '' }
    };
    
    return ranges[metric];
  }`;

  // Update the getTrendData method to use fallback
  const updatedGetTrendData = `
  /**
   * Get trend data using existing medical platform with fallback
   */
  private async getTrendData(userId: string): Promise<ChartSeries[]> {
    try {
      console.log('📊 [MedicalDataAggregator] Starting trend data collection for user:', userId);
      
      // First try the medical platform
      const commonMetrics = ['ALT', 'AST', 'Bilirubin', 'Platelets', 'Albumin', 'Creatinine', 'INR'];
      const trends: ChartSeries[] = [];

      for (const metric of commonMetrics) {
        try {
          const chartSeries = await this.platform.getChartData(userId, metric as any);
          
          if (chartSeries && chartSeries.data && chartSeries.data.length > 0) {
            trends.push({
              name: metric,
              data: chartSeries.data.map(point => ({
                date: new Date(point.date),
                value: point.value,
                isAbnormal: point.confidence === 'low' || point.confidence === 'reject',
                confidence: this.mapConfidenceToNumber(point.confidence)
              })),
              unit: this.extractUnitFromChartSeries(chartSeries, metric),
              referenceRange: this.extractReferenceRange(chartSeries, metric)
            });
          }
        } catch (metricError) {
          console.warn('Could not get trend data for', metric, ':', metricError.message);
        }
      }

      console.log('📊 [MedicalDataAggregator] Platform trends collected:', trends.length);

      // If we got no trends from the platform, try fallback method
      if (trends.length === 0) {
        console.log('📊 [MedicalDataAggregator] No trends from platform, trying fallback...');
        const fallbackTrends = await this.getFallbackTrendData(userId);
        trends.push(...fallbackTrends);
      }

      console.log('📊 [MedicalDataAggregator] Total trends collected:', trends.length);
      return trends;
    } catch (error) {
      console.error('❌ [MedicalDataAggregator] Error getting trend data:', error);
      
      // Last resort: try fallback method
      try {
        console.log('📊 [MedicalDataAggregator] Trying fallback as last resort...');
        return await this.getFallbackTrendData(userId);
      } catch (fallbackError) {
        console.error('❌ [MedicalDataAggregator] Fallback also failed:', fallbackError);
        return [];
      }
    }
  }`;

  // Apply the fixes
  if (!aggregatorContent.includes('getFallbackTrendData')) {
    // Add the fallback method before the last closing brace
    const lastBraceIndex = aggregatorContent.lastIndexOf('}');
    aggregatorContent = aggregatorContent.slice(0, lastBraceIndex) + fallbackTrendMethod + '\n' + aggregatorContent.slice(lastBraceIndex);
    
    // Replace the existing getTrendData method
    const getTrendDataRegex = /private async getTrendData\(userId: string\): Promise<ChartSeries\[\]> \{[\s\S]*?\n  \}/;
    aggregatorContent = aggregatorContent.replace(getTrendDataRegex, updatedGetTrendData.trim());
    
    fs.writeFileSync(aggregatorPath, aggregatorContent);
    console.log('   ✅ Updated medical data aggregator with fallback logic');
  } else {
    console.log('   ℹ️ Fallback logic already exists');
  }

  // Fix 2: Ensure the trends analysis tab handles empty data gracefully
  console.log('\n2. 📝 Updating trends analysis tab...');
  
  const trendsTabPath = 'src/components/medical-sharing/trends-analysis-tab.tsx';
  let trendsTabContent = fs.readFileSync(trendsTabPath, 'utf8');
  
  // Add better error handling and debugging
  const debuggingCode = `
  // Enhanced debugging
  console.log('🔍 TrendsAnalysisTab received trends:', {
    trends,
    isArray: Array.isArray(trends),
    length: trends?.length,
    firstTrend: trends?.[0],
    trendsType: typeof trends,
    trendsStringified: JSON.stringify(trends, null, 2)
  });`;

  if (!trendsTabContent.includes('trendsStringified')) {
    trendsTabContent = trendsTabContent.replace(
      /console\.log\('🔍 TrendsAnalysisTab received trends:'[^;]+;/,
      debuggingCode.trim()
    );
    
    fs.writeFileSync(trendsTabPath, trendsTabContent);
    console.log('   ✅ Enhanced debugging in trends analysis tab');
  } else {
    console.log('   ℹ️ Enhanced debugging already exists');
  }

  // Fix 3: Create a test endpoint for debugging trends
  console.log('\n3. 📝 Creating debug endpoint...');
  
  const debugEndpointPath = 'src/app/api/debug/trends/route.ts';
  const debugEndpointDir = path.dirname(debugEndpointPath);
  
  if (!fs.existsSync(debugEndpointDir)) {
    fs.mkdirSync(debugEndpointDir, { recursive: true });
  }

  const debugEndpointContent = `
import { NextRequest, NextResponse } from 'next/server';
import { MedicalDataAggregator } from '@/lib/medical-sharing/medical-data-aggregator';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        reportFiles: {
          include: {
            metrics: true
          },
          take: 5
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Test the aggregator
    const aggregator = new MedicalDataAggregator();
    const shareConfig = {
      id: 'debug',
      token: 'debug',
      userId,
      shareType: 'PROFESSIONAL' as const,
      title: 'Debug Test',
      description: 'Debug test',
      reportIds: user.reportFiles.map(r => r.id),
      includeProfile: true,
      includeDashboard: true,
      includeScoring: true,
      includeAI: true,
      includeFiles: true,
      expiresAt: new Date(),
      maxViews: 1,
      currentViews: 0,
      allowedEmails: [],
      isActive: true,
      createdAt: new Date(),
      lastAccessedAt: new Date()
    };

    const medicalData = await aggregator.aggregateForSharing(userId, shareConfig);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        reportCount: user.reportFiles.length,
        metricCount: user.reportFiles.reduce((sum, r) => sum + r.metrics.length, 0)
      },
      trends: {
        count: medicalData.reports.trends.length,
        data: medicalData.reports.trends
      },
      debug: {
        reportsStructure: Object.keys(medicalData.reports),
        trendsType: typeof medicalData.reports.trends,
        trendsIsArray: Array.isArray(medicalData.reports.trends)
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}`;

  if (!fs.existsSync(debugEndpointPath)) {
    fs.writeFileSync(debugEndpointPath, debugEndpointContent.trim());
    console.log('   ✅ Created debug endpoint at /api/debug/trends');
  } else {
    console.log('   ℹ️ Debug endpoint already exists');
  }

  console.log('\n🎉 All fixes applied successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Restart your development server');
  console.log('2. Test a share link to see if trends appear');
  console.log('3. Use the debug endpoint: /api/debug/trends?userId=<user-id>');
  console.log('4. Check browser console for detailed logging');
}

// Run the fixes
fixTrendsDataIssue();