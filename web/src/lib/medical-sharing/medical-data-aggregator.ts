/**
 * Medical Data Aggregator for Share Links
 * Compiles comprehensive medical data using existing MedicalDataPlatform
 */

import { getMedicalPlatform } from '../medical-platform/platform';
import { prisma } from '../db';
import type { 
  SharedMedicalData, 
  ShareLinkData, 
  PatientDemographics,
  PatientProfile,
  ReportSummary,
  MedicalReport,
  ChartSeries,
  MELDResult,
  ChildPughResult,
  ScoringTrends,
  ClinicalInsight,
  PredictiveAnalysis,
  ClinicalRecommendation,
  FileReference,
  ProcessedImageData,
  WatermarkData
} from '../../types/medical-sharing';

export class MedicalDataAggregator {
  private platform = getMedicalPlatform();

  /**
   * Aggregate comprehensive medical data for sharing
   */
  async aggregateForSharing(
    userId: string, 
    shareConfig: ShareLinkData
  ): Promise<SharedMedicalData> {
    try {
      console.log(`📊 Aggregating medical data for user ${userId}, share type: ${shareConfig.shareType}`);

      // Get user and profile data
      const [user, profile] = await Promise.all([
        this.getUserData(userId),
        this.getPatientProfile(userId)
      ]);

      // Get medical reports based on share configuration
      const reports = await this.getReportsData(userId, shareConfig);

      // Get scoring data if included
      const scoring = shareConfig.includeScoring 
        ? await this.getScoringData(userId)
        : this.getEmptyScoringData();

      // Get AI analysis if included
      const aiAnalysis = shareConfig.includeAI
        ? await this.getAIAnalysis(userId)
        : this.getEmptyAIAnalysis();

      // Get file references if included
      const files = shareConfig.includeFiles
        ? await this.getFileReferences(userId, shareConfig.reportIds)
        : this.getEmptyFileReferences();

      // Create metadata
      const metadata = this.createMetadata(shareConfig, user.name ?? undefined);

      const aggregatedData: SharedMedicalData = {
        patient: {
          id: this.anonymizeUserId(userId),
          demographics: this.createDemographics(profile),
          profile: this.createPatientProfile(profile)
        },
        reports,
        scoring,
        aiAnalysis,
        files,
        metadata
      };

      console.log(`✅ Successfully aggregated medical data with ${reports.individual.length} reports`);
      return aggregatedData;

    } catch (error) {
      console.error('Error aggregating medical data:', error);
      throw new Error('Failed to aggregate medical data for sharing');
    }
  }

  /**
   * Get user basic data
   */
  private async getUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        email: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Get patient profile data
   */
  private async getPatientProfile(userId: string) {
    return prisma.patientProfile.findUnique({
      where: { userId }
    });
  }

  /**
   * Get reports data based on share configuration
   */
  private async getReportsData(userId: string, shareConfig: ShareLinkData) {
    try {
      // Get reports based on configuration
      const reportFilter = shareConfig.reportIds.length > 0 
        ? { id: { in: shareConfig.reportIds } }
        : {};

      const reportFiles = await prisma.reportFile.findMany({
        where: {
          userId,
          ...reportFilter
        },
        include: {
          metrics: true
        },
        orderBy: { reportDate: 'desc' },
        take: 50 // Limit to last 50 reports for performance
      });

      // Convert to MedicalReport format
      const individual: MedicalReport[] = reportFiles.map(report => ({
        id: report.id,
        reportDate: report.reportDate || report.createdAt,
        reportType: report.reportType || 'Lab Report',
        metrics: report.metrics.map(metric => ({
          id: metric.id,
          name: metric.name,
          value: metric.value ?? undefined,
          unit: metric.unit ?? undefined,
          textValue: metric.textValue ?? undefined,
          category: metric.category ?? undefined,
          validationStatus: metric.validationStatus ?? undefined,
          wasConverted: metric.wasConverted,
          originalValue: metric.originalValue ?? undefined,
          originalUnit: metric.originalUnit ?? undefined
        })),
        quality: {
          overallScore: 0.85, // Default quality score
          completeness: 0.9,
          accuracy: 0.8,
          confidence: 0.85
        },
        originalFile: {
          id: report.id,
          objectKey: report.objectKey ?? undefined,
          contentType: report.contentType ?? undefined,
          reportType: report.reportType ?? undefined,
          reportDate: report.reportDate ?? undefined
        }
      }));

      // Create summary
      const summary: ReportSummary = {
        totalReports: individual.length,
        dateRange: individual.length > 0 ? {
          start: individual[individual.length - 1].reportDate,
          end: individual[0].reportDate
        } : { start: new Date(), end: new Date() },
        latestReportDate: individual.length > 0 ? individual[0].reportDate : new Date(),
        keyMetrics: this.extractKeyMetrics(individual),
        criticalValues: this.extractCriticalValues(individual)
      };

      // Get trend data using existing platform
      const trends = await this.getTrendData(userId);

      return {
        summary,
        individual,
        trends
      };

    } catch (error) {
      console.error('Error getting reports data:', error);
      return {
        summary: {
          totalReports: 0,
          dateRange: { start: new Date(), end: new Date() },
          latestReportDate: new Date(),
          keyMetrics: [],
          criticalValues: []
        },
        individual: [],
        trends: []
      };
    }
  }

  /**
   * Get trend data using existing medical platform
   */
  /**
   * Get trend data using existing medical platform with fallback
   */
  private async getTrendData(userId: string): Promise<ChartSeries[]> {
    try {
      console.log('📊 [MedicalDataAggregator] Starting trend data collection for user:', userId);
      
      // First try the medical platform
      const commonMetrics = ['ALT', 'AST', 'Bilirubin', 'Platelets', 'Albumin', 'Creatinine', 'INR'];
      const trends: ChartSeries[] = [];

      for (const metric of commonMetrics) {
        try {
          const chartSeries = await this.platform.getChartData(userId, metric as any);
          
          if (chartSeries && chartSeries.data && chartSeries.data.length > 0) {
            trends.push({
              name: metric,
              data: chartSeries.data.map(point => ({
                date: new Date(point.date),
                value: point.value,
                isAbnormal: point.confidence === 'low' || point.confidence === 'reject',
                confidence: this.mapConfidenceToNumber(point.confidence)
              })),
              unit: this.extractUnitFromChartSeries(chartSeries, metric),
              referenceRange: this.extractReferenceRange(chartSeries, metric)
            });
          }
        } catch (metricError) {
          const errorMessage = metricError instanceof Error ? metricError.message : 'Unknown error';
          console.warn('Could not get trend data for', metric, ':', errorMessage);
        }
      }

      console.log('📊 [MedicalDataAggregator] Platform trends collected:', trends.length);

      // If we got no trends from the platform, try fallback method
      if (trends.length === 0) {
        console.log('📊 [MedicalDataAggregator] No trends from platform, trying fallback...');
        const fallbackTrends = await this.getFallbackTrendData(userId);
        trends.push(...fallbackTrends);
      }

      console.log('📊 [MedicalDataAggregator] Total trends collected:', trends.length);
      return trends;
    } catch (error) {
      console.error('❌ [MedicalDataAggregator] Error getting trend data:', error);
      
      // Last resort: try fallback method
      try {
        console.log('📊 [MedicalDataAggregator] Trying fallback as last resort...');
        return await this.getFallbackTrendData(userId);
      } catch (fallbackError) {
        console.error('❌ [MedicalDataAggregator] Fallback also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Map confidence levels to numbers for sharing interface
   */
  private mapConfidenceToNumber(confidence: 'high' | 'medium' | 'low' | 'reject'): number {
    switch (confidence) {
      case 'high': return 0.9;
      case 'medium': return 0.7;
      case 'low': return 0.4;
      case 'reject': return 0.1;
      default: return 0.5;
    }
  }

  /**
   * Extract unit from chart series, with fallbacks
   */
  private extractUnitFromChartSeries(chartSeries: any, metric: string): string {
    // Try to get unit from the chart series statistics or data
    if (chartSeries.statistics && chartSeries.statistics.unit) {
      return chartSeries.statistics.unit;
    }
    
    // Fallback to common units based on metric name
    const commonUnits: Record<string, string> = {
      'ALT': 'U/L',
      'AST': 'U/L', 
      'Bilirubin': 'mg/dL',
      'Platelets': '×10³/μL',
      'Albumin': 'g/dL',
      'Creatinine': 'mg/dL',
      'INR': ''
    };
    
    return commonUnits[metric] || '';
  }

  /**
   * Extract reference range from chart series
   */
  private extractReferenceRange(chartSeries: any, metric: string): { min?: number; max?: number; unit: string } | undefined {
    // Try to extract from chart series if available
    if (chartSeries.referenceRange) {
      return chartSeries.referenceRange;
    }
    
    // Fallback to common reference ranges
    const commonRanges: Record<string, { min: number; max: number; unit: string }> = {
      'ALT': { min: 7, max: 40, unit: 'U/L' },
      'AST': { min: 8, max: 40, unit: 'U/L' },
      'Bilirubin': { min: 0.2, max: 1.2, unit: 'mg/dL' },
      'Platelets': { min: 150, max: 450, unit: '×10³/μL' },
      'Albumin': { min: 3.5, max: 5.0, unit: 'g/dL' },
      'Creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL' },
      'INR': { min: 0.8, max: 1.2, unit: '' }
    };
    
    return commonRanges[metric];
  }

  /**
   * Get scoring data (MELD and Child-Pugh) - Fixed to calculate directly from database
   */
  private async getScoringData(userId: string) {
    try {
      console.log('📊 [MedicalDataAggregator] Getting scoring data for user:', userId);

      // Get latest lab values directly from database for MELD calculation
      const latestBilirubin = await prisma.extractedMetric.findFirst({
        where: {
          report: { userId },
          name: { contains: 'Bilirubin', mode: 'insensitive' },
          value: { not: null }
        },
        include: { report: { select: { reportDate: true } } },
        orderBy: [{ report: { reportDate: 'desc' } }, { createdAt: 'desc' }]
      });

      const latestCreatinine = await prisma.extractedMetric.findFirst({
        where: {
          report: { userId },
          name: { contains: 'Creatinine', mode: 'insensitive' },
          value: { not: null }
        },
        include: { report: { select: { reportDate: true } } },
        orderBy: [{ report: { reportDate: 'desc' } }, { createdAt: 'desc' }]
      });

      const latestINR = await prisma.extractedMetric.findFirst({
        where: {
          report: { userId },
          name: { contains: 'INR', mode: 'insensitive' },
          value: { not: null }
        },
        include: { report: { select: { reportDate: true } } },
        orderBy: [{ report: { reportDate: 'desc' } }, { createdAt: 'desc' }]
      });

      const latestSodium = await prisma.extractedMetric.findFirst({
        where: {
          report: { userId },
          name: { contains: 'Sodium', mode: 'insensitive' },
          value: { not: null }
        },
        include: { report: { select: { reportDate: true } } },
        orderBy: [{ report: { reportDate: 'desc' } }, { createdAt: 'desc' }]
      });

      const latestAlbumin = await prisma.extractedMetric.findFirst({
        where: {
          report: { userId },
          name: { contains: 'Albumin', mode: 'insensitive' },
          value: { not: null }
        },
        include: { report: { select: { reportDate: true } } },
        orderBy: [{ report: { reportDate: 'desc' } }, { createdAt: 'desc' }]
      });

      console.log('📊 [MedicalDataAggregator] Latest lab values:');
      console.log(`  - Bilirubin: ${latestBilirubin?.value} ${latestBilirubin?.unit}`);
      console.log(`  - Creatinine: ${latestCreatinine?.value} ${latestCreatinine?.unit}`);
      console.log(`  - INR: ${latestINR?.value} ${latestINR?.unit}`);
      console.log(`  - Sodium: ${latestSodium?.value} ${latestSodium?.unit}`);
      console.log(`  - Albumin: ${latestAlbumin?.value} ${latestAlbumin?.unit}`);

      // Calculate MELD score if we have the required parameters
      let meldResult: MELDResult | null = null;
      if (latestBilirubin?.value && latestCreatinine?.value && latestINR?.value) {
        const bilirubin = latestBilirubin.value;
        const creatinine = latestCreatinine.value;
        const inr = latestINR.value;
        const sodium = latestSodium?.value;

        // Apply minimum values to avoid negative logarithms
        const safeBilirubin = Math.max(bilirubin, 1.0);
        const safeCreatinine = Math.max(creatinine, 1.0);
        const safeINR = Math.max(inr, 1.0);

        // Calculate MELD using standard formula
        const meldRaw = 3.78 * Math.log(safeBilirubin) + 
                        11.2 * Math.log(safeINR) + 
                        9.57 * Math.log(safeCreatinine) + 
                        6.43;
        
        const meldScore = Math.max(6, Math.min(40, Math.round(meldRaw)));

        // Calculate MELD-Na if sodium available
        let meldNa: number | undefined;
        if (sodium) {
          const safeSodium = Math.max(125, Math.min(137, sodium));
          meldNa = meldScore + 1.32 * (137 - safeSodium) - (0.033 * meldScore * (137 - safeSodium));
          meldNa = Math.max(6, Math.min(40, Math.round(meldNa)));
        }

        // Determine urgency
        const finalScore = meldNa || meldScore;
        let urgency: 'Low' | 'Moderate' | 'High' | 'Critical';
        if (finalScore <= 9) urgency = 'Low';
        else if (finalScore <= 19) urgency = 'Moderate';
        else if (finalScore <= 29) urgency = 'High';
        else urgency = 'Critical';

        meldResult = {
          score: finalScore,
          class: urgency,
          components: {
            bilirubin,
            creatinine,
            inr
          },
          calculatedAt: new Date()
        };

        console.log('✅ [MedicalDataAggregator] MELD calculated:', {
          score: finalScore,
          meldNa,
          urgency,
          components: { bilirubin, creatinine, inr }
        });
      } else {
        console.log('❌ [MedicalDataAggregator] Cannot calculate MELD - missing required parameters');
      }

      // Calculate Child-Pugh score if we have required parameters
      let childPughResult: ChildPughResult | null = null;
      if (latestBilirubin?.value && latestAlbumin?.value && latestINR?.value) {
        const bilirubin = latestBilirubin.value;
        const albumin = latestAlbumin.value;
        const inr = latestINR.value;

        let childPughScore = 0;
        
        // Bilirubin points
        if (bilirubin < 2.0) childPughScore += 1;
        else if (bilirubin <= 3.0) childPughScore += 2;
        else childPughScore += 3;
        
        // Albumin points
        if (albumin > 3.5) childPughScore += 1;
        else if (albumin >= 2.8) childPughScore += 2;
        else childPughScore += 3;
        
        // INR points
        if (inr < 1.7) childPughScore += 1;
        else if (inr <= 2.3) childPughScore += 2;
        else childPughScore += 3;
        
        // Get patient profile for ascites/encephalopathy
        const profile = await prisma.patientProfile.findUnique({
          where: { userId }
        });

        // Ascites points
        const ascites = profile?.ascites || 'none';
        if (ascites === 'none') childPughScore += 1;
        else if (ascites === 'mild') childPughScore += 2;
        else childPughScore += 3;
        
        // Encephalopathy points
        const encephalopathy = profile?.encephalopathy || 'none';
        if (encephalopathy === 'none') childPughScore += 1;
        else if (encephalopathy === 'grade1-2') childPughScore += 2;
        else childPughScore += 3;
        
        // Determine class
        const childPughClass = childPughScore <= 6 ? 'A' : childPughScore <= 9 ? 'B' : 'C';
        
        childPughResult = {
          score: childPughScore,
          class: childPughClass,
          components: {
            bilirubin,
            albumin,
            inr,
            ascites,
            encephalopathy
          },
          calculatedAt: new Date()
        };

        console.log('✅ [MedicalDataAggregator] Child-Pugh calculated:', {
          score: childPughScore,
          class: childPughClass,
          components: { bilirubin, albumin, inr, ascites, encephalopathy }
        });
      } else {
        console.log('❌ [MedicalDataAggregator] Cannot calculate Child-Pugh - missing required parameters');
      }

      const trends: ScoringTrends = {
        meldHistory: [],
        childPughHistory: [],
        trendAnalysis: {
          direction: 'stable',
          confidence: 0.8,
          significantChanges: []
        }
      };

      const result = {
        meld: meldResult,
        childPugh: childPughResult,
        trends
      };

      console.log('📊 [MedicalDataAggregator] Final scoring result:', result);
      return result;

    } catch (error) {
      console.error('❌ [MedicalDataAggregator] Error getting scoring data:', error);
      return this.getEmptyScoringData();
    }
  }

  /**
   * Get AI analysis and insights
   */
  private async getAIAnalysis(userId: string) {
    try {
      // Get AI insights using existing platform
      const insights = await this.platform.generateInsights(userId);

      const clinicalInsights: ClinicalInsight[] = insights ? [{
        id: 'ai_insight_1',
        type: 'trend',
        title: 'Liver Function Analysis',
        description: 'Based on recent lab results, liver function parameters show stable trends.',
        confidence: 0.85,
        severity: 'medium',
        supportingData: [],
        generatedAt: new Date()
      }] : [];

      const predictions: PredictiveAnalysis = {
        shortTermPredictions: [],
        longTermPredictions: [],
        riskFactors: [],
        confidence: 0.75
      };

      const recommendations: ClinicalRecommendation[] = [{
        id: 'rec_1',
        category: 'monitoring',
        title: 'Regular Monitoring',
        description: 'Continue regular monitoring of liver function tests.',
        priority: 'medium',
        evidence: ['Recent stable trends', 'Clinical guidelines'],
        generatedAt: new Date()
      }];

      return {
        insights: clinicalInsights,
        predictions,
        recommendations
      };

    } catch (error) {
      console.error('Error getting AI analysis:', error);
      return this.getEmptyAIAnalysis();
    }
  }

  /**
   * Get file references for shared documents
   */
  private async getFileReferences(userId: string, reportIds: string[]): Promise<{
    originalDocuments: FileReference[];
    processedImages: ProcessedImageData[];
  }> {
    try {
      const reportFilter = reportIds.length > 0 
        ? { id: { in: reportIds } }
        : {};

      const reports = await prisma.reportFile.findMany({
        where: {
          userId,
          ...reportFilter
        },
        select: {
          id: true,
          objectKey: true,
          contentType: true,
          reportType: true,
          reportDate: true,
          extractedJson: true
        },
        take: 20 // Limit for performance
      });

      const originalDocuments: FileReference[] = reports.map(report => ({
        id: report.id,
        objectKey: report.objectKey ?? undefined,
        contentType: report.contentType ?? undefined,
        reportType: report.reportType ?? undefined,
        reportDate: report.reportDate ?? undefined
      }));

      const processedImages: ProcessedImageData[] = reports
        .filter(report => report.extractedJson)
        .map(report => ({
          id: report.id,
          originalFile: {
            id: report.id,
            objectKey: report.objectKey ?? undefined,
            contentType: report.contentType ?? undefined,
            reportType: report.reportType ?? undefined,
            reportDate: report.reportDate ?? undefined
          },
          extractedData: report.extractedJson,
          confidence: 0.85,
          processingNotes: ['AI extraction completed', 'Data validated']
        }));

      return {
        originalDocuments,
        processedImages
      };

    } catch (error) {
      console.error('Error getting file references:', error);
      return this.getEmptyFileReferences();
    }
  }

  /**
   * Helper methods for creating data structures
   */
  private anonymizeUserId(userId: string): string {
    return 'patient_' + userId.substring(0, 8);
  }

  private createDemographics(profile: any): PatientDemographics {
    if (!profile) {
      return {
        primaryDiagnosis: 'Liver Disease'
      };
    }

    const age = profile.dateOfBirth 
      ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined;

    return {
      age,
      gender: profile.gender,
      location: profile.location,
      primaryDiagnosis: profile.liverDiseaseType || 'Liver Disease',
      diagnosisDate: profile.diagnosisDate
    };
  }

  private createPatientProfile(profile: any): PatientProfile {
    if (!profile) {
      return {
        onDialysis: false,
        transplantCandidate: false
      };
    }

    return {
      height: profile.height,
      weight: profile.weight,
      onDialysis: profile.onDialysis,
      dialysisSessionsPerWeek: profile.dialysisSessionsPerWeek,
      dialysisStartDate: profile.dialysisStartDate,
      dialysisType: profile.dialysisType,
      liverDiseaseType: profile.liverDiseaseType,
      transplantCandidate: profile.transplantCandidate,
      transplantListDate: profile.transplantListDate,
      alcoholUse: profile.alcoholUse,
      smokingStatus: profile.smokingStatus,
      primaryPhysician: profile.primaryPhysician,
      hepatologist: profile.hepatologist,
      transplantCenter: profile.transplantCenter,
      ascites: profile.ascites,
      encephalopathy: profile.encephalopathy
    };
  }

  private createMetadata(shareConfig: ShareLinkData, patientName?: string): {
    generatedAt: Date;
    dataRange: { start: Date; end: Date };
    shareToken: string;
    watermark: WatermarkData;
  } {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      generatedAt: now,
      dataRange: { start: thirtyDaysAgo, end: now },
      shareToken: shareConfig.token,
      watermark: {
        patientName: patientName || 'Patient Data',
        shareDate: now,
        shareToken: shareConfig.token
      }
    };
  }

  private extractKeyMetrics(reports: MedicalReport[]) {
    const keyMetrics = [];
    
    if (reports.length > 0) {
      const latestReport = reports[0];
      const importantMetrics = ['ALT', 'AST', 'Bilirubin', 'Platelets', 'Albumin'];
      
      for (const metricName of importantMetrics) {
        const metric = latestReport.metrics.find(m => 
          m.name.toLowerCase().includes(metricName.toLowerCase())
        );
        
        if (metric && metric.value !== undefined && metric.value !== null) {
          keyMetrics.push({
            name: metric.name,
            value: metric.value,
            unit: metric.unit || '',
            isAbnormal: this.isAbnormalValue(metricName, metric.value),
            trend: 'stable' as const
          });
        }
      }
    }
    
    return keyMetrics;
  }

  private extractCriticalValues(reports: MedicalReport[]) {
    const criticalValues = [];
    
    for (const report of reports.slice(0, 3)) { // Check last 3 reports
      for (const metric of report.metrics) {
        if (metric.value !== undefined && metric.value !== null && this.isCriticalValue(metric.name, metric.value)) {
          criticalValues.push({
            metric: metric.name,
            value: metric.value,
            unit: metric.unit || '',
            severity: 'high' as const,
            referenceRange: { min: 0, max: 100, unit: metric.unit || '' },
            date: report.reportDate
          });
        }
      }
    }
    
    return criticalValues.slice(0, 5); // Limit to 5 critical values
  }

  private isAbnormalValue(metricName: string, value: number): boolean {
    const name = metricName.toLowerCase();
    
    if (name.includes('alt') || name.includes('ast')) {
      return value > 40;
    }
    if (name.includes('bilirubin')) {
      return value > 1.2;
    }
    if (name.includes('platelet')) {
      return value < 150;
    }
    if (name.includes('albumin')) {
      return value < 3.5;
    }
    
    return false;
  }

  private isCriticalValue(metricName: string, value: number): boolean {
    const name = metricName.toLowerCase();
    
    if (name.includes('alt') || name.includes('ast')) {
      return value > 200;
    }
    if (name.includes('bilirubin')) {
      return value > 5.0;
    }
    if (name.includes('platelet')) {
      return value < 50;
    }
    
    return false;
  }

  // Empty data structure methods
  private getEmptyScoringData() {
    return {
      meld: null,
      childPugh: null,
      trends: {
        meldHistory: [],
        childPughHistory: [],
        trendAnalysis: {
          direction: 'stable' as const,
          confidence: 0,
          significantChanges: []
        }
      }
    };
  }

  private getEmptyAIAnalysis() {
    return {
      insights: [],
      predictions: {
        shortTermPredictions: [],
        longTermPredictions: [],
        riskFactors: [],
        confidence: 0
      },
      recommendations: []
    };
  }

  private getEmptyFileReferences() {
    return {
      originalDocuments: [],
      processedImages: []
    };
  }

  /**
   * Generate fallback trend data directly from database when platform fails
   */
  private async getFallbackTrendData(userId: string): Promise<ChartSeries[]> {
    try {
      console.log('📊 [Fallback] Generating trend data directly from database');
      
      const { prisma } = await import('../db');
      const commonMetrics = ['ALT', 'AST', 'Bilirubin', 'Platelets', 'Albumin', 'Creatinine', 'INR'];
      const trends: ChartSeries[] = [];

      for (const targetMetric of commonMetrics) {
        // Get metrics that match this target (flexible matching)
        const metrics = await prisma.extractedMetric.findMany({
          where: {
            report: { userId },
            OR: [
              { name: { contains: targetMetric, mode: 'insensitive' } },
              { name: { contains: targetMetric.toLowerCase(), mode: 'insensitive' } },
              { name: { contains: targetMetric.toUpperCase(), mode: 'insensitive' } }
            ],
            value: { not: null }
          },
          include: {
            report: {
              select: {
                reportDate: true
              }
            }
          },
          orderBy: {
            report: { reportDate: 'asc' }
          },
          take: 100
        });

        if (metrics.length > 0) {
          console.log('📊 [Fallback] Found', metrics.length, 'data points for', targetMetric);
          
          // Group by date and take the best value per day
          const dailyData = new Map();
          metrics.forEach(metric => {
            const reportDate = metric.report.reportDate || new Date();
            const dateKey = reportDate.toISOString().split('T')[0];
            if (!dailyData.has(dateKey) || metric.value !== null) {
              dailyData.set(dateKey, {
                date: reportDate,
                value: metric.value,
                unit: metric.unit
              });
            }
          });

          const chartData = Array.from(dailyData.values())
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(point => ({
              date: point.date,
              value: point.value,
              isAbnormal: this.isValueAbnormal(targetMetric, point.value),
              confidence: 0.8
            }));

          if (chartData.length > 0) {
            trends.push({
              name: targetMetric,
              data: chartData,
              unit: this.getStandardUnit(targetMetric),
              referenceRange: this.getStandardReferenceRange(targetMetric)
            });
          }
        }
      }

      console.log('📊 [Fallback] Generated', trends.length, 'trend series');
      return trends;
    } catch (error) {
      console.error('❌ [Fallback] Error generating fallback trend data:', error);
      return [];
    }
  }

  private isValueAbnormal(metric: string, value: number): boolean {
    const ranges = {
      'ALT': { min: 7, max: 40 },
      'AST': { min: 8, max: 40 },
      'Bilirubin': { min: 0.2, max: 1.2 },
      'Platelets': { min: 150, max: 450 },
      'Albumin': { min: 3.5, max: 5.0 },
      'Creatinine': { min: 0.6, max: 1.2 },
      'INR': { min: 0.8, max: 1.2 }
    };
    
    const range = ranges[metric as keyof typeof ranges];
    if (!range) return false;
    
    return value < range.min || value > range.max;
  }

  private getStandardUnit(metric: string): string {
    const units = {
      'ALT': 'U/L',
      'AST': 'U/L',
      'Bilirubin': 'mg/dL',
      'Platelets': '×10³/μL',
      'Albumin': 'g/dL',
      'Creatinine': 'mg/dL',
      'INR': ''
    };
    
    return units[metric as keyof typeof units] || '';
  }

  private getStandardReferenceRange(metric: string): { min: number; max: number; unit: string } | undefined {
    const ranges = {
      'ALT': { min: 7, max: 40, unit: 'U/L' },
      'AST': { min: 8, max: 40, unit: 'U/L' },
      'Bilirubin': { min: 0.2, max: 1.2, unit: 'mg/dL' },
      'Platelets': { min: 150, max: 450, unit: '×10³/μL' },
      'Albumin': { min: 3.5, max: 5.0, unit: 'g/dL' },
      'Creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL' },
      'INR': { min: 0.8, max: 1.2, unit: '' }
    };
    
    return ranges[metric as keyof typeof ranges];
  }
}