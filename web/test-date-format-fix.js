#!/usr/bin/env node

/**
 * Test the date format fix
 */

async function testDateFormatFix() {
  try {
    console.log('🧪 Testing date format fix...');
    
    // Test data with YYYY-MM-DD format (from HTML date input)
    const testData = {
      objectKey: 'reports/test-date-format.pdf',
      contentType: 'application/pdf',
      reportDate: '2020-10-17', // HTML date input format
      extracted: {
        reportDate: '2020-10-17', // Same format
        reportType: 'Lab',
        metrics: {
          Platelets: { value: 0.7, unit: 'lakhs/cu mm' }
        }
      }
    };
    
    console.log('📤 Testing with date format:', testData.reportDate);
    
    const response = await fetch('http://localhost:8080/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success! Report created:', result.id);
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDateFormatFix();