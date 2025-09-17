#!/usr/bin/env node

/**
 * TEST OPENAI KEY DIRECTLY
 * Test the OpenAI API key from .env.local
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function testOpenAIKeyDirect() {
  console.log('🔑 TESTING OPENAI KEY DIRECTLY');
  console.log('==============================\n');

  const openaiKey = process.env.OPENAI_API_KEY;
  
  console.log('📋 Environment Check:');
  console.log(`OPENAI_API_KEY exists: ${!!openaiKey}`);
  if (openaiKey) {
    console.log(`Key length: ${openaiKey.length}`);
    console.log(`Key format: ${openaiKey.substring(0, 7)}...${openaiKey.substring(openaiKey.length - 4)}`);
  } else {
    console.log('❌ OPENAI_API_KEY not found in environment');
    return;
  }

  // Test the key with OpenAI API
  console.log('\n🧪 Testing OpenAI API:');
  console.log('----------------------');
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI API: Key is valid and working');
      console.log(`Available models: ${data.data?.length || 0}`);
      
      // Check for GPT-4o-mini specifically
      const gpt4oMini = data.data?.find(m => m.id === 'gpt-4o-mini');
      if (gpt4oMini) {
        console.log('✅ GPT-4o-mini: Available');
      } else {
        console.log('❌ GPT-4o-mini: Not available');
        console.log('Available models:', data.data?.slice(0, 5).map(m => m.id));
      }
    } else {
      const errorText = await response.text();
      console.log('❌ OpenAI API: Key validation failed');
      console.log(`Error: ${errorText}`);
      
      if (response.status === 401) {
        console.log('🔍 This suggests the API key is invalid or expired');
      } else if (response.status === 429) {
        console.log('🔍 This suggests rate limiting or quota exceeded');
      }
    }
  } catch (error) {
    console.log('❌ Network error testing OpenAI API');
    console.log(`Error: ${error.message}`);
  }

  // Test a simple completion
  console.log('\n🤖 Testing Simple Completion:');
  console.log('-----------------------------');
  
  try {
    const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'Return just the word "test" and nothing else.' }
        ],
        max_tokens: 10,
        temperature: 0
      })
    });

    if (testResponse.ok) {
      const result = await testResponse.json();
      const content = result.choices?.[0]?.message?.content;
      console.log('✅ Completion test: Success');
      console.log(`Response: "${content}"`);
    } else {
      const errorText = await testResponse.text();
      console.log('❌ Completion test: Failed');
      console.log(`Error: ${errorText}`);
    }
  } catch (error) {
    console.log('❌ Completion test: Network error');
    console.log(`Error: ${error.message}`);
  }

  console.log('\n🎯 DIAGNOSIS:');
  console.log('=============');
  
  if (!openaiKey) {
    console.log('❌ PROBLEM: OpenAI API key not loaded');
    console.log('💡 SOLUTION: Check .env.local file and restart server');
  } else {
    console.log('✅ OpenAI key is loaded in environment');
    console.log('🔍 If extraction still fails, check server-side environment loading');
  }
}

// Run the test
testOpenAIKeyDirect().catch(console.error);