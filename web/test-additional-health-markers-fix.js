/**
 * Test Additional Health Markers Fix
 * Verify that the dashboard now loads all metrics including ALP, GGT, TotalProtein, Sodium, Potassium
 */

async function testAdditionalHealthMarkersFix() {
  console.log('🧪 TESTING ADDITIONAL HEALTH MARKERS FIX\n');
  
  try {
    // Test the dashboard page directly
    console.log('📊 Testing dashboard page loading...');
    
    const response = await fetch('http://localhost:8080/dashboard', {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      }
    });
    
    if (!response.ok) {
      console.log(`❌ Dashboard page returned status: ${response.status}`);
      return;
    }
    
    const html = await response.text();
    
    // Check if Additional Health Markers section is present
    const hasAdditionalHealthMarkers = html.includes('Additional Health Markers');
    console.log(`Additional Health Markers section: ${hasAdditionalHealthMarkers ? '✅ Found' : '❌ Not found'}`);
    
    // Check for specific metrics in the HTML
    const metricsToCheck = ['ALP', 'GGT', 'TotalProtein', 'Sodium', 'Potassium'];
    
    console.log('\n🔍 Checking for metric presence in dashboard HTML:');
    metricsToCheck.forEach(metric => {
      const found = html.includes(metric);
      console.log(`   ${metric}: ${found ? '✅ Found' : '❌ Not found'}`);
    });
    
    // Also test the individual API endpoints to make sure they're working
    console.log('\n🔗 Testing individual API endpoints:');
    
    for (const metric of metricsToCheck) {
      try {
        const apiResponse = await fetch('http://localhost:8080/api/chart-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metricName: metric
          })
        });
        
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          const points = data.data?.length || 0;
          console.log(`   ${metric}: ✅ API working (${points} data points)`);
        } else {
          console.log(`   ${metric}: ❌ API error ${apiResponse.status}`);
        }
      } catch (error) {
        console.log(`   ${metric}: ❌ API request failed - ${error.message}`);
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('The fix should ensure that:');
    console.log('1. Dashboard loads ALL metrics (not just essential ones)');
    console.log('2. Additional Health Markers section appears');
    console.log('3. ALP, GGT, TotalProtein, Sodium, Potassium show data or proper "No data" messages');
    console.log('4. API endpoints work for all metrics');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAdditionalHealthMarkersFix().catch(console.error);