#!/usr/bin/env node

/**
 * TEST AI EXTRACTION SERVICE
 * Check if the AI extraction API is working
 */

async function testAIExtractionService() {
  console.log('🤖 TESTING AI EXTRACTION SERVICE');
  console.log('================================\n');

  // Check environment variables
  console.log('🔑 Environment Variables Check:');
  console.log('------------------------------');
  
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    console.log(`✅ OPENAI_API_KEY: ${openaiKey.substring(0, 10)}...${openaiKey.substring(openaiKey.length - 4)}`);
  } else {
    console.log('❌ OPENAI_API_KEY: Missing!');
    console.log('This is likely the cause of AI extraction failures');
    return;
  }

  // Test the OpenAI API directly
  console.log('\n🧪 Testing OpenAI API Direct:');
  console.log('-----------------------------');
  
  try {
    const testResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (testResponse.ok) {
      const models = await testResponse.json();
      console.log('✅ OpenAI API: Connected successfully');
      console.log(`📋 Available models: ${models.data?.length || 0}`);
      
      // Check if gpt-4o-mini is available
      const hasGpt4oMini = models.data?.some(m => m.id === 'gpt-4o-mini');
      console.log(`🤖 GPT-4o-mini available: ${hasGpt4oMini ? '✅ Yes' : '❌ No'}`);
    } else {
      const error = await testResponse.text();
      console.log('❌ OpenAI API: Failed');
      console.log(`Status: ${testResponse.status}`);
      console.log(`Error: ${error}`);
      return;
    }
  } catch (error) {
    console.log('❌ OpenAI API: Network error');
    console.log(`Error: ${error.message}`);
    return;
  }

  // Test the extraction endpoint with a simple request
  console.log('\n🔬 Testing Extraction Endpoint:');
  console.log('-------------------------------');
  
  try {
    const testUrl = 'http://localhost:3000/api/extract';
    const testPayload = {
      imageUrl: 'https://via.placeholder.com/400x300/ffffff/000000?text=Test+Lab+Report'
    };

    console.log(`📡 Testing: ${testUrl}`);
    
    const extractResponse = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    if (extractResponse.ok) {
      const result = await extractResponse.json();
      console.log('✅ Extraction API: Working');
      console.log('📊 Response structure:', Object.keys(result));
    } else {
      const error = await extractResponse.text();
      console.log('❌ Extraction API: Failed');
      console.log(`Status: ${extractResponse.status}`);
      console.log(`Error: ${error}`);
    }
  } catch (error) {
    console.log('❌ Extraction API: Cannot connect');
    console.log(`Error: ${error.message}`);
    console.log('Make sure your development server is running on port 3000');
  }

  // Check recent extraction attempts in database
  console.log('\n📊 Recent Extraction Analysis:');
  console.log('------------------------------');
  
  try {
    const { PrismaClient } = require('./src/generated/prisma');
    const prisma = new PrismaClient();

    const recentReports = await prisma.reportFile.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000) // Last 48 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`Found ${recentReports.length} recent reports:`);
    
    recentReports.forEach((report, index) => {
      const hoursAgo = Math.round((Date.now() - report.createdAt.getTime()) / (1000 * 60 * 60));
      console.log(`${index + 1}. ${hoursAgo}h ago - ${report.objectKey}`);
      console.log(`   AI Extraction: ${report.extractedJson ? '✅ Success' : '❌ Failed'}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  }

  console.log('\n🎯 DIAGNOSIS SUMMARY:');
  console.log('====================');
  console.log('1. Check if OPENAI_API_KEY is properly set');
  console.log('2. Verify OpenAI API connectivity');
  console.log('3. Test extraction endpoint functionality');
  console.log('4. Check server logs for extraction errors');
  
  console.log('\n🛠️  QUICK FIXES:');
  console.log('================');
  console.log('1. Restart your development server');
  console.log('2. Check .env.local file for OPENAI_API_KEY');
  console.log('3. Verify network connectivity to OpenAI');
  console.log('4. Check if API key has sufficient credits');
}

// Run the test
testAIExtractionService().catch(console.error);