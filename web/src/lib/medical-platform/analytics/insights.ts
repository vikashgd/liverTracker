/**
 * INSIGHTS ENGINE
 * Advanced analytics and clinical insights for medical data
 */

import type {
  MedicalReport,
  MedicalValue,
  PlatformConfig,
  MetricName
} from '../core/types';
import { MEDICAL_PARAMETERS, getMELDComponents } from '../core/parameters';
import { 
  calculateMELD, 
  calculateChildPugh,
  validateMELDParameters,
  type MELDParameters,
  type MELDResult,
  type ChildPughParameters,
  type ChildPughResult
} from '../../meld-calculator';

/**
 * Medical Insights Engine
 * Provides clinical analytics, MELD scores, and data quality insights
 */
export class InsightsEngine {
  private config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  // ================================
  // CLINICAL ANALYTICS
  // ================================

  /**
   * Analyze a medical report and generate insights
   */
  async analyze(report: MedicalReport): Promise<{
    clinicalInsights: string[];
    recommendations: string[];
    riskFactors: string[];
    scores: {
      meld?: number;
      meldNa?: number;
      childPugh?: string;
    };
  }> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const riskFactors: string[] = [];
    const scores: any = {};

    // Calculate clinical scores with comprehensive MELD calculator
    const meldResult = await this.calculateMELDFromReport(report);
    if (meldResult) {
      scores.meld = meldResult.meld;
      scores.meldNa = meldResult.meldNa;
      scores.meld3 = meldResult.meld3;
      
      // Add primary score insight
      const primaryScore = meldResult.meld3 || meldResult.meldNa || meldResult.meld;
      const scoreType = meldResult.meld3 ? 'MELD 3.0' : meldResult.meldNa ? 'MELD-Na' : 'MELD';
      insights.push(`${scoreType} Score: ${primaryScore} (${meldResult.urgency} Priority)`);
      
      // Add interpretation
      insights.push(meldResult.interpretation);
      
      // Add transplant priority info
      if (meldResult.transplantPriority) {
        insights.push(`Transplant Status: ${meldResult.transplantPriority}`);
      }
      
      // Add warnings as recommendations
      if (meldResult.warnings.length > 0) {
        recommendations.push(...meldResult.warnings);
      }
      
      // Add missing parameter recommendations
      if (meldResult.missingParameters.length > 0) {
        recommendations.push(`Consider adding: ${meldResult.missingParameters.join(', ')} for more accurate MELD calculation`);
      }
      
      // Add dialysis adjustment info
      if (meldResult.adjustments.dialysisAdjustment) {
        insights.push(`Dialysis adjustment applied: Creatinine set to ${meldResult.adjustments.creatinineAdjusted} mg/dL`);
      }
    }

    // Analyze individual values
    for (const [metric, value] of report.values) {
      const valueInsights = this.analyzeValue(value);
      insights.push(...valueInsights.insights);
      recommendations.push(...valueInsights.recommendations);
      riskFactors.push(...valueInsights.riskFactors);
    }

    // Cross-metric analysis
    const crossAnalysis = this.analyzeCrossMetrics(report.values);
    insights.push(...crossAnalysis.insights);
    recommendations.push(...crossAnalysis.recommendations);

    return {
      clinicalInsights: [...new Set(insights)],
      recommendations: [...new Set(recommendations)],
      riskFactors: [...new Set(riskFactors)],
      scores
    };
  }

  /**
   * Calculate MELD score from user data with comprehensive validation
   */
  async calculateMELD(userId: string, clinicalData?: {
    gender?: 'male' | 'female';
    dialysis?: {
      onDialysis: boolean;
      sessionsPerWeek: number;
      lastSession?: string;
    };
  }): Promise<MELDResult | null> {
    // This would typically fetch latest values from repository
    // For now, we'll use the report-based calculation
    console.log('🧮 MELD calculation for user:', userId);
    
    // In a real implementation, this would:
    // 1. Fetch latest lab values from repository
    // 2. Extract MELD parameters
    // 3. Apply clinical data (dialysis, gender)
    // 4. Calculate using the comprehensive MELD calculator
    
    return null; // Placeholder - will be implemented when repository is connected
  }

  /**
   * Calculate MELD score from report data using comprehensive calculator
   */
  async calculateMELDFromReport(
    report: MedicalReport, 
    clinicalData?: {
      gender?: 'male' | 'female';
      dialysis?: {
        onDialysis: boolean;
        sessionsPerWeek: number;
        lastSession?: string;
      };
    }
  ): Promise<MELDResult | null> {
    console.log('🧮 Calculating MELD from report data...');

    const bilirubin = report.values.get('Bilirubin');
    const inr = report.values.get('INR');
    const creatinine = report.values.get('Creatinine');
    const sodium = report.values.get('Sodium');
    const albumin = report.values.get('Albumin');

    // Check if we have minimum required parameters
    if (!bilirubin || !inr || !creatinine) {
      console.log('❌ Missing required MELD parameters:', {
        bilirubin: !!bilirubin,
        inr: !!inr,
        creatinine: !!creatinine
      });
      return null;
    }

    // Build MELD parameters object
    const meldParams: MELDParameters = {
      bilirubin: bilirubin.processed.value,
      creatinine: creatinine.processed.value,
      inr: inr.processed.value,
      sodium: sodium?.processed.value,
      albumin: albumin?.processed.value,
      gender: clinicalData?.gender,
      dialysis: clinicalData?.dialysis
    };

    console.log('🔍 MELD Parameters:', {
      bilirubin: `${meldParams.bilirubin} mg/dL`,
      creatinine: `${meldParams.creatinine} mg/dL`,
      inr: meldParams.inr,
      sodium: meldParams.sodium ? `${meldParams.sodium} mEq/L` : 'Not provided',
      albumin: meldParams.albumin ? `${meldParams.albumin} g/dL` : 'Not provided',
      gender: meldParams.gender || 'Not provided',
      dialysis: meldParams.dialysis?.onDialysis ? `Yes (${meldParams.dialysis.sessionsPerWeek}/week)` : 'Not provided'
    });

    // Validate parameters
    const validation = validateMELDParameters(meldParams);
    if (!validation.isValid) {
      console.log('❌ MELD parameter validation failed:', validation.errors);
      return null;
    }

    // Log validation warnings and recommendations
    if (validation.warnings.length > 0) {
      console.log('⚠️ MELD validation warnings:', validation.warnings);
    }
    if (validation.recommendations.length > 0) {
      console.log('💡 MELD recommendations:', validation.recommendations);
    }

    // Calculate MELD using comprehensive calculator
    const meldResult = calculateMELD(meldParams);
    
    console.log('✅ MELD Calculation Result:', {
      meld: meldResult.meld,
      meldNa: meldResult.meldNa,
      meld3: meldResult.meld3,
      urgency: meldResult.urgency,
      confidence: meldResult.confidence,
      warnings: meldResult.warnings.length,
      missingParams: meldResult.missingParameters.length
    });

    return meldResult;
  }

  private assessMELDRisk(score: number): string {
    if (score <= 9) return 'Low risk';
    if (score <= 19) return 'Moderate risk';
    if (score <= 29) return 'High risk';
    return 'Very high risk';
  }

  // ================================
  // VALUE-SPECIFIC ANALYSIS
  // ================================

  private analyzeValue(value: MedicalValue): {
    insights: string[];
    recommendations: string[];
    riskFactors: string[];
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const riskFactors: string[] = [];

    const parameter = MEDICAL_PARAMETERS[value.metric];
    if (!parameter) return { insights, recommendations, riskFactors };

    const processedValue = value.processed.value;
    const normalRange = parameter.clinical.normalRange;

    // Status-based insights
    switch (value.validation.clinicalStatus) {
      case 'critical_low':
        insights.push(`Critically low ${parameter.name}: ${processedValue} ${value.processed.unit}`);
        riskFactors.push(`Critical ${parameter.name} deficiency`);
        recommendations.push('Immediate medical evaluation required');
        break;

      case 'critical_high':
        insights.push(`Critically elevated ${parameter.name}: ${processedValue} ${value.processed.unit}`);
        riskFactors.push(`Severe ${parameter.name} elevation`);
        recommendations.push('Urgent medical attention needed');
        break;

      case 'low':
        insights.push(`Below normal ${parameter.name}: ${processedValue} ${value.processed.unit} (normal: ${normalRange.min}-${normalRange.max})`);
        recommendations.push(`Monitor ${parameter.name} trend`);
        break;

      case 'high':
        insights.push(`Elevated ${parameter.name}: ${processedValue} ${value.processed.unit} (normal: ${normalRange.min}-${normalRange.max})`);
        recommendations.push(`Follow up on ${parameter.name} elevation`);
        break;
    }

    // Parameter-specific insights
    this.addParameterSpecificInsights(value, insights, recommendations, riskFactors);

    return { insights, recommendations, riskFactors };
  }

  private addParameterSpecificInsights(
    value: MedicalValue,
    insights: string[],
    recommendations: string[],
    riskFactors: string[]
  ): void {
    const processedValue = value.processed.value;

    switch (value.metric) {
      case 'Platelets':
        if (processedValue < 100) {
          riskFactors.push('Bleeding risk due to thrombocytopenia');
          recommendations.push('Avoid procedures with bleeding risk');
        }
        if (processedValue < 50) {
          riskFactors.push('High bleeding risk');
          recommendations.push('Consider platelet transfusion before procedures');
        }
        break;

      case 'Bilirubin':
        if (processedValue > 2.0) {
          insights.push('Jaundice likely present');
        }
        if (processedValue > 10.0) {
          riskFactors.push('Severe liver dysfunction');
        }
        break;

      case 'INR':
        if (processedValue > 1.5) {
          riskFactors.push('Increased bleeding risk');
          recommendations.push('Caution with invasive procedures');
        }
        if (processedValue > 2.5) {
          riskFactors.push('High bleeding risk');
        }
        break;

      case 'Albumin':
        if (processedValue < 3.0) {
          insights.push('Possible malnutrition or liver synthetic dysfunction');
          recommendations.push('Nutritional assessment recommended');
        }
        break;

      case 'Creatinine':
        if (processedValue > 1.5) {
          insights.push('Possible kidney dysfunction');
          recommendations.push('Monitor kidney function');
        }
        if (processedValue > 3.0) {
          riskFactors.push('Significant kidney impairment');
        }
        break;

      case 'ALT':
      case 'AST':
        if (processedValue > 100) {
          insights.push('Significant liver enzyme elevation');
        }
        if (processedValue > 500) {
          riskFactors.push('Acute liver injury');
          recommendations.push('Investigate cause of severe enzyme elevation');
        }
        break;
    }
  }

  // ================================
  // CROSS-METRIC ANALYSIS
  // ================================

  private analyzeCrossMetrics(values: Map<MetricName, MedicalValue>): {
    insights: string[];
    recommendations: string[];
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];

    // ALT/AST ratio analysis
    const alt = values.get('ALT');
    const ast = values.get('AST');
    if (alt && ast) {
      const ratio = ast.processed.value / alt.processed.value;
      if (ratio > 2) {
        insights.push(`AST/ALT ratio ${ratio.toFixed(1)} suggests alcoholic liver disease or cirrhosis`);
      } else if (ratio < 1) {
        insights.push('ALT > AST pattern suggests viral hepatitis or drug-induced injury');
      }
    }

    // Liver synthetic function assessment
    const albumin = values.get('Albumin');
    const inr = values.get('INR');
    if (albumin && inr) {
      if (albumin.processed.value < 3.0 && inr.processed.value > 1.3) {
        insights.push('Decreased liver synthetic function (low albumin + elevated INR)');
        recommendations.push('Consider liver synthetic function assessment');
      }
    }

    // Portal hypertension indicators
    const platelets = values.get('Platelets');
    const albumin2 = values.get('Albumin');
    if (platelets && albumin2) {
      if (platelets.processed.value < 100 && albumin2.processed.value < 3.5) {
        insights.push('Possible portal hypertension (low platelets + low albumin)');
        recommendations.push('Consider upper endoscopy for varices screening');
      }
    }

    // Kidney-liver interaction
    const creatinine = values.get('Creatinine');
    const bilirubin = values.get('Bilirubin');
    if (creatinine && bilirubin) {
      if (creatinine.processed.value > 2.0 && bilirubin.processed.value > 3.0) {
        insights.push('Combined liver-kidney dysfunction detected');
        recommendations.push('Consider hepatorenal syndrome evaluation');
      }
    }

    return { insights, recommendations };
  }

  // ================================
  // DATA QUALITY ANALYTICS
  // ================================

  /**
   * Analyze overall data quality for a user
   */
  async analyzeDataQuality(userId: string): Promise<{
    overallScore: number;
    completeness: number;
    reliability: number;
    trends: string[];
    gaps: Array<{ metric: MetricName; lastValue: Date }>;
  }> {
    // Placeholder for comprehensive data quality analysis
    return {
      overallScore: 0.8,
      completeness: 0.7,
      reliability: 0.9,
      trends: ['Improving liver function over past 6 months'],
      gaps: []
    };
  }

  /**
   * Detect and analyze data corruption
   */
  async detectAndFixCorruption(userId: string): Promise<{
    detected: number;
    corrected: number;
    patterns: string[];
  }> {
    // Placeholder for corruption detection and fixing
    return {
      detected: 0,
      corrected: 0,
      patterns: []
    };
  }

  /**
   * Detect duplicate entries
   */
  async detectDuplicates(userId: string): Promise<{
    duplicateSets: Array<{
      date: Date;
      metrics: MetricName[];
      reportIds: string[];
    }>;
    recommendedActions: string[];
  }> {
    // Placeholder for duplicate detection
    return {
      duplicateSets: [],
      recommendedActions: []
    };
  }

  /**
   * Generate comprehensive clinical insights
   */
  async generateClinicalInsights(userId: string): Promise<{
    summary: string;
    keyFindings: string[];
    trends: string[];
    recommendations: string[];
    riskFactors: string[];
  }> {
    // Placeholder for comprehensive clinical analysis
    return {
      summary: 'Liver function monitoring in progress',
      keyFindings: [],
      trends: [],
      recommendations: [],
      riskFactors: []
    };
  }

  // ================================
  // SYSTEM HEALTH
  // ================================

  async getHealth() {
    return {
      status: 'healthy',
      analyticsVersion: '1.0.0',
      meldCalculationEnabled: true,
      insightRulesLoaded: this.getInsightRulesCount(),
      lastAnalysis: new Date().toISOString()
    };
  }

  updateConfig(newConfig: PlatformConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  private getInsightRulesCount(): number {
    // Count available insight rules
    return Object.keys(MEDICAL_PARAMETERS).length * 3; // Approximate
  }
}
