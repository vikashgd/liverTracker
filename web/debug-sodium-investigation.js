/**
 * Sodium Investigation - Find the real reason why Sodium data isn't showing on dashboard
 * This will trace through the entire data pipeline to identify the exact issue
 */

const { PrismaClient } = require('./src/generated/prisma');

async function investigateSodiumData() {
  console.log('🔍 INVESTIGATING SODIUM DATA - Finding the real reason...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Step 1: Check if user has any reports at all
    console.log('📊 Step 1: Checking user reports...');
    const reports = await prisma.reportFile.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        contentType: true,
        extractedJson: true,
        metrics: {
          select: {
            name: true,
            value: true,
            unit: true,
            originalValue: true,
            originalUnit: true
          }
        }
      }
    });
    
    console.log(`Found ${reports.length} reports`);
    
    if (reports.length === 0) {
      console.log('❌ NO REPORTS FOUND - User needs to upload reports first');
      return;
    }
    
    // Step 2: Check extracted data structure in latest reports
    console.log('\n🔬 Step 2: Analyzing extracted data structure...');
    
    for (let i = 0; i < Math.min(3, reports.length); i++) {
      const report = reports[i];
      console.log(`\n--- Report ${i + 1} (ID: ${report.id}) ---`);
      console.log(`Date: ${report.createdAt}`);
      console.log(`Type: ${report.contentType}`);
      
      // Check extractedJson field
      if (report.extractedJson) {
        const extracted = typeof report.extractedJson === 'string' 
          ? JSON.parse(report.extractedJson) 
          : report.extractedJson;
        
        console.log('Extracted data keys:', Object.keys(extracted));
        
        // Check for Sodium in various forms
        const sodiumVariants = [
          'Sodium', 'sodium', 'SODIUM', 'Na', 'NA', 'na',
          'Serum Sodium', 'serum sodium', 'S.Sodium', 'S.Na'
        ];
        
        console.log('\n🧂 Checking for Sodium variants:');
        sodiumVariants.forEach(variant => {
          if (extracted[variant] !== undefined) {
            console.log(`✅ Found "${variant}": ${extracted[variant]}`);
          }
        });
        
        // Check in metricsAll array if it exists
        if (extracted.metricsAll && Array.isArray(extracted.metricsAll)) {
          console.log(`\n📋 Checking metricsAll array (${extracted.metricsAll.length} metrics):`);
          
          const sodiumMetrics = extracted.metricsAll.filter(metric => 
            sodiumVariants.some(variant => 
              metric.name && metric.name.toLowerCase().includes(variant.toLowerCase())
            )
          );
          
          if (sodiumMetrics.length > 0) {
            console.log('✅ Found Sodium in metricsAll:');
            sodiumMetrics.forEach(metric => {
              console.log(`  - Name: "${metric.name}", Value: ${metric.value}, Unit: ${metric.unit}`);
            });
          } else {
            console.log('❌ No Sodium found in metricsAll');
            
            // Show first few metrics for reference
            console.log('\n📝 First 5 metrics in metricsAll for reference:');
            extracted.metricsAll.slice(0, 5).forEach((metric, idx) => {
              console.log(`  ${idx + 1}. Name: "${metric.name}", Value: ${metric.value}, Unit: ${metric.unit}`);
            });
          }
        }
        
        // Check all top-level keys that might contain sodium
        console.log('\n🔍 All extracted data keys:');
        Object.keys(extracted).forEach(key => {
          if (key.toLowerCase().includes('sodium') || key.toLowerCase().includes('na')) {
            console.log(`✅ Potential Sodium key: "${key}" = ${extracted[key]}`);
          }
        });
      } else {
        console.log('❌ No extractedJson data found');
      }
      
      // Check metrics table
      console.log(`\n📋 Checking metrics table (${report.metrics.length} metrics):`);
      if (report.metrics.length > 0) {
        const sodiumMetrics = report.metrics.filter(metric => 
          metric.name && (
            metric.name.toLowerCase().includes('sodium') ||
            metric.name.toLowerCase().includes('na')
          )
        );
        
        if (sodiumMetrics.length > 0) {
          console.log('✅ Found Sodium in metrics table:');
          sodiumMetrics.forEach(metric => {
            console.log(`  - Name: "${metric.name}", Value: ${metric.value}, Unit: ${metric.unit}`);
            if (metric.originalValue) {
              console.log(`    Original: ${metric.originalValue} ${metric.originalUnit}`);
            }
          });
        } else {
          console.log('❌ No Sodium found in metrics table');
          
          // Show first few metrics for reference
          console.log('\n📝 First 5 metrics in table for reference:');
          report.metrics.slice(0, 5).forEach((metric, idx) => {
            console.log(`  ${idx + 1}. Name: "${metric.name}", Value: ${metric.value}, Unit: ${metric.unit}`);
          });
        }
      } else {
        console.log('❌ No metrics found in table');
      }
    }
    
    // Step 3: Check how dashboard loads data
    console.log('\n📈 Step 3: Checking dashboard data loading...');
    
    // Check what metrics the dashboard is looking for
    const expectedMetrics = [
      'ALT', 'AST', 'Bilirubin', 'Platelets', 'Creatinine', 'Albumin', 'INR',
      'ALP', 'GGT', 'TotalProtein', 'Sodium', 'Potassium'
    ];
    
    console.log('Dashboard expects these metrics:', expectedMetrics);
    
    // Step 4: Check the medical platform data loading
    console.log('\n🏥 Step 4: Checking medical platform data extraction...');
    
    // Simulate what the dashboard does to load chart data
    const { getMedicalPlatform } = require('./src/lib/medical-platform');
    
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
    
    try {
      console.log('🔄 Attempting to load Sodium data through medical platform...');
      const sodiumData = await platform.getChartData('user-id-placeholder', 'Sodium');
      console.log('Sodium chart data result:', {
        dataPoints: sodiumData.data.length,
        firstPoint: sodiumData.data[0] || 'No data',
        metadata: sodiumData.metadata
      });
    } catch (error) {
      console.log('❌ Error loading Sodium data through medical platform:', error.message);
    }
    
    // Step 5: Check metric canonicalization
    console.log('\n🏷️ Step 5: Checking metric name canonicalization...');
    
    const { canonicalizeMetricName } = require('./src/lib/metrics');
    
    const testNames = [
      'Sodium', 'sodium', 'SODIUM', 'Na', 'NA', 'na',
      'Serum Sodium', 'serum sodium', 'S.Sodium', 'S.Na',
      'Sodium (Na)', 'Na+', 'Sodium Level'
    ];
    
    testNames.forEach(name => {
      try {
        const canonical = canonicalizeMetricName(name);
        console.log(`"${name}" → "${canonical}"`);
      } catch (error) {
        console.log(`"${name}" → ERROR: ${error.message}`);
      }
    });
    
    console.log('\n🎯 INVESTIGATION COMPLETE');
    console.log('Check the output above to identify the exact issue with Sodium data');
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the investigation
investigateSodiumData().catch(console.error);