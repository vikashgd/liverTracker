/**
 * Debug script to check what data exists for the user
 */

const { PrismaClient } = require('./src/generated/prisma');

async function debugUserData() {
  const prisma = new PrismaClient();
  
  try {
    // The user ID from the logs
    const userId = 'cmeyldl830000x2prraxfeqgj';
    
    console.log('🔍 Debugging user data for:', userId);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
    
    console.log('👤 User:', user);
    
    // Check reports
    const reports = await prisma.reportFile.findMany({
      where: { userId },
      select: {
        id: true,
        reportType: true,
        reportDate: true,
        createdAt: true,
        _count: {
          select: {
            metrics: true
          }
        }
      }
    });
    
    console.log('📊 Reports:', reports.length);
    reports.forEach(report => {
      console.log(`  - ${report.id}: ${report.reportType} (${report._count.metrics} metrics)`);
    });
    
    // Check metrics directly
    const metrics = await prisma.extractedMetric.findMany({
      where: {
        report: { userId }
      },
      select: {
        id: true,
        name: true,
        value: true,
        unit: true,
        createdAt: true,
        report: {
          select: {
            id: true,
            reportType: true
          }
        }
      },
      take: 10
    });
    
    console.log('🧪 Metrics:', metrics.length);
    metrics.forEach(metric => {
      console.log(`  - ${metric.name}: ${metric.value} ${metric.unit}`);
    });
    
    // Check if there are ANY reports in the database
    const allReports = await prisma.reportFile.findMany({
      select: {
        id: true,
        userId: true,
        reportType: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true
          }
        },
        _count: {
          select: {
            metrics: true
          }
        }
      },
      take: 10
    });
    
    console.log('🗂️ All reports in database:', allReports.length);
    allReports.forEach(report => {
      console.log(`  - ${report.id}: ${report.user.email} (${report._count.metrics} metrics)`);
    });
    
    // Check if there are ANY metrics
    const allMetrics = await prisma.extractedMetric.count();
    console.log('📈 Total metrics in database:', allMetrics);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserData();