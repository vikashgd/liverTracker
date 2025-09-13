#!/usr/bin/env node

/**
 * Diagnose Chart Display Issue
 * 
 * Problem: Charts show "Data Loading Error" and "Failed to fetch chart data"
 * Analysis: Left side shows lab values, right side should show chart but shows error
 */

console.log('🔍 DIAGNOSING CHART DISPLAY ISSUE');
console.log('='.repeat(60));

console.log('\n📊 OBSERVED SYMPTOMS:');
console.log('✅ Left side: Laboratory Results showing correct values');
console.log('  - ALT: 70 U/L');
console.log('  - AST: 80 U/L'); 
console.log('  - Platelets: 75 10^9/L');
console.log('  - Bilirubin: 6 mg/dL');
console.log('  - Albumin: 2.2 g/dL');

console.log('\n❌ Right side: Parameter Trending showing error');
console.log('  - "Data Loading Error"');
console.log('  - "Failed to load historical data for Platelets"');
console.log('  - "Failed to fetch chart data"');
console.log('  - Current Value: 75 10^9/L (shows correctly)');

console.log('\n🔍 POTENTIAL ROOT CAUSES:');

console.log('\n1. 📡 API ENDPOINT ISSUES:');
console.log('   - Chart data API may be returning errors');
console.log('   - Different endpoint than lab results display');
console.log('   - API route: /api/chart-data?metric=Platelets');

console.log('\n2. 🔄 DATA TRANSFORMATION ISSUES:');
console.log('   - Lab results come from one source (likely ReportFile.extractedJson)');
console.log('   - Chart data comes from ExtractedMetric table');
console.log('   - Mismatch between data sources or formats');

console.log('\n3. 📊 FRONTEND CHART COMPONENT ISSUES:');
console.log('   - Chart component failing to render data');
console.log('   - Error handling showing instead of chart');
console.log('   - Data format mismatch between API and chart component');

console.log('\n4. 🔐 SESSION/AUTH ISSUES:');
console.log('   - Chart API calls may be failing authentication');
console.log('   - Different auth handling between lab display and chart API');

console.log('\n5. 📅 DATE/TIME FORMAT ISSUES:');
console.log('   - Chart requires date/time data for trending');
console.log('   - Date format mismatch or missing dates');
console.log('   - reportDate vs createdAt confusion');

console.log('\n🎯 MOST LIKELY ISSUES:');

console.log('\n🔥 PRIMARY SUSPECT: API Response Format');
console.log('   - Chart component expects specific data structure');
console.log('   - API may be returning data in wrong format');
console.log('   - Missing date fields for time series chart');

console.log('\n🔥 SECONDARY SUSPECT: Data Source Mismatch');
console.log('   - Lab results: from extractedJson in ReportFile');
console.log('   - Chart data: from ExtractedMetric table');
console.log('   - Data may exist in one but not the other');

console.log('\n🔥 TERTIARY SUSPECT: Frontend Error Handling');
console.log('   - Chart component showing error instead of empty state');
console.log('   - API returning 200 but with error in response body');
console.log('   - JavaScript errors in chart rendering');

console.log('\n📋 DIAGNOSTIC STEPS NEEDED:');
console.log('1. Check browser Network tab for /api/chart-data calls');
console.log('2. Examine API response format and status codes');
console.log('3. Check browser console for JavaScript errors');
console.log('4. Compare ExtractedMetric vs ReportFile.extractedJson data');
console.log('5. Verify chart component data format expectations');

console.log('\n🔧 INVESTIGATION PRIORITIES:');
console.log('1. API Response Analysis (HIGHEST)');
console.log('2. Data Source Verification (HIGH)');
console.log('3. Frontend Component Debugging (MEDIUM)');
console.log('4. Date/Time Format Validation (MEDIUM)');

console.log('\n💡 HYPOTHESIS:');
console.log('The chart data API is either:');
console.log('- Returning empty data (no ExtractedMetric records)');
console.log('- Returning data in wrong format for chart component');
console.log('- Failing with authentication/session issues');
console.log('- Missing required date fields for time series display');