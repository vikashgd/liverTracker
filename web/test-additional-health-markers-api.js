/**
 * Test Additional Health Markers API
 * Test the specific metrics that are showing 0 points
 */

async function testAdditionalHealthMarkersAPI() {
  console.log('🧪 TESTING ADDITIONAL HEALTH MARKERS API\n');
  
  const problemMetrics = ['ALP', 'GGT', 'TotalProtein', 'Sodium', 'Potassium'];
  
  for (const metric of problemMetrics) {
    console.log(`\n--- Testing ${metric} ---`);
    
    try {
      const response = await fetch('http://localhost:8080/api/chart-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metricName: metric
        })
      });
      
      if (!response.ok) {
        console.log(`❌ ${metric}: API returned status ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 200)}...`);
        continue;
      }
      
      const data = await response.json();
      
      console.log(`✅ ${metric}: API Response received`);
      console.log(`   Data points: ${data.data?.length || 0}`);
      console.log(`   Unit: ${data.unit || 'N/A'}`);
      console.log(`   Canonical metric: ${data.metadata?.canonicalMetric || 'N/A'}`);
      console.log(`   Is unknown metric: ${data.metadata?.isUnknownMetric || false}`);
      console.log(`   Has error: ${data.metadata?.hasError || false}`);
      
      if (data.metadata?.hasError) {
        console.log(`   Error message: ${data.metadata.errorMessage}`);
      }
      
      if (data.data && data.data.length > 0) {
        console.log(`   Sample data: ${data.data[0].value} ${data.unit} on ${data.data[0].date}`);
      } else {
        console.log(`   ❌ No data points returned`);
        
        // Check if it's using fallback
        if (data.metadata?.source === 'direct_database_fallback') {
          console.log(`   📋 Using database fallback`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ${metric}: Request failed - ${error.message}`);
    }
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('This will help identify which specific metrics are failing and why.');
}

// Run the test
testAdditionalHealthMarkersAPI().catch(console.error);