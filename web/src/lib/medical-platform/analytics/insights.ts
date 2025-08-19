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

    // Calculate clinical scores
    const meldResult = await this.calculateMELDFromReport(report);
    if (meldResult) {
      scores.meld = meldResult.score;
      scores.meldNa = meldResult.naScore;
      insights.push(`MELD Score: ${meldResult.score} (${meldResult.risk})`);
      
      if (meldResult.naScore) {
        insights.push(`MELD-Na Score: ${meldResult.naScore}`);
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
   * Calculate MELD score from user data
   */
  async calculateMELD(userId: string): Promise<{
    score: number;
    naScore?: number;
    risk: string;
    components: Record<string, number>;
  } | null> {
    // This would typically fetch latest values from repository
    // For now, return null as this is a foundational implementation
    console.log('MELD calculation for user:', userId);
    return null;
  }

  /**
   * Calculate MELD score from report data
   */
  async calculateMELDFromReport(report: MedicalReport): Promise<{
    score: number;
    naScore?: number;
    risk: string;
    components: Record<string, number>;
  } | null> {
    const bilirubin = report.values.get('Bilirubin');
    const inr = report.values.get('INR');
    const creatinine = report.values.get('Creatinine');
    const sodium = report.values.get('Sodium');

    if (!bilirubin || !inr || !creatinine) {
      return null;
    }

    // Extract values
    const bilirubinValue = bilirubin.processed.value;
    const inrValue = inr.processed.value;
    const creatinineValue = creatinine.processed.value;
    const sodiumValue = sodium?.processed.value;

    // Apply MELD formula caps
    const cappedBilirubin = Math.max(1.0, Math.min(4.0, bilirubinValue));
    const cappedINR = Math.max(1.0, Math.min(4.0, inrValue));
    const cappedCreatinine = Math.max(1.0, Math.min(4.0, creatinineValue));

    // MELD calculation
    const meldScore = Math.round(
      3.78 * Math.log(cappedBilirubin) +
      11.2 * Math.log(cappedINR) +
      9.57 * Math.log(cappedCreatinine) +
      6.43
    );

    const finalMeldScore = Math.max(6, Math.min(40, meldScore));

    // MELD-Na calculation if sodium available
    let meldNaScore: number | undefined;
    if (sodiumValue) {
      const cappedSodium = Math.max(125, Math.min(137, sodiumValue));
      meldNaScore = finalMeldScore + 1.32 * (137 - cappedSodium) - (0.033 * finalMeldScore * (137 - cappedSodium));
      meldNaScore = Math.round(Math.max(6, Math.min(40, meldNaScore)));
    }

    // Risk assessment
    const risk = this.assessMELDRisk(finalMeldScore);

    return {
      score: finalMeldScore,
      naScore: meldNaScore,
      risk,
      components: {
        bilirubin: bilirubinValue,
        inr: inrValue,
        creatinine: creatinineValue,
        ...(sodiumValue && { sodium: sodiumValue })
      }
    };
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
