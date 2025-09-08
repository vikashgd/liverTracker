#!/usr/bin/env node

/**
 * Test script to simulate what the uploader should send to the API
 */

async function testManualDateAPI() {
  try {
    console.log('🧪 Testing manual date API...');
    
    // Simulate what the enhanced uploader should send
    const testData = {
      objectKey: 'reports/test-manual-date.pdf',
      contentType: 'application/pdf',
      reportDate: '2020-10-17', // Manual date from 2020
      extracted: {
        reportDate: '2020-10-17', // Same date in extracted
        reportType: 'Lab',
        metrics: {
          Platelets: { value: 0.7, unit: 'lakhs/cu mm' }
        }
      }
    };
    
    console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:8080/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test' // You might need a real session
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success:', result);
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testManualDateAPI();