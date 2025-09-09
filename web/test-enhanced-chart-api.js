/**
 * Test Enhanced Chart Data API
 * Verify that the API now works with authentication fallback and direct database queries
 */

async function testEnhancedChartAPI() {
  console.log('🧪 TESTING ENHANCED CHART DATA API\n');
  
  try {
    // Test Sodium data loading
    console.log('📊 Testing Sodium data loading...');
    
    const response = await fetch('http://localhost:8080/api/chart-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metricName: 'Sodium'
      })
    });
    
    if (!response.ok) {
      console.log(`❌ API returned status: ${response.status}`);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ API Response received');
    console.log(`   Data points: ${data.data?.length || 0}`);
    console.log(`   Statistics: count=${data.statistics?.count}, avg=${data.statistics?.average?.toFixed(1)}`);
    console.log(`   Unit: ${data.unit}`);
    console.log(`   Metadata: ${JSON.stringify(data.metadata, null, 2)}`);
    
    if (data.data && data.data.length > 0) {
      console.log('\n📈 Sample data points:');
      data.data.slice(0, 3).forEach((point, idx) => {
        console.log(`   ${idx + 1}. ${point.date}: ${point.value} ${data.unit}`);
      });
    }
    
    // Test other key metrics
    const testMetrics = ['ALT', 'AST', 'Bilirubin', 'Platelets', 'Potassium'];
    
    for (const metric of testMetrics) {
      console.log(`\n🔍 Testing ${metric}...`);
      
      try {
        const metricResponse = await fetch('http://localhost:8080/api/chart-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metricName: metric
          })
        });
        
        if (metricResponse.ok) {
          const metricData = await metricResponse.json();
          console.log(`   ✅ ${metric}: ${metricData.data?.length || 0} data points`);
        } else {
          console.log(`   ❌ ${metric}: API error ${metricResponse.status}`);
        }
      } catch (error) {
        console.log(`   ❌ ${metric}: ${error.message}`);
      }
    }
    
    console.log('\n🎯 CONCLUSION:');
    if (data.data && data.data.length > 0) {
      console.log('✅ Enhanced chart data API is working correctly!');
      console.log('✅ Sodium and other metrics should now appear on dashboard');
    } else {
      console.log('❌ API still not returning data - further investigation needed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEnhancedChartAPI().catch(console.error);