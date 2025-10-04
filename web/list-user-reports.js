const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function listUserReports() {
  try {
    console.log('📊 Fetching users and their report counts...\n');

    // Get all users with their report counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            reportFiles: true
          }
        }
      },
      orderBy: {
        reportFiles: {
          _count: 'desc'
        }
      }
    });

    if (users.length === 0) {
      console.log('No users found in database.');
      return;
    }

    console.log(`Found ${users.length} users:\n`);
    console.log('USER NAME / EMAIL                                    | REPORTS');
    console.log('─'.repeat(70));

    users.forEach(user => {
      const displayName = user.name || user.email || 'Unknown';
      const nameColumn = displayName.padEnd(50);
      const reportCount = user._count.reportFiles;
      
      console.log(`${nameColumn} | ${reportCount}`);
    });

    console.log('─'.repeat(70));
    
    const totalReports = users.reduce((sum, user) => sum + user._count.reportFiles, 0);
    console.log(`\nTotal: ${users.length} users, ${totalReports} reports`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUserReports();
