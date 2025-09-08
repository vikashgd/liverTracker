/**
 * Debug Share Data Structure
 * Test the exact data structure being returned by the share API
 */

const token = '923e44aeac921eacf181cffbb1075708027d197d450e1b7cd5ff8886dda72128';

async function debugShareDataStructure() {
  try {
    console.log('🔍 Testing share data structure...');
    
    // Test the data endpoint
    const response = await fetch(`http://localhost:8080/api/share/${token}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        password: 'report123'
      })
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      return;
    }

    const data = await response.json();
    console.log('✅ Full API Response:', JSON.stringify(data, null, 2));
    
    // Analyze the structure
    console.log('\n🔍 Data Structure Analysis:');
    console.log('- success:', data.success);
    console.log('- medicalData keys:', Object.keys(data.medicalData || {}));
    console.log('- reports structure:', typeof data.medicalData?.reports);
    console.log('- reports keys:', Object.keys(data.medicalData?.reports || {}));
    console.log('- individual reports count:', data.medicalData?.reports?.individual?.length || 0);
    console.log('- patient data:', !!data.medicalData?.patient);
    console.log('- scoring data:', !!data.medicalData?.scoring);
    console.log('- aiAnalysis data:', !!data.medicalData?.aiAnalysis);
    
    // Check specific report data
    if (data.medicalData?.reports?.individual?.length > 0) {
      console.log('\n📋 First Report Sample:');
      console.log(JSON.stringify(data.medicalData.reports.individual[0], null, 2));
    }

  } catch (error) {
    console.error('💥 Exception:', error);
  }
}

debugShareDataStructure();