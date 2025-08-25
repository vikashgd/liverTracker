import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getMedicalPlatform } from '@/lib/medical-platform';
import { canonicalizeMetricName, type CanonicalMetric } from '@/lib/metrics';
import { formatMedicalValue } from '@/lib/medical-display-formatter';

export async function POST(request: NextRequest) {
  let metricName = '';
  let canonicalMetric: CanonicalMetric | undefined;
  
  try {
    const userId = await requireAuth();
    const requestData = await request.json();
    metricName = requestData.metricName;

    if (!metricName) {
      return NextResponse.json(
        { error: 'Metric name is required' },
        { status: 400 }
      );
    }

    console.log(`📊 API: Loading chart data for ${metricName} (user: ${userId})`);

    // Initialize Medical Platform (same config as dashboard)
    const platform = getMedicalPlatform({
      processing: {
        strictMode: false,
        autoCorrection: true,
        confidenceThreshold: 0.5,
        validationLevel: 'normal'
      },
      quality: {
        minimumConfidence: 0.3,
        requiredFields: [],
        outlierDetection: true,
        duplicateHandling: 'merge'
      },
      regional: {
        primaryUnits: 'International',
        timeZone: 'UTC',
        locale: 'en-US'
      },
      compliance: {
        auditLevel: 'basic',
        dataRetention: 2555,
        encryptionRequired: false
      }
    });

    // Handle compound metric names like "SGPT/ALT", "SGOT/AST", etc.
    
    // First try direct canonicalization
    canonicalMetric = canonicalizeMetricName(metricName);
    
    // If that fails, try parsing compound names
    if (!canonicalMetric) {
      // Handle names like "SGPT/ALT", "SGOT/AST", "Total Bilirubin", etc.
      const parts = metricName.split(/[\/\-\s]+/);
      for (const part of parts) {
        const trimmedPart = part.trim();
        canonicalMetric = canonicalizeMetricName(trimmedPart);
        if (canonicalMetric) break;
      }
    }
    
    // If still no match, try some common patterns
    if (!canonicalMetric) {
      const lowerName = metricName.toLowerCase();
      if (lowerName.includes('sgpt') || lowerName.includes('alt')) {
        canonicalMetric = 'ALT';
      } else if (lowerName.includes('sgot') || lowerName.includes('ast')) {
        canonicalMetric = 'AST';
      } else if (lowerName.includes('bilirubin')) {
        canonicalMetric = 'Bilirubin';
      } else if (lowerName.includes('albumin')) {
        canonicalMetric = 'Albumin';
      } else if (lowerName.includes('creatinine')) {
        canonicalMetric = 'Creatinine';
      } else if (lowerName.includes('platelet')) {
        canonicalMetric = 'Platelets';
      } else if (lowerName.includes('alkaline') || lowerName.includes('alp')) {
        canonicalMetric = 'ALP';
      } else if (lowerName.includes('protein')) {
        canonicalMetric = 'TotalProtein';
      } else if (lowerName.includes('sodium')) {
        canonicalMetric = 'Sodium';
      } else if (lowerName.includes('potassium')) {
        canonicalMetric = 'Potassium';
      } else if (lowerName.includes('ggt') || lowerName.includes('gamma')) {
        canonicalMetric = 'GGT';
      } else if (lowerName.includes('inr')) {
        canonicalMetric = 'INR';
      }
    }
    
    console.log(`🔄 Canonicalized "${metricName}" to "${canonicalMetric}"`);

    if (!canonicalMetric) {
      console.log(`⚠️ Unknown metric name: "${metricName}" - returning empty dataset`);
      
      // Instead of throwing an error, return an empty dataset with metadata
      // This allows the UI to handle unknown metrics gracefully
      return NextResponse.json({
        data: [],
        statistics: {
          count: 0,
          min: 0,
          max: 0,
          average: 0,
          trend: 'unknown'
        },
        quality: {
          completeness: 0,
          reliability: 0,
          gaps: []
        },
        unit: '',
        metadata: {
          originalMetricName: metricName,
          canonicalMetric: null,
          isUnknownMetric: true,
          message: `"${metricName}" is not a recognized metric in our system. This may be a new or custom lab parameter.`
        }
      });
    }

    // Get chart data using the Medical Platform (same as dashboard)
    const chartSeries = await platform.getChartData(userId, canonicalMetric);
    
    // Convert to expected SeriesPoint format with unit conversion
    const seriesData = chartSeries.data.map(point => {
      // Apply unit conversion for display
      const formatted = formatMedicalValue(canonicalMetric!, point.value);
      
      return {
        date: point.date.toISOString().split('T')[0],
        value: formatted.displayValue,
        originalValue: formatted.originalValue,
        wasConverted: formatted.wasConverted,
        conversionNote: formatted.conversionNote,
        reportCount: (point.metadata as any)?.reportCount || 1
      };
    });

    // Get the standard unit for this metric
    const sampleFormatted = formatMedicalValue(canonicalMetric!, 1);
    const standardUnit = sampleFormatted.displayUnit;

    const logData = {
      originalMetric: metricName,
      canonicalMetric: canonicalMetric,
      dataCount: seriesData.length,
      statistics: chartSeries.statistics,
      quality: {
        completeness: chartSeries.quality.completeness.toFixed(2),
        reliability: chartSeries.quality.reliability.toFixed(2),
        gaps: chartSeries.quality.gaps.length
      },
      sampleData: seriesData.slice(0, 3),
      valueRange: chartSeries.statistics.count > 0 ? {
        min: chartSeries.statistics.min,
        max: chartSeries.statistics.max,
        average: chartSeries.statistics.average.toFixed(1)
      } : null
    };

    console.log(`✅ API: Returning ${seriesData.length} data points for ${canonicalMetric}:`, logData);

    // Check if any conversions were applied
    const conversionsApplied = seriesData.some(point => point.wasConverted);
    const conversionMessage = conversionsApplied 
      ? `Values have been converted to standard units (${standardUnit}) for consistency.`
      : null;

    return NextResponse.json({
      data: seriesData,
      statistics: {
        ...chartSeries.statistics,
        // Update statistics with converted values
        min: Math.min(...seriesData.map(p => p.value)),
        max: Math.max(...seriesData.map(p => p.value)),
        average: seriesData.reduce((sum, p) => sum + p.value, 0) / seriesData.length
      },
      quality: chartSeries.quality,
      unit: standardUnit,
      metadata: {
        originalMetricName: metricName,
        canonicalMetric: canonicalMetric,
        isUnknownMetric: false,
        conversionsApplied,
        conversionMessage,
        standardUnit
      }
    });

  } catch (error) {
    console.error('❌ API: Chart data error:', error);
    
    // Return a graceful error response instead of 500
    // This allows the UI to show a helpful message while still displaying current value
    return NextResponse.json({
      data: [],
      statistics: {
        count: 0,
        min: 0,
        max: 0,
        average: 0,
        trend: 'unknown'
      },
      quality: {
        completeness: 0,
        reliability: 0,
        gaps: []
      },
      unit: '',
      metadata: {
        originalMetricName: metricName,
        canonicalMetric: canonicalMetric || null,
        isUnknownMetric: false,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred while fetching data',
        errorType: 'data_fetch_error'
      }
    });
  }
}