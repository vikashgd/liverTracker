#!/usr/bin/env node

/**
 * Debug script to understand the date issue
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function debugDateIssue() {
  try {
    console.log('🔍 Debugging date issue for your report...');
    
    // Get the report with full extracted JSON
    const report = await prisma.reportFile.findFirst({
      where: { 
        id: 'cmf894xyl0001x2r94d7mq928'
      },
      select: {
        id: true,
        objectKey: true,
        reportDate: true,
        createdAt: true,
        extractedJson: true
      }
    });
    
    if (report) {
      console.log('\n📄 Report Details:');
      console.log('File:', report.objectKey);
      console.log('Report Date in DB:', report.reportDate);
      console.log('Created At:', report.createdAt);
      
      console.log('\n🔍 Extracted JSON Analysis:');
      const extracted = report.extractedJson;
      
      if (extracted && typeof extracted === 'object') {
        console.log('- reportDate in extracted:', extracted.reportDate);
        console.log('- reportType in extracted:', extracted.reportType);
        
        // Check if there are any date-like fields
        const allKeys = Object.keys(extracted);
        console.log('- All keys in extracted:', allKeys);
        
        // Look for any date-related values
        const dateFields = allKeys.filter(key => 
          key.toLowerCase().includes('date') || 
          (typeof extracted[key] === 'string' && extracted[key]?.match(/\d{4}-\d{2}-\d{2}/))
        );
        
        if (dateFields.length > 0) {
          console.log('- Date-related fields found:', dateFields);
          dateFields.forEach(field => {
            console.log(`  - ${field}: ${extracted[field]}`);
          });
        } else {
          console.log('- No date-related fields found in extracted data');
        }
      } else {
        console.log('- No extracted JSON or invalid format');
      }
      
      console.log('\n🤔 Analysis:');
      console.log('The issue is likely that:');
      console.log('1. You manually entered October 17, 2020 in the date field');
      console.log('2. But the extracted JSON shows reportDate: null');
      console.log('3. This suggests the manual date wasn\'t properly saved in the extracted data');
      console.log('4. The API fell back to using new Date() (today\'s date)');
      
    } else {
      console.log('❌ Report not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugDateIssue();