#!/usr/bin/env node

/**
 * PRECISE INVESTIGATION: Chart Duplication Issue
 * 
 * FOCUS: Why do some charts show 10 points instead of 5?
 * CONSTRAINT: Do NOT touch authentication/profile systems
 * GOAL: Find exact cause of duplication, then fix ONLY that
 */

console.log('🎯 PRECISE CHART DUPLICATION INVESTIGATION');
console.log('='.repeat(60));

console.log('\n📊 SPECIFIC ISSUE:');
console.log('✅ Bilirubin: 5 points (correct)');
console.log('❌ Creatinine, INR, ALT, AST, Platelets, Albumin: 10 points (duplicate)');

console.log('\n🔍 INVESTIGATION FOCUS:');
console.log('1. Why does Bilirubin work correctly (5 points)?');
console.log('2. Why do other metrics show duplicates (10 points)?');
console.log('3. What is different between Bilirubin and the others?');

console.log('\n📋 INVESTIGATION STEPS:');

console.log('\n1. 🔍 CHECK CHART DATA API CALLS:');
console.log('   - Look at browser Network tab');
console.log('   - Check /api/chart-data?metric=Bilirubin vs others');
console.log('   - Compare response data structure');
console.log('   - Count actual data points returned');

console.log('\n2. 📊 EXAMINE DATABASE RECORDS:');
console.log('   - Count ExtractedMetric records for each metric');
console.log('   - Check for duplicate entries with same values/dates');
console.log('   - Compare Bilirubin records vs others');

console.log('\n3. 🔄 ANALYZE QUERY LOGIC:');
console.log('   - Check chart data API query for deduplication');
console.log('   - Look for GROUP BY or DISTINCT clauses');
console.log('   - Verify date/time grouping logic');

console.log('\n4. 📈 FRONTEND CHART RENDERING:');
console.log('   - Check if frontend is duplicating data points');
console.log('   - Look for data transformation logic');
console.log('   - Verify chart component data processing');

console.log('\n🎯 HYPOTHESIS:');
console.log('Most likely causes:');
console.log('1. Database has duplicate ExtractedMetric records');
console.log('2. Chart API query lacks proper deduplication');
console.log('3. Data migration created duplicates for some metrics but not others');
console.log('4. Frontend chart component is processing data incorrectly');

console.log('\n📝 INVESTIGATION PLAN:');
console.log('Step 1: Check browser Network tab for API responses');
console.log('Step 2: Query database to count records per metric');
console.log('Step 3: Compare Bilirubin vs other metrics in database');
console.log('Step 4: Identify the exact difference causing duplication');
console.log('Step 5: Apply MINIMAL fix to resolve duplication only');

console.log('\n⚠️ CONSTRAINTS:');
console.log('- DO NOT modify authentication system');
console.log('- DO NOT change profile/login functionality');
console.log('- ONLY fix the specific duplication issue');
console.log('- Keep changes minimal and targeted');
console.log('- Test thoroughly before deployment');

console.log('\n🎯 SUCCESS CRITERIA:');
console.log('✅ All metrics show correct number of points (5, not 10)');
console.log('✅ Bilirubin continues to work correctly');
console.log('✅ No impact on authentication/profile systems');
console.log('✅ Parameter Trending section works (separate issue)');

console.log('\n📊 NEXT ACTIONS:');
console.log('1. Check browser Network tab for chart API calls');
console.log('2. Examine actual API response data');
console.log('3. Query database to understand duplication pattern');
console.log('4. Apply precise fix for duplication only');