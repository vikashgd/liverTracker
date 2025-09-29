/**
 * DASHBOARD ACCESS CHECK
 * The ONLY condition: Profile complete + Has reports = Dashboard access
 */

import { prisma } from '@/lib/db';

export async function canAccessDashboard(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profile: {
          select: {
            gender: true,
            height: true,
            weight: true,
          }
        },
        _count: {
          select: {
            reportFiles: true,
          }
        }
      }
    });

    if (!user) return false;

    const hasProfile = !!(user.profile?.gender && user.profile?.height && user.profile?.weight);
    const hasReports = user._count.reportFiles > 0;

    return hasProfile && hasReports;
  } catch (error) {
    console.error('Dashboard access check failed:', error);
    return false;
  }
}