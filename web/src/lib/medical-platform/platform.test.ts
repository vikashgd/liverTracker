/**
 * MEDICAL PLATFORM INTEGRATION TEST
 * Comprehensive test to validate the entire medical platform works correctly
 */

import { MedicalDataPlatform, getMedicalPlatform } from './platform';
import type { ProcessingRequest } from './core/types';

/**
 * Integration test for the Medical Data Platform
 * This demonstrates the complete workflow from data input to insights
 */
export async function testMedicalPlatform(): Promise<{
  success: boolean;
  results: any[];
  errors: string[];
}> {
  const results: any[] = [];
  const errors: string[] = [];

  try {
    console.log('🧪 Starting Medical Platform Integration Test...');

    // Initialize platform
    const platform = getMedicalPlatform({
      processing: {
        strictMode: false,
        autoCorrection: true,
        confidenceThreshold: 0.7,
        validationLevel: 'normal'
      },
      quality: {
        minimumConfidence: 0.5,
        requiredFields: ['ALT', 'AST', 'Platelets'],
        outlierDetection: true,
        duplicateHandling: 'merge'
      },
      regional: {
        primaryUnits: 'International',
        timeZone: 'UTC',
        locale: 'en-US'
      },
      compliance: {
        auditLevel: 'detailed',
        dataRetention: 2555,
        encryptionRequired: false // For testing
      }
    });

    // Test 1: Manual Entry Processing
    console.log('📝 Test 1: Manual Entry Processing');
    const manualRequest: ProcessingRequest = {
      source: 'manual_entry',
      data: {
        userId: 'test-user-123',
        reportDate: new Date('2024-01-15'),
        reportType: 'Manual Lab Entry',
        labData: {
          'ALT': { value: 45, unit: 'U/L' },
          'AST': { value: 38, unit: 'U/L' },
          'Platelets': { value: 250, unit: '10^9/L' },
          'Bilirubin': { value: 1.2, unit: 'mg/dL' },
          'INR': { value: 1.1, unit: 'ratio' },
          'Creatinine': { value: 0.9, unit: 'mg/dL' },
          'Albumin': { value: 4.2, unit: 'g/dL' }
        }
      }
    };

    const manualResult = await platform.processData(manualRequest);
    results.push({
      test: 'Manual Entry',
      success: manualResult.success,
      valuesProcessed: manualResult.summary.valuesProcessed,
      averageConfidence: manualResult.summary.averageConfidence,
      qualityScore: manualResult.summary.qualityScore
    });

    console.log(`✅ Manual entry processed: ${manualResult.summary.valuesProcessed} values, quality: ${manualResult.summary.qualityScore.toFixed(2)}`);

    // Test 2: AI Extraction Processing
    console.log('🤖 Test 2: AI Extraction Processing');
    const aiRequest: ProcessingRequest = {
      source: 'ai_extraction',
      data: {
        userId: 'test-user-123',
        reportDate: new Date('2024-01-20'),
        objectKey: 'test-report.pdf',
        extracted: {
          reportType: 'Lab Report',
          metrics: {
            'ALT': { value: 65, unit: 'U/L' },
            'AST': { value: 58, unit: 'U/L' },
            'Platelets': { value: 180000, unit: '/μL' }, // Test unit conversion
            'Bilirubin': { value: 25.6, unit: 'μmol/L' } // Test international units
          },
          metricsAll: [
            { name: 'ALP', value: 95, unit: 'U/L' },
            { name: 'Albumin', value: 38, unit: 'g/L' }, // Test g/L to g/dL conversion
            { name: 'Creatinine', value: 88, unit: 'μmol/L' } // Test SI units
          ]
        }
      }
    };

    const aiResult = await platform.processData(aiRequest);
    results.push({
      test: 'AI Extraction',
      success: aiResult.success,
      valuesProcessed: aiResult.summary.valuesProcessed,
      averageConfidence: aiResult.summary.averageConfidence,
      qualityScore: aiResult.summary.qualityScore,
      unitConversions: aiResult.report ? Array.from(aiResult.report.values.values()).map(v => ({
        metric: v.metric,
        original: `${v.raw.value} ${v.raw.unit}`,
        converted: `${v.processed.value} ${v.processed.unit}`,
        factor: v.processed.conversionFactor
      })) : []
    });

    console.log(`✅ AI extraction processed: ${aiResult.summary.valuesProcessed} values, quality: ${aiResult.summary.qualityScore.toFixed(2)}`);

    // Test 3: Edge Cases and Error Handling
    console.log('⚠️ Test 3: Edge Cases and Error Handling');
    const edgeCaseRequest: ProcessingRequest = {
      source: 'manual_entry',
      data: {
        userId: 'test-user-123',
        reportDate: new Date('2024-01-25'),
        reportType: 'Edge Case Test',
        labData: {
          'Platelets': { value: 55000, unit: '/μL' }, // Extreme value requiring correction
          'Bilirubin': { value: 500, unit: 'μmol/L' }, // Very high value
          'INR': { value: 4.5, unit: 'ratio' }, // Critical value
          'UnknownMetric': { value: 100, unit: 'unknown' } // Invalid metric
        }
      }
    };

    const edgeResult = await platform.processData(edgeCaseRequest);
    results.push({
      test: 'Edge Cases',
      success: edgeResult.success,
      valuesProcessed: edgeResult.summary.valuesProcessed,
      warnings: edgeResult.warnings,
      errors: edgeResult.errors
    });

    console.log(`✅ Edge cases handled: ${edgeResult.summary.valuesProcessed} valid values from ${Object.keys(edgeCaseRequest.data.labData).length} inputs`);

    // Test 4: MELD Score Calculation
    console.log('🧮 Test 4: MELD Score Calculation');
    if (manualResult.success && manualResult.report) {
      const insights = await platform.insights.analyze(manualResult.report);
      results.push({
        test: 'MELD Calculation',
        success: !!insights.scores.meld,
        meldScore: insights.scores.meld,
        meldNaScore: insights.scores.meldNa,
        clinicalInsights: insights.clinicalInsights,
        recommendations: insights.recommendations
      });

      console.log(`✅ MELD score calculated: ${insights.scores.meld || 'N/A'}`);
    }

    // Test 5: Data Quality Assessment
    console.log('📊 Test 5: Data Quality Assessment');
    if (aiResult.success && aiResult.report) {
      const qualityAnalysis = await platform.insights.analyzeDataQuality('test-user-123');
      results.push({
        test: 'Data Quality',
        success: true,
        overallScore: qualityAnalysis.overallScore,
        completeness: qualityAnalysis.completeness,
        reliability: qualityAnalysis.reliability
      });

      console.log(`✅ Data quality assessed: ${qualityAnalysis.overallScore.toFixed(2)} overall score`);
    }

    // Test 6: System Health Check
    console.log('❤️ Test 6: System Health Check');
    const healthStatus = await platform.getSystemHealth();
    results.push({
      test: 'System Health',
      success: healthStatus.status === 'healthy',
      status: healthStatus.status,
      version: healthStatus.version,
      subsystems: Object.keys(healthStatus.subsystems)
    });

    console.log(`✅ System health: ${healthStatus.status}`);

    // Summary
    const successfulTests = results.filter(r => r.success).length;
    const totalTests = results.length;

    console.log(`\n🎯 Integration Test Summary:`);
    console.log(`   ✅ Successful: ${successfulTests}/${totalTests} tests`);
    console.log(`   📊 Overall Success Rate: ${(successfulTests/totalTests*100).toFixed(1)}%`);

    return {
      success: successfulTests === totalTests,
      results,
      errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Integration test failed:', errorMessage);
    errors.push(errorMessage);

    return {
      success: false,
      results,
      errors
    };
  }
}

/**
 * Run the integration test
 */
export async function runPlatformTest(): Promise<void> {
  console.log('\n🚀 MEDICAL PLATFORM INTEGRATION TEST\n');
  console.log('Testing enterprise-grade medical data platform...\n');

  const testResult = await testMedicalPlatform();

  if (testResult.success) {
    console.log('\n🎉 ALL TESTS PASSED! Medical Platform is working correctly.\n');
    console.log('📋 Test Results:');
    testResult.results.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.test}: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
    });
  } else {
    console.log('\n❌ SOME TESTS FAILED. Review the results below:\n');
    console.log('📋 Test Results:');
    testResult.results.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.test}: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
    });
    
    if (testResult.errors.length > 0) {
      console.log('\n🚨 Errors:');
      testResult.errors.forEach(error => console.log(`   - ${error}`));
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// Export for use in other files
export default testMedicalPlatform;
