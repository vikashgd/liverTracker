/**
 * Check Share Links in Database
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function checkShareLinks() {
  try {
    console.log('🔍 Checking share links in database...');
    
    const shareLinks = await prisma.shareLink.findMany({
      select: {
        id: true,
        token: true,
        title: true,
        shareType: true,
        isActive: true,
        expiresAt: true,
        password: true,
        currentViews: true,
        maxViews: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`📋 Found ${shareLinks.length} share links:`);
    
    shareLinks.forEach((link, index) => {
      console.log(`\n${index + 1}. Share Link:`);
      console.log(`   ID: ${link.id}`);
      console.log(`   Token: ${link.token.substring(0, 20)}...`);
      console.log(`   Title: ${link.title}`);
      console.log(`   Type: ${link.shareType}`);
      console.log(`   Active: ${link.isActive}`);
      console.log(`   Has Password: ${!!link.password}`);
      console.log(`   Views: ${link.currentViews}/${link.maxViews || 'unlimited'}`);
      console.log(`   Expires: ${link.expiresAt}`);
      console.log(`   User: ${link.user?.name} (${link.user?.email})`);
      console.log(`   Created: ${link.createdAt}`);
    });

    // Check the specific token
    const specificToken = '923e44aeac921eacf181cffbb1075708027d197d450e1b7cd5ff8886dda72128';
    const specificLink = await prisma.shareLink.findUnique({
      where: { token: specificToken },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (specificLink) {
      console.log(`\n🎯 Specific Token Details:`);
      console.log(`   Title: ${specificLink.title}`);
      console.log(`   Active: ${specificLink.isActive}`);
      console.log(`   Expired: ${new Date() > specificLink.expiresAt}`);
      console.log(`   Has Password: ${!!specificLink.password}`);
      console.log(`   Password Hash: ${specificLink.password?.substring(0, 20)}...`);
    } else {
      console.log(`\n❌ Specific token not found in database`);
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkShareLinks();