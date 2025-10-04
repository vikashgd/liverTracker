import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db'; // ✅ Use shared singleton instance
import { DataExtractor } from '@/lib/medical-platform/processing/extractor';
import { getParameterByName } from '@/lib/medical-platform/core/parameters';
import { 
  markFirstReportUploaded, 
  markSecondReportUploaded 
} from '@/lib/onboarding-utils';

export async function GET(request: NextRequest) {
  console.log('🔍 Reports API: Starting request');
  
  try {
    // CRITICAL: Get fresh session for EVERY request
    const session = await getServerSession(authOptions);
    console.log('🔍 Reports API: Session check', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email 
    });

    if (!session?.user?.id) {
      console.log('❌ Reports API: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    const userId = session.user.id;
    console.log('✅ Reports API: Authenticated user:', userId);

    // ✅ Use shared Prisma instance - no need to create new client
    // CRITICAL: Double-check user exists and get ONLY their data
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });

      if (!userExists) {
        console.log('❌ Reports API: User not found in database:', userId);
        return NextResponse.json({ error: 'User not found' }, { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }

      console.log('✅ Reports API: User verified:', userExists.email);

      // CRITICAL: Get ONLY this user's report files with STRICT filtering
      const reportFiles = await prisma.reportFile.findMany({
        where: {
          userId: userId, // STRICT: Only this user's files
          // Additional safety check
          user: {
            id: userId
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`✅ Reports API: Found ${reportFiles.length} reports for user ${userId}`);

      // CRITICAL: Verify ALL returned data belongs to the requesting user
      const contaminated = reportFiles.filter(report => report.userId !== userId);
      if (contaminated.length > 0) {
        console.error('🚨 CRITICAL: Data contamination detected!', {
          requestingUser: userId,
          contaminatedReports: contaminated.map(r => ({ id: r.id, userId: r.userId }))
        });
        
        // Return empty array if contamination detected
        return NextResponse.json([], {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-User-ID': userId,
            'X-Contamination-Detected': 'true'
          }
        });
      }

      // Transform to expected format using correct ReportFile fields
      const reports = reportFiles.map(file => ({
        id: file.id,
        filename: file.objectKey, // Use objectKey as filename
        createdAt: file.createdAt,
        userId: file.userId,
        contentType: file.contentType,
        reportType: file.reportType,
        reportDate: file.reportDate,
        objectKey: file.objectKey
      }));

      console.log(`✅ Reports API: Returning ${reports.length} clean reports for user ${userId}`);

      return NextResponse.json(reports, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-User-ID': userId,
          'X-Report-Count': reports.length.toString()
        }
      });

    // ✅ No finally block needed - shared Prisma instance stays alive

  } catch (error) {
    console.error('❌ Reports API: Critical error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('📤 Reports API POST: Starting request');
  
  try {
    // CRITICAL: Get fresh session for EVERY request
    const session = await getServerSession(authOptions);
    console.log('📤 Reports API POST: Session check', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email 
    });

    if (!session?.user?.id) {
      console.log('❌ Reports API POST: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    const userId = session.user.id;
    console.log('✅ Reports API POST: Authenticated user:', userId);

    // Parse request body
    const body = await request.json();
    const { objectKey, contentType, reportDate, extracted } = body;

    console.log('📤 Reports API POST: Request data', {
      objectKey,
      contentType,
      hasReportDate: !!reportDate,
      hasExtracted: !!extracted
    });

    if (!objectKey) {
      return NextResponse.json({ error: 'Missing objectKey' }, { status: 400 });
    }

    // ✅ Use shared Prisma instance - already imported at top
    // CRITICAL: Double-check user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });

    if (!userExists) {
      console.log('❌ Reports API POST: User not found in database:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ Reports API POST: User verified:', userExists.email);

    // Create report file record
    const reportFile = await prisma.reportFile.create({
      data: {
        userId: userId,
        objectKey: objectKey,
        contentType: contentType || 'application/octet-stream',
        reportDate: reportDate ? new Date(reportDate) : null,
        reportType: extracted?.reportType || null
      }
    });

    console.log('✅ Reports API POST: Created report file:', reportFile.id);

    // 🎯 ONBOARDING INTEGRATION: Update onboarding progress based on report count
    try {
      const userReportCount = await prisma.reportFile.count({
        where: { userId: userId }
      });

      console.log(`📊 User ${userId} now has ${userReportCount} reports`);

      // Update onboarding flags based on report count
      if (userReportCount === 1) {
        console.log('🎉 First report uploaded - updating onboarding status');
        const success = await markFirstReportUploaded(userId);
        if (success) {
          console.log('✅ Successfully marked first report uploaded');
        } else {
          console.error('❌ Failed to mark first report uploaded');
        }
      } else if (userReportCount === 2) {
        console.log('🎉 Second report uploaded - updating onboarding status');
        const success = await markSecondReportUploaded(userId);
        if (success) {
          console.log('✅ Successfully marked second report uploaded');
        } else {
          console.error('❌ Failed to mark second report uploaded');
        }
      }
      
      // Auto-completion temporarily disabled to prevent auth issues
    } catch (onboardingError) {
      console.error('❌ Error updating onboarding status:', onboardingError);
      // Don't fail the entire request if onboarding update fails
    }

    // 🔧 FIX: Use Medical Platform DataExtractor for metric name standardization
    if (extracted) {
      try {
        console.log('🧠 Reports API POST: Standardizing AI extraction metrics');
        
        // Process metrics through standardization pipeline
        const standardizedMetrics = [];
        
        // Process both structured metrics and metricsAll array
        const allExtractedMetrics = [];
        
        // Add structured metrics (higher priority)
        if (extracted.metrics) {
          for (const [metricName, metricData] of Object.entries(extracted.metrics)) {
            if (metricData && typeof metricData === 'object') {
              const { value, unit } = metricData as { value: number; unit?: string };
              if (value !== null && value !== undefined && !isNaN(value)) {
                allExtractedMetrics.push({ name: metricName, value, unit, source: 'structured' });
              }
            }
          }
        }

        // Add metricsAll array (lower priority, avoid duplicates)
        if (extracted.metricsAll && Array.isArray(extracted.metricsAll)) {
          const structuredNames = new Set(allExtractedMetrics.map(m => m.name.toLowerCase()));
          
          for (const metric of extracted.metricsAll) {
            if (metric && typeof metric === 'object') {
              const { name, value, unit } = metric;
              if (name && value !== null && value !== undefined && !isNaN(value)) {
                // Only add if not already in structured metrics
                if (!structuredNames.has(name.toLowerCase())) {
                  allExtractedMetrics.push({ name, value, unit, source: 'array' });
                }
              }
            }
          }
        }

        console.log(`📊 Processing ${allExtractedMetrics.length} extracted metrics for standardization`);

        // Standardize each metric name and prepare for database
        for (const metric of allExtractedMetrics) {
          // 🎯 KEY FIX: Use medical platform parameter lookup for standardization
          const parameter = getParameterByName(metric.name);
          
          if (parameter) {
            // ✅ Found standardized parameter - use canonical name
            const standardizedMetric = {
              reportId: reportFile.id,
              name: parameter.metric, // 🔧 This is the standardized canonical name!
              value: metric.value ? parseFloat(metric.value.toString()) : null,
              textValue: JSON.stringify({
                originalName: metric.name,
                source: metric.source,
                standardized: true,
                parameterFound: true
              }),
              unit: metric.unit || null,
              category: parameter.category || 'general'
            };
            
            standardizedMetrics.push(standardizedMetric);
            console.log(`✅ Standardized: "${metric.name}" → "${parameter.metric}"`);
            
          } else {
            // ⚠️ No standardized parameter found - save with original name but mark as non-standard
            const nonStandardMetric = {
              reportId: reportFile.id,
              name: metric.name, // Keep original name
              value: metric.value ? parseFloat(metric.value.toString()) : null,
              textValue: JSON.stringify({
                originalName: metric.name,
                source: metric.source,
                standardized: false,
                parameterFound: false,
                warning: 'No standardized parameter definition found'
              }),
              unit: metric.unit || null,
              category: 'other'
            };
            
            standardizedMetrics.push(nonStandardMetric);
            console.log(`⚠️ Non-standard metric kept as-is: "${metric.name}"`);
          }
        }

        // Save all standardized metrics to database
        if (standardizedMetrics.length > 0) {
          await prisma.extractedMetric.createMany({
            data: standardizedMetrics
          });
          
          const standardizedCount = standardizedMetrics.filter(m => {
            try {
              const textValue = JSON.parse(m.textValue || '{}');
              return textValue.standardized === true;
            } catch {
              return false;
            }
          }).length;
          
          console.log(`✅ Saved ${standardizedMetrics.length} metrics (${standardizedCount} standardized, ${standardizedMetrics.length - standardizedCount} non-standard)`);
          
          // Create timeline event
          await prisma.timelineEvent.create({
            data: {
              userId: userId,
              type: 'report_processed',
              reportId: reportFile.id,
              details: {
                totalMetrics: standardizedMetrics.length,
                standardizedMetrics: standardizedCount,
                nonStandardMetrics: standardizedMetrics.length - standardizedCount,
                processingMethod: 'medical_platform_standardization'
              }
            }
          });
        }
        
      } catch (standardizationError) {
        console.error('❌ Metric standardization error:', standardizationError);
        
        // Emergency fallback: Save raw data with clear marking
        console.log('🆘 Emergency fallback: Saving raw extracted data');
        if (extracted.metricsAll && Array.isArray(extracted.metricsAll)) {
          const emergencyMetrics = extracted.metricsAll.map((metric: any) => ({
            reportId: reportFile.id,
            name: `[EMERGENCY_RAW] ${metric.name || 'unknown'}`,
            value: metric.value ? parseFloat(metric.value.toString()) : null,
            textValue: JSON.stringify({
              originalName: metric.name,
              error: 'Standardization failed',
              fallbackSave: true
            }),
            unit: metric.unit || null,
            category: 'emergency'
          }));

          if (emergencyMetrics.length > 0) {
            await prisma.extractedMetric.createMany({ data: emergencyMetrics });
            console.log(`🆘 Created ${emergencyMetrics.length} emergency fallback metrics`);
          }
        }
      }
    }

    console.log('✅ Reports API POST: Successfully created report');

    return NextResponse.json({ 
      id: reportFile.id,
      objectKey: reportFile.objectKey,
      success: true 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-User-ID': userId
      }
    });

  } catch (error) {
    console.error('❌ Reports API POST: Critical error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}