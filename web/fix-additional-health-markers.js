/**
 * Fix Additional Health Markers - Targeted Fix
 * Focus only on ALP, GGT, TotalProtein, Sodium, Potassium
 */

const { PrismaClient } = require('./src/generated/prisma');

async function fixAdditionalHealthMarkers() {
  console.log('🔧 FIXING ADDITIONAL HEALTH MARKERS\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Get the user
    const user = await prisma.user.findFirst({
      where: { email: 'vikashgd@gmail.com' },
      select: { id: true, email: true }
    });
    
    console.log(`👤 User: ${user.email} (${user.id})`);
    
    // Check the specific metrics that are showing 0 points
    const problemMetrics = ['ALP', 'GGT', 'TotalProtein', 'Sodium', 'Potassium'];
    
    console.log('\n🔍 Checking problem metrics in database...');
    
    for (const metricName of problemMetrics) {
      console.log(`\n--- ${metricName} ---`);
      
      // Check all possible name variations for this metric
      const nameVariations = {
        'ALP': ['ALP', 'alp', 'Alkaline Phosphatase', 'alkaline phosphatase', 'ALKALINE PHOSPHATASE', 'Alk Phos', 'ALK PHOS'],
        'GGT': ['GGT', 'ggt', 'Gamma GT', 'gamma gt', 'GAMMA GT', 'Gamma-GT', 'γ-GT'],
        'TotalProtein': ['TotalProtein', 'Total Protein', 'total protein', 'TOTAL PROTEIN', 'T.Protein', 'Protein Total'],
        'Sodium': ['Sodium', 'sodium', 'SODIUM', 'Na', 'NA', 'na', 'Serum Sodium', 'S.Sodium'],
        'Potassium': ['Potassium', 'potassium', 'POTASSIUM', 'K', 'k', 'Serum Potassium', 'S.Potassium']
      };
      
      const variations = nameVariations[metricName] || [metricName];
      
      // Search for any of these variations
      const foundMetrics = await prisma.extractedMetric.findMany({
        where: {
          report: { userId: user.id },
          name: { in: variations },
          value: { not: null }
        },
        select: {
          name: true,
          value: true,
          unit: true,
          createdAt: true,
          report: {
            select: {
              reportDate: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`   Database search: ${foundMetrics.length} entries found`);
      
      if (foundMetrics.length > 0) {
        console.log('   ✅ Data exists in database:');
        foundMetrics.forEach((metric, idx) => {
          console.log(`     ${idx + 1}. "${metric.name}": ${metric.value} ${metric.unit} (${metric.report.reportDate?.toDateString() || metric.report.createdAt.toDateString()})`);
        });
      } else {
        console.log('   ❌ No data found in database');
        
        // Check if there are similar names
        const allMetrics = await prisma.extractedMetric.findMany({
          where: {
            report: { userId: user.id }
          },
          select: {
            name: true
          },
          distinct: ['name']
        });
        
        const similarNames = allMetrics
          .map(m => m.name)
          .filter(name => 
            name.toLowerCase().includes(metricName.toLowerCase()) ||
            variations.some(v => name.toLowerCase().includes(v.toLowerCase()))
          );
        
        if (similarNames.length > 0) {
          console.log('   🔍 Similar names found:', similarNames);
        }
      }
    }
    
    // Check what the medical platform parameters expect
    console.log('\n📋 Checking medical platform parameter definitions...');
    
    // Read the parameters file to see what names are expected
    try {
      const fs = require('fs');
      const parametersPath = './src/lib/medical-platform/core/parameters.ts';
      
      if (fs.existsSync(parametersPath)) {
        const parametersContent = fs.readFileSync(parametersPath, 'utf8');
        
        problemMetrics.forEach(metric => {
          console.log(`\n--- ${metric} Parameter Definition ---`);
          
          // Extract the parameter definition for this metric
          const metricRegex = new RegExp(`${metric}:\\s*{[^}]+}`, 'gs');
          const match = parametersContent.match(metricRegex);
          
          if (match) {
            console.log('   Parameter found in medical platform');
            
            // Extract aliases
            const aliasMatch = match[0].match(/aliases:\s*{[^}]+}/);
            if (aliasMatch) {
              console.log('   Aliases defined:', aliasMatch[0]);
            }
          } else {
            console.log('   ❌ Parameter NOT found in medical platform');
          }
        });
      }
    } catch (error) {
      console.log('   Could not read parameters file:', error.message);
    }
    
    // Test the medical platform query directly
    console.log('\n🧪 Testing medical platform queries...');
    
    for (const metricName of problemMetrics) {
      console.log(`\n--- Testing ${metricName} ---`);
      
      try {
        // Simulate the medical platform query
        const nameVariations = {
          'ALP': ['ALP', 'alp', 'Alkaline Phosphatase', 'alkaline phosphatase'],
          'GGT': ['GGT', 'ggt', 'Gamma GT', 'gamma gt'],
          'TotalProtein': ['TotalProtein', 'Total Protein', 'total protein'],
          'Sodium': ['Sodium', 'sodium', 'Na'],
          'Potassium': ['Potassium', 'potassium', 'K']
        };
        
        const variations = nameVariations[metricName] || [metricName];
        
        const platformQuery = await prisma.extractedMetric.findMany({
          where: {
            report: { userId: user.id },
            name: { in: variations },
            value: { not: null }
          },
          include: {
            report: {
              select: {
                reportDate: true,
                reportType: true,
                id: true
              }
            }
          },
          orderBy: [
            { report: { reportDate: 'asc' } },
            { createdAt: 'asc' }
          ]
        });
        
        console.log(`   Platform query result: ${platformQuery.length} data points`);
        
        if (platformQuery.length > 0) {
          console.log('   ✅ Medical platform should find this data');
        } else {
          console.log('   ❌ Medical platform query returns empty');
        }
        
      } catch (error) {
        console.log(`   ❌ Query failed: ${error.message}`);
      }
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('The issue is likely in the medical platform parameter definitions or name matching.');
    console.log('The data exists in the database but the medical platform is not finding it.');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixAdditionalHealthMarkers().catch(console.error);