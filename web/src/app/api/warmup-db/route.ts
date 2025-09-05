/**
 * Quick database warmup endpoint
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Run multiple warmup queries in parallel
    await Promise.all([
      // Basic connection test
      prisma.$queryRaw`SELECT 1`,
      // Warm up common tables
      prisma.user.findFirst({ select: { id: true } }),
      prisma.reportFile.findFirst({ select: { id: true } }),
    ]);
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      message: 'Database warmed up successfully'
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Database warmup failed:', error);
    
    return NextResponse.json({ 
      status: 'error', 
      duration: `${duration}ms`,
      error: 'Database connection failed' 
    }, { status: 500 });
  }
}