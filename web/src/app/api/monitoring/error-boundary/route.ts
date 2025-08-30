import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

interface ErrorBoundaryReport {
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  errorInfo: {
    componentStack: string;
  };
  errorId: string;
  timestamp: string;
  userAgent: string;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body: ErrorBoundaryReport = await request.json();

    // Validate request body
    if (!body.error || !body.errorInfo) {
      return NextResponse.json(
        { error: 'Invalid error boundary report format' },
        { status: 400 }
      );
    }

    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // Create comprehensive error report
    const errorReport = {
      id: body.errorId,
      type: 'error_boundary',
      error: {
        name: body.error.name,
        message: body.error.message,
        stack: body.error.stack
      },
      context: {
        componentStack: body.errorInfo.componentStack,
        url: body.url,
        userAgent: body.userAgent,
        timestamp: body.timestamp,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        ipAddress: clientIP
      },
      environment: process.env.NODE_ENV || 'unknown',
      reportedAt: new Date().toISOString()
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary Report:', {
        id: errorReport.id,
        error: errorReport.error.message,
        component: extractComponentFromStack(errorReport.context.componentStack),
        user: errorReport.context.userId || 'anonymous'
      });
    }

    // Send to monitoring services in production
    if (process.env.NODE_ENV === 'production') {
      await Promise.allSettled([
        sendToSentry(errorReport),
        sendToSlack(errorReport),
        sendToWebhook(errorReport)
      ]);
    }

    // Store for analysis
    await storeErrorBoundaryReport(errorReport);

    return NextResponse.json({ 
      success: true, 
      errorId: errorReport.id 
    });

  } catch (error) {
    console.error('Failed to process error boundary report:', error);
    
    return NextResponse.json(
      { error: 'Failed to process error boundary report' },
      { status: 500 }
    );
  }
}

function extractComponentFromStack(componentStack: string): string {
  // Extract the first component name from the component stack
  const lines = componentStack.split('\n');
  for (const line of lines) {
    const match = line.trim().match(/^in (\w+)/);
    if (match) {
      return match[1];
    }
  }
  return 'Unknown';
}

async function sendToSentry(errorReport: any) {
  if (!process.env.SENTRY_DSN) return;

  try {
    // In a real implementation, you would use @sentry/node
    // const Sentry = require('@sentry/node');
    // 
    // Sentry.withScope((scope) => {
    //   scope.setTag('errorType', 'error_boundary');
    //   scope.setTag('component', extractComponentFromStack(errorReport.context.componentStack));
    //   scope.setUser({
    //     id: errorReport.context.userId,
    //     email: errorReport.context.userEmail,
    //     ip_address: errorReport.context.ipAddress
    //   });
    //   scope.setContext('errorBoundary', {
    //     componentStack: errorReport.context.componentStack,
    //     url: errorReport.context.url,
    //     timestamp: errorReport.context.timestamp
    //   });
    //   
    //   const error = new Error(errorReport.error.message);
    //   error.name = errorReport.error.name;
    //   error.stack = errorReport.error.stack;
    //   
    //   Sentry.captureException(error);
    // });

    console.log('Would send to Sentry:', errorReport.id);
  } catch (error) {
    console.error('Failed to send to Sentry:', error);
  }
}

async function sendToSlack(errorReport: any) {
  if (!process.env.SLACK_WEBHOOK_URL) return;

  try {
    const component = extractComponentFromStack(errorReport.context.componentStack);
    
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🔥 React Error Boundary Triggered`,
        attachments: [{
          color: 'warning',
          fields: [
            {
              title: 'Component',
              value: component,
              short: true
            },
            {
              title: 'Error',
              value: errorReport.error.name,
              short: true
            },
            {
              title: 'User',
              value: errorReport.context.userId || 'Anonymous',
              short: true
            },
            {
              title: 'URL',
              value: errorReport.context.url,
              short: true
            },
            {
              title: 'Message',
              value: errorReport.error.message,
              short: false
            }
          ],
          footer: `Error ID: ${errorReport.id}`,
          ts: Math.floor(new Date(errorReport.context.timestamp).getTime() / 1000)
        }]
      })
    });
  } catch (error) {
    console.error('Failed to send to Slack:', error);
  }
}

async function sendToWebhook(errorReport: any) {
  if (!process.env.ERROR_WEBHOOK_URL) return;

  try {
    await fetch(process.env.ERROR_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ERROR_WEBHOOK_TOKEN}`
      },
      body: JSON.stringify({
        type: 'error_boundary',
        data: errorReport
      })
    });
  } catch (error) {
    console.error('Failed to send to webhook:', error);
  }
}

async function storeErrorBoundaryReport(errorReport: any) {
  try {
    // In a real implementation, you would store this in your database
    // Example with Prisma:
    // await prisma.errorBoundaryLog.create({
    //   data: {
    //     id: errorReport.id,
    //     errorName: errorReport.error.name,
    //     errorMessage: errorReport.error.message,
    //     errorStack: errorReport.error.stack,
    //     componentStack: errorReport.context.componentStack,
    //     url: errorReport.context.url,
    //     userAgent: errorReport.context.userAgent,
    //     userId: errorReport.context.userId,
    //     ipAddress: errorReport.context.ipAddress,
    //     timestamp: new Date(errorReport.context.timestamp),
    //     reportedAt: new Date(errorReport.reportedAt)
    //   }
    // });

    console.log('Would store error boundary report:', errorReport.id);
  } catch (error) {
    console.error('Failed to store error boundary report:', error);
  }
}

// GET endpoint for error boundary statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check admin access
    const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // In a real implementation, query your database for statistics
    const stats = {
      totalErrorBoundaries: 0,
      errorsByComponent: {},
      errorsByUser: {},
      recentErrors: [],
      errorTrends: {
        last24Hours: 0,
        last7Days: 0,
        last30Days: 0
      }
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Failed to get error boundary statistics:', error);
    
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}