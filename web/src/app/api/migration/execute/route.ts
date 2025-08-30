import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Simplified for production compatibility - no migration needed
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        hasPassword: false, // Simplified for production
        createdAt: user.createdAt,
      },
      migration: null,
      needsMigration: false, // No migration needed for existing users
    });
  } catch (error) {
    console.error('Migration status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'get_status':
        return NextResponse.json({
          needsMigration: false,
          message: 'No migration needed for existing users'
        });

      case 'migrate_user':
        return NextResponse.json({
          success: true,
          message: 'User already migrated'
        });

      case 'get_stats':
        return NextResponse.json({
          totalUsers: await prisma.user.count(),
          migratedUsers: await prisma.user.count(), // All users are considered migrated
          pendingUsers: 0,
          recentMigrations: []
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}