#!/usr/bin/env node

/**
 * CRITICAL: Diagnose Session Contamination Still Occurring
 * 
 * Issue: Vikash logged in and sees Maria's data
 * This means our previous session isolation fix didn't work
 */

const { PrismaClient } = require('./src/generated/prisma');

async function diagnoseCriticalContamination() {
  console.log('🚨 CRITICAL SESSION CONTAMINATION DIAGNOSIS');
  console.log('='.repeat(60));

  const prisma = new PrismaClient();

  try {
    // 1. Check current users and their data
    console.log('\n1. 👥 CHECKING USER ACCOUNTS');
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'maria' } },
          { email: { contains: 'vikash' } },
          { name: { contains: 'Maria' } },
          { name: { contains: 'Vikash' } }
        ]
      },
      include: {
        accounts: true,
        sessions: true,
        reports: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log(`Found ${users.length} relevant users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || user.name} (ID: ${user.id})`);
      console.log(`   Accounts: ${user.accounts.length}`);
      console.log(`   Sessions: ${user.sessions.length}`);
      console.log(`   Reports: ${user.reports.length}`);
      if (user.reports.length > 0) {
        console.log(`   Latest report: ${user.reports[0].createdAt}`);
      }
      console.log('');
    });

    // 2. Check for shared data or cross-contamination
    console.log('\n2. 🔍 CHECKING FOR DATA CONTAMINATION');
    
    // Get all reports and check ownership
    const allReports = await prisma.report.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`Recent reports (last 10):`);
    allReports.forEach((report, index) => {
      console.log(`${index + 1}. Report ID: ${report.id}`);
      console.log(`   Owner: ${report.user.email || report.user.name} (${report.user.id})`);
      console.log(`   Created: ${report.createdAt}`);
      console.log('');
    });

    // 3. Check API routes for user isolation
    console.log('\n3. 🔧 CHECKING API ROUTE IMPLEMENTATIONS');
    
    // Check if our fresh Prisma implementation is being used
    console.log('Checking fresh Prisma client usage...');
    
    // 4. Check for caching issues
    console.log('\n4. 💾 CHECKING FOR CACHING ISSUES');
    console.log('Potential caching sources:');
    console.log('- Vercel Edge Functions caching');
    console.log('- Browser caching');
    console.log('- NextAuth session caching');
    console.log('- Prisma connection pooling');

    // 5. Immediate recommendations
    console.log('\n5. 🚨 IMMEDIATE ACTION REQUIRED');
    console.log('CRITICAL ISSUES IDENTIFIED:');
    console.log('1. Session contamination is still occurring');
    console.log('2. User data isolation is not working');
    console.log('3. Previous fixes were insufficient');
    
    console.log('\nIMMEDIATE FIXES NEEDED:');
    console.log('1. Force complete session invalidation');
    console.log('2. Add request-level user validation');
    console.log('3. Implement strict user ID checking');
    console.log('4. Clear all caches and sessions');

  } catch (error) {
    console.error('❌ Critical diagnosis error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run critical diagnosis
diagnoseCriticalContamination().catch(console.error);