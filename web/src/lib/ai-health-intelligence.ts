/**
 * AI-Powered Health Intelligence System
 * 
 * This module provides advanced analytics, trend analysis, and predictive modeling
 * for medical data to deliver personalized health insights and recommendations.
 */

import { CanonicalMetric } from './metrics';
import { calculateMELD, MELDParameters, MELDResult } from './meld-calculator';

export interface SeriesPoint {
  date: string;
  value: number | null;
  reportCount?: number;
}

export interface HealthMetric {
  name: CanonicalMetric;
  data: SeriesPoint[];
  unit: string;
  range: { low: number; high: number };
  color: string;
}

export interface TrendAnalysis {
  direction: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  confidence: number; // 0-1
  rate: number; // rate of change per month
  significance: 'none' | 'mild' | 'moderate' | 'significant' | 'severe';
  duration: number; // months of trend
  description: string;
  projection: {
    nextMonth: number;
    threeMonth: number;
    sixMonth: number;
    confidence: number;
  };
}

export interface HealthAlert {
  id: string;
  type: 'trend' | 'threshold' | 'correlation' | 'meld' | 'pattern';
  severity: 'info' | 'warning' | 'concerning' | 'critical';
  metric: CanonicalMetric | 'MELD' | 'multiple';
  title: string;
  description: string;
  recommendation: string;
  urgency: number; // 1-10
  created: string;
  dismissed?: boolean;
}

export interface HealthInsight {
  category: 'trend' | 'correlation' | 'risk' | 'improvement' | 'stability';
  importance: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  summary: string;
  details: string;
  actionable: boolean;
  recommendation?: string;
  metrics: CanonicalMetric[];
  confidence: number;
}

export interface HealthScore {
  overall: number; // 0-100
  liver: number;
  kidney: number;
  coagulation: number;
  nutrition: number;
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: string;
}

export interface PatientProfile {
  gender?: 'male' | 'female';
  age?: number;
  conditions?: string[];
  medications?: string[];
  primaryCondition?: string;
  diagnosisDate?: string; // ISO date string
  dialysis?: {
    onDialysis: boolean;
    sessionsPerWeek: number;
    lastSession?: string; // ISO date string
  };
}

export class HealthIntelligenceEngine {
  private metrics: HealthMetric[];
  private profile: PatientProfile;

  constructor(metrics: HealthMetric[], profile: PatientProfile = {}) {
    this.metrics = metrics;
    this.profile = profile;
  }

  /**
   * Analyze trends for a specific metric
   */
  analyzeTrend(metric: HealthMetric): TrendAnalysis {
    const validData = metric.data.filter(d => d.value !== null && d.value !== undefined) as Array<{date: string; value: number}>;
    
    if (validData.length < 2) {
      return {
        direction: 'insufficient_data',
        confidence: 0,
        rate: 0,
        significance: 'none',
        duration: 0,
        description: 'Insufficient data points for trend analysis',
        projection: { nextMonth: 0, threeMonth: 0, sixMonth: 0, confidence: 0 }
      };
    }

    // Sort by date
    validData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate trend using linear regression
    const n = validData.length;
    const xValues = validData.map((_, i) => i);
    const yValues = validData.map(d => d.value);
    
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssRes = yValues.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    const confidence = Math.max(0, Math.min(1, rSquared));

    // Calculate time span in months
    const firstDate = new Date(validData[0].date);
    const lastDate = new Date(validData[validData.length - 1].date);
    const monthsDuration = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    // Rate per month
    const ratePerMonth = slope / (n / Math.max(1, monthsDuration));
    
    // Determine direction and significance
    const latestValue = validData[validData.length - 1].value;
    const normalRange = metric.range;
    const isOutOfRange = latestValue < normalRange.low || latestValue > normalRange.high;
    
    let direction: TrendAnalysis['direction'];
    let significance: TrendAnalysis['significance'];
    
    const absRate = Math.abs(ratePerMonth);
    const relativeRate = absRate / ((normalRange.high - normalRange.low) / 2); // Relative to normal range
    
    if (Math.abs(slope) < 0.01) {
      direction = 'stable';
      significance = 'none';
    } else if (slope > 0) {
      direction = latestValue > normalRange.high ? 'declining' : 'improving';
    } else {
      direction = latestValue < normalRange.low ? 'declining' : 'improving';
    }
    
    // Adjust direction based on normal ranges
    if (metric.name === 'ALT' || metric.name === 'AST' || metric.name === 'Bilirubin') {
      // For these metrics, lower is better
      direction = slope < 0 ? 'improving' : slope > 0 ? 'declining' : 'stable';
    } else if (metric.name === 'Albumin' || metric.name === 'Platelets') {
      // For these metrics, higher is better
      direction = slope > 0 ? 'improving' : slope < 0 ? 'declining' : 'stable';
    }
    
    if (relativeRate > 0.3) significance = 'severe';
    else if (relativeRate > 0.2) significance = 'significant';
    else if (relativeRate > 0.1) significance = 'moderate';
    else if (relativeRate > 0.05) significance = 'mild';
    else significance = 'none';

    // Generate projections
    const lastIndex = validData.length - 1;
    const projection = {
      nextMonth: slope * (lastIndex + 1) + intercept,
      threeMonth: slope * (lastIndex + 3) + intercept,
      sixMonth: slope * (lastIndex + 6) + intercept,
      confidence: confidence * 0.8 // Reduce confidence for projections
    };

    const description = this.generateTrendDescription(metric.name, direction, significance, ratePerMonth, confidence);

    return {
      direction,
      confidence,
      rate: ratePerMonth,
      significance,
      duration: monthsDuration,
      description,
      projection
    };
  }

  /**
   * Generate comprehensive health alerts
   */
  generateAlerts(): HealthAlert[] {
    const alerts: HealthAlert[] = [];
    const alertId = () => `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 5)}`;

    // Analyze each metric for alerts
    this.metrics.forEach(metric => {
      const trend = this.analyzeTrend(metric);
      const latestValue = this.getLatestValue(metric);
      
      if (!latestValue) return;

      // Threshold alerts
      if (latestValue.value < metric.range.low || latestValue.value > metric.range.high) {
        const severity = this.calculateSeverity(latestValue.value, metric.range);
        alerts.push({
          id: alertId(),
          type: 'threshold',
          severity,
          metric: metric.name,
          title: `${metric.name} Outside Normal Range`,
          description: `Current ${metric.name} value (${latestValue.value} ${metric.unit}) is ${latestValue.value < metric.range.low ? 'below' : 'above'} normal range (${metric.range.low}-${metric.range.high} ${metric.unit}).`,
          recommendation: this.getThresholdRecommendation(metric.name, latestValue.value, metric.range),
          urgency: severity === 'critical' ? 9 : severity === 'concerning' ? 7 : 5,
          created: new Date().toISOString()
        });
      }

      // Trend alerts
      if (trend.direction === 'declining' && trend.significance !== 'none' && trend.confidence > 0.6) {
        alerts.push({
          id: alertId(),
          type: 'trend',
          severity: trend.significance === 'severe' ? 'critical' : trend.significance === 'significant' ? 'concerning' : 'warning',
          metric: metric.name,
          title: `${metric.name} Declining Trend Detected`,
          description: `${metric.name} has been declining for ${trend.duration.toFixed(1)} months with ${(trend.confidence * 100).toFixed(0)}% confidence.`,
          recommendation: this.getTrendRecommendation(metric.name, trend),
          urgency: trend.significance === 'severe' ? 8 : 6,
          created: new Date().toISOString()
        });
      }
    });

    // MELD Score alerts
    const meldAlert = this.generateMELDAlert();
    if (meldAlert) alerts.push(meldAlert);

    // Correlation alerts
    const correlationAlerts = this.generateCorrelationAlerts();
    alerts.push(...correlationAlerts);

    // Sort by urgency
    return alerts.sort((a, b) => b.urgency - a.urgency);
  }

  /**
   * Calculate overall health score
   */
  calculateHealthScore(): HealthScore {
    const now = new Date().toISOString();
    
    // Get latest values for key metrics
    const alt = this.getLatestValue(this.getMetric('ALT'));
    const ast = this.getLatestValue(this.getMetric('AST'));
    const bilirubin = this.getLatestValue(this.getMetric('Bilirubin'));
    const albumin = this.getLatestValue(this.getMetric('Albumin'));
    const platelets = this.getLatestValue(this.getMetric('Platelets'));
    const creatinine = this.getLatestValue(this.getMetric('Creatinine'));
    const inr = this.getLatestValue(this.getMetric('INR'));

    // Calculate component scores (0-100)
    const liverScore = this.calculateComponentScore([
      { metric: alt, range: { low: 7, high: 56 }, weight: 0.3 },
      { metric: ast, range: { low: 10, high: 40 }, weight: 0.3 },
      { metric: bilirubin, range: { low: 0.2, high: 1.2 }, weight: 0.2, inverse: true },
      { metric: albumin, range: { low: 3.5, high: 5.0 }, weight: 0.2 }
    ]);

    const kidneyScore = this.calculateComponentScore([
      { metric: creatinine, range: { low: 0.6, high: 1.2 }, weight: 1.0, inverse: true }
    ]);

    const coagulationScore = this.calculateComponentScore([
      { metric: inr, range: { low: 0.8, high: 1.2 }, weight: 0.7, inverse: true },
      { metric: platelets, range: { low: 150, high: 450 }, weight: 0.3 }
    ]);

    const nutritionScore = this.calculateComponentScore([
      { metric: albumin, range: { low: 3.5, high: 5.0 }, weight: 1.0 }
    ]);

    // Calculate overall score
    const overall = Math.round(
      (liverScore * 0.4 + kidneyScore * 0.2 + coagulationScore * 0.2 + nutritionScore * 0.2)
    );

    // Determine trend
    const trends = this.metrics.map(m => this.analyzeTrend(m));
    const improvingCount = trends.filter(t => t.direction === 'improving').length;
    const decliningCount = trends.filter(t => t.direction === 'declining').length;
    
    let trend: HealthScore['trend'];
    if (improvingCount > decliningCount) trend = 'improving';
    else if (decliningCount > improvingCount) trend = 'declining';
    else trend = 'stable';

    // Determine risk level
    let riskLevel: HealthScore['riskLevel'];
    if (overall >= 80) riskLevel = 'low';
    else if (overall >= 60) riskLevel = 'medium';
    else if (overall >= 40) riskLevel = 'high';
    else riskLevel = 'critical';

    return {
      overall,
      liver: liverScore,
      kidney: kidneyScore,
      coagulation: coagulationScore,
      nutrition: nutritionScore,
      trend,
      riskLevel,
      lastUpdated: now
    };
  }

  /**
   * Generate personalized health insights
   */
  generateInsights(): HealthInsight[] {
    const insights: HealthInsight[] = [];

    // Trend insights
    this.metrics.forEach(metric => {
      const trend = this.analyzeTrend(metric);
      if (trend.confidence > 0.7 && trend.significance !== 'none') {
        insights.push({
          category: 'trend',
          importance: trend.significance === 'severe' ? 'critical' : trend.significance === 'significant' ? 'high' : 'medium',
          title: `${metric.name} ${trend.direction === 'improving' ? 'Improvement' : 'Decline'} Detected`,
          summary: trend.description,
          details: `Analysis of ${metric.data.length} data points over ${trend.duration.toFixed(1)} months shows a ${trend.direction} trend with ${(trend.confidence * 100).toFixed(0)}% confidence.`,
          actionable: trend.direction === 'declining',
          recommendation: trend.direction === 'declining' ? this.getTrendRecommendation(metric.name, trend) : undefined,
          metrics: [metric.name],
          confidence: trend.confidence
        });
      }
    });

    // Correlation insights
    const correlations = this.analyzeCorrelations();
    correlations.forEach(corr => {
      if (Math.abs(corr.correlation) > 0.7) {
        insights.push({
          category: 'correlation',
          importance: 'medium',
          title: `Strong Correlation: ${corr.metric1} & ${corr.metric2}`,
          summary: `${corr.metric1} and ${corr.metric2} show ${corr.correlation > 0 ? 'positive' : 'negative'} correlation (${(corr.correlation * 100).toFixed(0)}%).`,
          details: `When ${corr.metric1} ${corr.correlation > 0 ? 'increases' : 'decreases'}, ${corr.metric2} tends to ${corr.correlation > 0 ? 'increase' : 'decrease'} as well. This pattern suggests these metrics may be influenced by similar factors.`,
          actionable: false,
          metrics: [corr.metric1, corr.metric2],
          confidence: Math.abs(corr.correlation)
        });
      }
    });

    // Risk insights
    const healthScore = this.calculateHealthScore();
    if (healthScore.riskLevel === 'high' || healthScore.riskLevel === 'critical') {
      insights.push({
        category: 'risk',
        importance: healthScore.riskLevel === 'critical' ? 'critical' : 'high',
        title: `${healthScore.riskLevel === 'critical' ? 'Critical' : 'Elevated'} Health Risk Detected`,
        summary: `Overall health score is ${healthScore.overall}/100, indicating ${healthScore.riskLevel} risk.`,
        details: `Multiple health indicators suggest increased risk. Liver function: ${healthScore.liver}/100, Kidney function: ${healthScore.kidney}/100, Coagulation: ${healthScore.coagulation}/100.`,
        actionable: true,
        recommendation: 'Consider consulting with your healthcare provider to discuss these findings and potential interventions.',
        metrics: ['ALT', 'AST', 'Bilirubin', 'Creatinine', 'INR'],
        confidence: 0.9
      });
    }

    return insights.sort((a, b) => {
      const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    });
  }

  // Helper methods
  private getMetric(name: CanonicalMetric): HealthMetric | undefined {
    return this.metrics.find(m => m.name === name);
  }

  private getLatestValue(metric?: HealthMetric): { value: number; date: string } | null {
    if (!metric) return null;
    const validData = metric.data.filter(d => d.value !== null && d.value !== undefined);
    if (validData.length === 0) return null;
    const latest = validData[validData.length - 1];
    return { value: latest.value!, date: latest.date };
  }

  private calculateSeverity(value: number, range: { low: number; high: number }): HealthAlert['severity'] {
    const deviation = Math.max(
      Math.abs(value - range.low) / range.low,
      Math.abs(value - range.high) / range.high
    );
    
    if (deviation > 2) return 'critical';
    if (deviation > 1) return 'concerning';
    if (deviation > 0.5) return 'warning';
    return 'info';
  }

  private calculateComponentScore(components: Array<{
    metric: { value: number; date: string } | null;
    range: { low: number; high: number };
    weight: number;
    inverse?: boolean;
  }>): number {
    let totalWeight = 0;
    let weightedScore = 0;

    components.forEach(({ metric, range, weight, inverse = false }) => {
      if (!metric) return;
      
      totalWeight += weight;
      let score: number;
      
      if (inverse) {
        // For metrics where lower is better (like creatinine, bilirubin)
        if (metric.value <= range.high) {
          score = 100;
        } else {
          const excess = metric.value - range.high;
          const maxExcess = range.high * 2; // Assume 2x normal is 0 score
          score = Math.max(0, 100 - (excess / maxExcess) * 100);
        }
      } else {
        // For metrics where being in range is better
        if (metric.value >= range.low && metric.value <= range.high) {
          score = 100;
        } else if (metric.value < range.low) {
          score = Math.max(0, (metric.value / range.low) * 100);
        } else {
          const excess = metric.value - range.high;
          const maxExcess = range.high; // Assume 2x normal is 0 score
          score = Math.max(0, 100 - (excess / maxExcess) * 100);
        }
      }
      
      weightedScore += score * weight;
    });

    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 50;
  }

  private generateTrendDescription(
    metric: CanonicalMetric,
    direction: TrendAnalysis['direction'],
    significance: TrendAnalysis['significance'],
    rate: number,
    confidence: number
  ): string {
    const confidenceText = confidence > 0.8 ? 'high confidence' : confidence > 0.6 ? 'moderate confidence' : 'low confidence';
    const significanceText = significance === 'severe' ? 'rapidly' : significance === 'significant' ? 'significantly' : significance === 'moderate' ? 'moderately' : 'slowly';
    
    if (direction === 'stable') {
      return `${metric} levels remain stable with ${confidenceText}.`;
    }
    
    return `${metric} is ${significanceText} ${direction} with ${confidenceText}. Rate of change: ${Math.abs(rate).toFixed(2)} ${direction === 'improving' ? 'improvement' : 'decline'} per month.`;
  }

  private getThresholdRecommendation(metric: CanonicalMetric, value: number, range: { low: number; high: number }): string {
    const recommendations: Record<CanonicalMetric, { low: string; high: string }> = {
      'ALT': {
        low: 'Low ALT is usually not concerning, but discuss with your healthcare provider.',
        high: 'Elevated ALT may indicate liver inflammation. Consider reviewing medications, alcohol intake, and discussing with your healthcare provider.'
      },
      'AST': {
        low: 'Low AST is usually not concerning.',
        high: 'Elevated AST may indicate liver or muscle damage. Discuss with your healthcare provider about potential causes.'
      },
      'Bilirubin': {
        low: 'Low bilirubin is usually not concerning.',
        high: 'Elevated bilirubin may indicate liver dysfunction or hemolysis. Urgent medical evaluation is recommended.'
      },
      'Albumin': {
        low: 'Low albumin may indicate liver dysfunction, malnutrition, or kidney disease. Discuss nutritional status and underlying conditions with your healthcare provider.',
        high: 'Elevated albumin is rare and may indicate dehydration.'
      },
      'Platelets': {
        low: 'Low platelets (thrombocytopenia) increases bleeding risk. Avoid activities with injury risk and consult your healthcare provider urgently.',
        high: 'Elevated platelets may increase clotting risk. Discuss with your healthcare provider.'
      },
      'Creatinine': {
        low: 'Low creatinine may indicate low muscle mass.',
        high: 'Elevated creatinine suggests kidney dysfunction. Ensure adequate hydration, review medications, and consult your healthcare provider.'
      },
      'INR': {
        low: 'Low INR may indicate increased clotting risk if on anticoagulation.',
        high: 'Elevated INR indicates increased bleeding risk. If on warfarin, consult your healthcare provider about dose adjustment.'
      },
      'ALP': {
        low: 'Low ALP is usually not concerning.',
        high: 'Elevated ALP may indicate liver or bone disease. Further evaluation may be needed.'
      },
      'GGT': {
        low: 'Low GGT is usually not concerning.',
        high: 'Elevated GGT may indicate liver disease or excessive alcohol consumption. Consider lifestyle modifications.'
      },
      'TotalProtein': {
        low: 'Low total protein may indicate liver dysfunction, kidney disease, or malnutrition.',
        high: 'Elevated total protein may indicate dehydration or inflammation.'
      },
      'Sodium': {
        low: 'Low sodium (hyponatremia) can be dangerous. Limit fluid intake and consult your healthcare provider urgently.',
        high: 'High sodium may indicate dehydration or kidney issues. Increase fluid intake and limit salt.'
      },
      'Potassium': {
        low: 'Low potassium can affect heart rhythm. Increase potassium-rich foods and consult your healthcare provider.',
        high: 'High potassium can be dangerous for heart rhythm. Limit potassium-rich foods and consult your healthcare provider urgently.'
      }
    };

    const isLow = value < range.low;
    return recommendations[metric]?.[isLow ? 'low' : 'high'] || 'Consult your healthcare provider about this result.';
  }

  private getTrendRecommendation(metric: CanonicalMetric, trend: TrendAnalysis): string {
    const recommendations: Record<CanonicalMetric, string> = {
      'ALT': 'Monitor liver health. Consider reviewing medications, reducing alcohol intake, and maintaining a healthy diet.',
      'AST': 'Monitor liver and muscle health. Consider reviewing physical activity, medications, and alcohol intake.',
      'Bilirubin': 'Increasing bilirubin trends require medical attention. Consult your healthcare provider promptly.',
      'Albumin': 'Declining albumin may indicate worsening liver function or malnutrition. Focus on adequate protein intake and discuss with your healthcare provider.',
      'Platelets': 'Declining platelet trend needs monitoring. Avoid medications that affect platelets and consult your healthcare provider.',
      'Creatinine': 'Rising creatinine suggests declining kidney function. Stay hydrated, review medications, and consult your healthcare provider.',
      'INR': 'Changing INR trends need monitoring, especially if on anticoagulation. Consult your healthcare provider about medication adjustments.',
      'ALP': 'Monitor this trend with your healthcare provider for potential liver or bone involvement.',
      'GGT': 'Consider reducing alcohol intake and discuss this trend with your healthcare provider.',
      'TotalProtein': 'Monitor nutritional status and discuss this trend with your healthcare provider.',
      'Sodium': 'Sodium trends may indicate fluid balance issues. Monitor fluid intake and consult your healthcare provider.',
      'Potassium': 'Monitor dietary potassium intake and discuss this trend with your healthcare provider.'
    };

    return recommendations[metric] || 'Monitor this trend closely and discuss with your healthcare provider.';
  }

  private generateMELDAlert(): HealthAlert | null {
    // Get MELD components
    const bilirubin = this.getLatestValue(this.getMetric('Bilirubin'));
    const creatinine = this.getLatestValue(this.getMetric('Creatinine'));
    const inr = this.getLatestValue(this.getMetric('INR'));
    const sodium = this.getLatestValue(this.getMetric('Sodium'));
    const albumin = this.getLatestValue(this.getMetric('Albumin'));

    if (!bilirubin || !creatinine || !inr) return null;

    const meldParams: MELDParameters = {
      bilirubin: bilirubin.value,
      creatinine: creatinine.value,
      inr: inr.value,
      sodium: sodium?.value,
      albumin: albumin?.value,
      gender: this.profile.gender,
      dialysis: this.profile.dialysis
    };

    const meldResult = calculateMELD(meldParams);
    const primaryScore = meldResult.meld3 || meldResult.meldNa || meldResult.meld;

    if (primaryScore >= 20) {
      return {
        id: `meld_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'meld',
        severity: primaryScore >= 30 ? 'critical' : 'concerning',
        metric: 'MELD',
        title: `Elevated MELD Score: ${primaryScore}`,
        description: meldResult.interpretation,
        recommendation: meldResult.transplantPriority,
        urgency: primaryScore >= 30 ? 10 : 8,
        created: new Date().toISOString()
      };
    }

    return null;
  }

  private generateCorrelationAlerts(): HealthAlert[] {
    const alerts: HealthAlert[] = [];
    const correlations = this.analyzeCorrelations();

    correlations.forEach(corr => {
      if (Math.abs(corr.correlation) > 0.8 && corr.significance === 'concerning') {
        alerts.push({
          id: `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${corr.metric1}_${corr.metric2}`,
          type: 'correlation',
          severity: 'warning',
          metric: 'multiple',
          title: `Unusual Correlation: ${corr.metric1} & ${corr.metric2}`,
          description: `Strong ${corr.correlation > 0 ? 'positive' : 'negative'} correlation detected between ${corr.metric1} and ${corr.metric2}.`,
          recommendation: 'This pattern may indicate an underlying condition affecting multiple organ systems. Discuss with your healthcare provider.',
          urgency: 6,
          created: new Date().toISOString()
        });
      }
    });

    return alerts;
  }

  private analyzeCorrelations(): Array<{
    metric1: CanonicalMetric;
    metric2: CanonicalMetric;
    correlation: number;
    significance: 'normal' | 'unusual' | 'concerning';
  }> {
    const correlations: Array<{
      metric1: CanonicalMetric;
      metric2: CanonicalMetric;
      correlation: number;
      significance: 'normal' | 'unusual' | 'concerning';
    }> = [];

    for (let i = 0; i < this.metrics.length; i++) {
      for (let j = i + 1; j < this.metrics.length; j++) {
        const metric1 = this.metrics[i];
        const metric2 = this.metrics[j];
        
        const correlation = this.calculateCorrelation(metric1, metric2);
        if (!isNaN(correlation)) {
          let significance: 'normal' | 'unusual' | 'concerning' = 'normal';
          
          // Define expected correlations
          const expectedCorrelations: Record<string, number> = {
            'ALT-AST': 0.7,        // Both liver enzymes
            'ALT-ALP': 0.5,        // Liver enzymes
            'AST-ALP': 0.5,        // Liver enzymes
            'Albumin-TotalProtein': 0.8,  // Related proteins
          };
          
          const key1 = `${metric1.name}-${metric2.name}`;
          const key2 = `${metric2.name}-${metric1.name}`;
          const expected = expectedCorrelations[key1] || expectedCorrelations[key2];
          
          if (expected) {
            const deviation = Math.abs(correlation - expected);
            if (deviation > 0.4) significance = 'concerning';
            else if (deviation > 0.2) significance = 'unusual';
          } else {
            // Unexpected high correlations
            if (Math.abs(correlation) > 0.8) significance = 'concerning';
            else if (Math.abs(correlation) > 0.6) significance = 'unusual';
          }
          
          correlations.push({
            metric1: metric1.name,
            metric2: metric2.name,
            correlation,
            significance
          });
        }
      }
    }

    return correlations;
  }

  private calculateCorrelation(metric1: HealthMetric, metric2: HealthMetric): number {
    const data1 = metric1.data.filter(d => d.value !== null).map(d => ({ date: d.date, value: d.value! }));
    const data2 = metric2.data.filter(d => d.value !== null).map(d => ({ date: d.date, value: d.value! }));
    
    // Find matching dates
    const matched: Array<{ val1: number; val2: number }> = [];
    data1.forEach(d1 => {
      const d2 = data2.find(d => d.date === d1.date);
      if (d2) {
        matched.push({ val1: d1.value, val2: d2.value });
      }
    });
    
    if (matched.length < 3) return NaN;
    
    const n = matched.length;
    const sum1 = matched.reduce((sum, d) => sum + d.val1, 0);
    const sum2 = matched.reduce((sum, d) => sum + d.val2, 0);
    const sum1Sq = matched.reduce((sum, d) => sum + d.val1 * d.val1, 0);
    const sum2Sq = matched.reduce((sum, d) => sum + d.val2 * d.val2, 0);
    const sum12 = matched.reduce((sum, d) => sum + d.val1 * d.val2, 0);
    
    const numerator = n * sum12 - sum1 * sum2;
    const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
}
