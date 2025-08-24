/**
 * Enhanced AI Intelligence Engine
 * Advanced pattern recognition, predictive analytics, and personalized recommendations
 */

import { CanonicalMetric } from './metrics';
import { calculateMELD, MELDParameters } from './meld-calculator';

export interface PatientData {
  age?: number;
  gender?: 'male' | 'female';
  diagnosisDate?: string;
  primaryCondition?: string;
  comorbidities?: string[];
}

export interface HealthMetric {
  name: CanonicalMetric;
  data: Array<{ date: string; value: number | null; reportCount?: number }>;
  unit: string;
  range: { low: number; high: number };
}

export interface AIInsight {
  id: string;
  type: 'pattern' | 'prediction' | 'alert' | 'recommendation' | 'milestone';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  explanation: string;
  confidence: number; // 0-1
  actionable: boolean;
  recommendation?: string;
  timeframe?: string;
  relatedMetrics: CanonicalMetric[];
  created: string;
}

export interface PredictionModel {
  metric: CanonicalMetric;
  currentValue: number;
  trend: 'improving' | 'stable' | 'declining';
  predictedValues: Array<{
    timeframe: '1month' | '3months' | '6months' | '1year';
    value: number;
    confidence: number;
    scenario: 'best' | 'likely' | 'worst';
  }>;
  riskFactors: string[];
  recommendations: string[];
}

export interface PersonalizedCareplan {
  id: string;
  patientProfile: PatientData;
  currentStatus: 'stable' | 'improving' | 'declining' | 'critical';
  meldScore?: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: Array<{
    category: 'lifestyle' | 'diet' | 'medication' | 'monitoring' | 'specialist';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    frequency?: string;
  }>;
  nextActions: string[];
  targetMetrics: Array<{
    metric: CanonicalMetric;
    targetValue: number;
    targetTimeframe: string;
  }>;
}

export interface PatternAnalysis {
  type: 'correlation' | 'cycle' | 'threshold' | 'acceleration' | 'plateau';
  metrics: CanonicalMetric[];
  strength: number; // 0-1
  description: string;
  significance: 'high' | 'medium' | 'low';
  clinical_relevance: string;
}

export class EnhancedAIIntelligence {
  private metrics: HealthMetric[];
  private patientData: PatientData;
  
  constructor(metrics: HealthMetric[], patientData: PatientData = {}) {
    this.metrics = metrics;
    this.patientData = patientData;
  }

  /**
   * Detect patterns across multiple metrics
   */
  detectPatterns(): PatternAnalysis[] {
    const patterns: PatternAnalysis[] = [];

    // Liver enzyme correlation pattern
    const altData = this.getMetricData('ALT');
    const astData = this.getMetricData('AST');
    
    if (altData.length > 0 && astData.length > 0) {
      const correlation = this.calculateCorrelation(altData, astData);
      if (Math.abs(correlation) > 0.7) {
        patterns.push({
          type: 'correlation',
          metrics: ['ALT', 'AST'],
          strength: Math.abs(correlation),
          description: `Strong ${correlation > 0 ? 'positive' : 'negative'} correlation between ALT and AST`,
          significance: Math.abs(correlation) > 0.9 ? 'high' : 'medium',
          clinical_relevance: 'Both ALT and AST moving together suggests hepatocellular pattern of liver injury'
        });
      }
    }

    // MELD component synchronization
    const bilirubinData = this.getMetricData('Bilirubin');
    const creatinineData = this.getMetricData('Creatinine');
    const inrData = this.getMetricData('INR');
    
    if (bilirubinData.length > 2 && creatinineData.length > 2 && inrData.length > 2) {
      const meldTrend = this.analyzeMELDTrend();
      if (meldTrend.significance !== 'low') {
        patterns.push({
          type: 'threshold',
          metrics: ['Bilirubin', 'Creatinine', 'INR'],
          strength: 0.8,
          description: `MELD score components showing ${meldTrend.direction} pattern`,
          significance: meldTrend.significance,
          clinical_relevance: 'MELD component changes indicate liver function progression'
        });
      }
    }

    // Platelet-Bilirubin inverse correlation (portal hypertension)
    const plateletData = this.getMetricData('Platelets');
    if (plateletData.length > 0 && bilirubinData.length > 0) {
      const correlation = this.calculateCorrelation(plateletData, bilirubinData);
      if (correlation < -0.6) {
        patterns.push({
          type: 'correlation',
          metrics: ['Platelets', 'Bilirubin'],
          strength: Math.abs(correlation),
          description: 'Inverse relationship between platelets and bilirubin detected',
          significance: 'high',
          clinical_relevance: 'May indicate portal hypertension development'
        });
      }
    }

    return patterns;
  }

  /**
   * Generate predictive models for key metrics
   */
  generatePredictions(): PredictionModel[] {
    const predictions: PredictionModel[] = [];
    
    const keyMetrics: CanonicalMetric[] = ['ALT', 'AST', 'Bilirubin', 'Platelets', 'Creatinine', 'INR'];
    
    keyMetrics.forEach(metric => {
      const data = this.getMetricData(metric);
      if (data.length >= 3) {
        const prediction = this.createPredictionModel(metric, data);
        if (prediction) {
          predictions.push(prediction);
        }
      }
    });

    return predictions;
  }

  /**
   * Generate advanced AI insights
   */
  generateAdvancedInsights(): AIInsight[] {
    const insights: AIInsight[] = [];
    const patterns = this.detectPatterns();
    const predictions = this.generatePredictions();

    // Pattern-based insights
    patterns.forEach(pattern => {
      if (pattern.significance === 'high') {
        insights.push({
          id: `pattern_${pattern.type}_${Date.now()}`,
          type: 'pattern',
          severity: pattern.type === 'threshold' ? 'medium' : 'info',
          title: `${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} Pattern Detected`,
          description: pattern.description,
          explanation: pattern.clinical_relevance,
          confidence: pattern.strength,
          actionable: true,
          recommendation: this.getPatternRecommendation(pattern),
          relatedMetrics: pattern.metrics,
          created: new Date().toISOString()
        });
      }
    });

    // Prediction-based insights
    predictions.forEach(prediction => {
      const likelyValue = prediction.predictedValues.find(p => p.scenario === 'likely');
      if (likelyValue && likelyValue.confidence > 0.7) {
        const isWorseningPredicted = this.isPredictionConcerning(prediction.metric, likelyValue.value);
        
        insights.push({
          id: `prediction_${prediction.metric}_${Date.now()}`,
          type: 'prediction',
          severity: isWorseningPredicted ? 'medium' : 'info',
          title: `${prediction.metric} Forecast`,
          description: `Based on current trends, ${prediction.metric} is predicted to ${prediction.trend}`,
          explanation: `Predictive model suggests ${prediction.metric} will be approximately ${likelyValue.value.toFixed(1)} in 3 months`,
          confidence: likelyValue.confidence,
          actionable: true,
          timeframe: '3months',
          recommendation: prediction.recommendations[0],
          relatedMetrics: [prediction.metric],
          created: new Date().toISOString()
        });
      }
    });

    // MELD-specific insights
    const meldInsights = this.generateMELDInsights();
    insights.push(...meldInsights);

    // Milestone detection
    const milestones = this.detectMilestones();
    insights.push(...milestones);

    return insights.sort((a, b) => {
      const severityOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Create personalized care plan
   */
  generateCareplan(): PersonalizedCareplan {
    const meldScore = this.calculateCurrentMELD();
    const currentStatus = this.assessCurrentStatus();
    const riskLevel = this.assessRiskLevel(meldScore);

    return {
      id: `careplan_${Date.now()}`,
      patientProfile: this.patientData,
      currentStatus,
      meldScore,
      riskLevel,
      recommendations: this.generateRecommendations(currentStatus, meldScore),
      nextActions: this.generateNextActions(currentStatus, riskLevel),
      targetMetrics: this.generateTargetMetrics()
    };
  }

  // Helper methods
  private getMetricData(metric: CanonicalMetric): number[] {
    const metricObj = this.metrics.find(m => m.name === metric);
    return metricObj ? metricObj.data.filter(d => d.value !== null).map(d => d.value!) : [];
  }

  private calculateCorrelation(data1: number[], data2: number[]): number {
    const minLength = Math.min(data1.length, data2.length);
    if (minLength < 2) return 0;

    const x = data1.slice(-minLength);
    const y = data2.slice(-minLength);

    const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
    const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;

    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;

    for (let i = 0; i < x.length; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = y[i] - meanY;
      numerator += deltaX * deltaY;
      sumXSquared += deltaX * deltaX;
      sumYSquared += deltaY * deltaY;
    }

    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private analyzeMELDTrend(): { direction: string; significance: 'high' | 'medium' | 'low' } {
    const bilirubinData = this.getMetricData('Bilirubin');
    const creatinineData = this.getMetricData('Creatinine');
    const inrData = this.getMetricData('INR');

    if (bilirubinData.length < 3) return { direction: 'stable', significance: 'low' };

    const recentBilirubin = bilirubinData.slice(-3);
    const recentCreatinine = creatinineData.slice(-3);
    const recentINR = inrData.slice(-3);

    const bilirubinTrend = recentBilirubin[2] - recentBilirubin[0];
    const creatinineTrend = recentCreatinine.length >= 3 ? recentCreatinine[2] - recentCreatinine[0] : 0;
    const inrTrend = recentINR.length >= 3 ? recentINR[2] - recentINR[0] : 0;

    const overallTrend = bilirubinTrend + creatinineTrend + inrTrend;

    return {
      direction: overallTrend > 0.5 ? 'worsening' : overallTrend < -0.5 ? 'improving' : 'stable',
      significance: Math.abs(overallTrend) > 1.0 ? 'high' : Math.abs(overallTrend) > 0.3 ? 'medium' : 'low'
    };
  }

  private createPredictionModel(metric: CanonicalMetric, data: number[]): PredictionModel | null {
    if (data.length < 3) return null;

    const trend = this.calculateTrendDirection(data);
    const currentValue = data[data.length - 1];
    
    // Simple linear regression for trend continuation
    const predictions = this.generatePredictionScenarios(data, trend);

    return {
      metric,
      currentValue,
      trend,
      predictedValues: predictions,
      riskFactors: this.getRiskFactors(metric, trend),
      recommendations: this.getMetricRecommendations(metric, trend)
    };
  }

  private calculateTrendDirection(data: number[]): 'improving' | 'stable' | 'declining' {
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(-3);
    const older = data.slice(0, Math.max(1, data.length - 3));
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change < 0 ? 'improving' : 'declining'; // For liver markers, lower is usually better
  }

  private generatePredictionScenarios(data: number[], trend: string): Array<{
    timeframe: '1month' | '3months' | '6months' | '1year';
    value: number;
    confidence: number;
    scenario: 'best' | 'likely' | 'worst';
  }> {
    const currentValue = data[data.length - 1];
    const changeRate = this.calculateChangeRate(data);
    
    const timeframes: Array<{ period: '1month' | '3months' | '6months' | '1year', months: number }> = [
      { period: '1month', months: 1 },
      { period: '3months', months: 3 },
      { period: '6months', months: 6 },
      { period: '1year', months: 12 }
    ];

    return timeframes.flatMap(({ period, months }) => {
      // Apply progressive dampening - longer predictions are more conservative
      const dampening = Math.pow(0.8, months / 3); // Reduces change rate over time
      const baseChange = changeRate * months * dampening;
      
      // Define clinical bounds to prevent unrealistic values
      const clinicalBounds = this.getClinicalBounds(currentValue);
      
      return [
        {
          timeframe: period,
          // Best case: minimal change or slight improvement
          value: this.applyBounds(currentValue + baseChange * 0.2, clinicalBounds),
          confidence: Math.max(0.5, 0.85 - months * 0.08),
          scenario: 'best' as const
        },
        {
          timeframe: period,
          // Likely case: conservative trend continuation
          value: this.applyBounds(currentValue + baseChange * 0.6, clinicalBounds),
          confidence: Math.max(0.6, 0.8 - months * 0.05),
          scenario: 'likely' as const
        },
        {
          timeframe: period,
          // Worst case: more conservative than before (was 1.5x, now 1.0x)
          value: this.applyBounds(currentValue + baseChange * 1.0, clinicalBounds),
          confidence: Math.max(0.4, 0.65 - months * 0.08),
          scenario: 'worst' as const
        }
      ];
    });
  }

  private getClinicalBounds(currentValue: number): { min: number; max: number } {
    // Define realistic bounds based on current value
    // Prevent predictions from going beyond physiologically reasonable ranges
    const lowerBound = Math.max(0, currentValue * 0.3); // Don't drop below 30% of current
    const upperBound = currentValue * 2.5; // Don't exceed 250% of current
    
    return { min: lowerBound, max: upperBound };
  }

  private applyBounds(value: number, bounds: { min: number; max: number }): number {
    return Math.max(bounds.min, Math.min(bounds.max, value));
  }

  private calculateChangeRate(data: number[]): number {
    if (data.length < 2) return 0;
    
    const recent = data.slice(-3);
    if (recent.length < 2) return 0;
    
    // Calculate monthly change rate but apply dampening for medical realism
    const rawChangeRate = (recent[recent.length - 1] - recent[0]) / recent.length;
    
    // Apply conservative dampening factor - medical values don't change linearly
    // Reduce change rate by 70% to be more realistic
    const dampenedRate = rawChangeRate * 0.3;
    
    // Cap maximum monthly change to prevent unrealistic projections
    const maxMonthlyChange = Math.abs(recent[recent.length - 1]) * 0.05; // Max 5% change per month
    
    return Math.sign(dampenedRate) * Math.min(Math.abs(dampenedRate), maxMonthlyChange);
  }

  private isPredictionConcerning(metric: CanonicalMetric, predictedValue: number): boolean {
    const concerningThresholds: Record<CanonicalMetric, number> = {
      'ALT': 60,
      'AST': 50,
      'Bilirubin': 3.0,
      'Creatinine': 1.5,
      'INR': 1.5,
      'Platelets': 100,
      'Albumin': 3.0,
      'ALP': 150,
      'GGT': 60,
      'TotalProtein': 5.5,
      'Sodium': 125,
      'Potassium': 3.0
    };

    const threshold = concerningThresholds[metric];
    
    // Different logic for different metrics
    if (['ALT', 'AST', 'Bilirubin', 'Creatinine', 'INR', 'ALP', 'GGT'].includes(metric)) {
      return predictedValue > threshold; // Higher is worse
    } else if (['Platelets', 'Albumin', 'TotalProtein', 'Sodium', 'Potassium'].includes(metric)) {
      return predictedValue < threshold; // Lower is worse
    }
    
    return false;
  }

  private calculateCurrentMELD(): number | undefined {
    const bilirubinData = this.getMetricData('Bilirubin');
    const creatinineData = this.getMetricData('Creatinine');
    const inrData = this.getMetricData('INR');

    if (bilirubinData.length === 0 || creatinineData.length === 0 || inrData.length === 0) {
      return undefined;
    }

    const params: MELDParameters = {
      bilirubin: bilirubinData[bilirubinData.length - 1],
      creatinine: creatinineData[creatinineData.length - 1],
      inr: inrData[inrData.length - 1]
    };

    const result = calculateMELD(params);
    return result.meld3 ?? result.meldNa ?? result.meld;
  }

  private assessCurrentStatus(): 'stable' | 'improving' | 'declining' | 'critical' {
    const meldScore = this.calculateCurrentMELD();
    
    if (meldScore && meldScore >= 25) return 'critical';
    if (meldScore && meldScore >= 15) return 'declining';
    
    const keyMetrics = ['ALT', 'AST', 'Bilirubin'];
    const trends = keyMetrics.map(metric => this.calculateTrendDirection(this.getMetricData(metric as CanonicalMetric)));
    
    const improvingCount = trends.filter(t => t === 'improving').length;
    const decliningCount = trends.filter(t => t === 'declining').length;
    
    if (improvingCount > decliningCount) return 'improving';
    if (decliningCount > improvingCount) return 'declining';
    return 'stable';
  }

  private assessRiskLevel(meldScore?: number): 'low' | 'moderate' | 'high' | 'critical' {
    if (meldScore && meldScore >= 25) return 'critical';
    if (meldScore && meldScore >= 15) return 'high';
    if (meldScore && meldScore >= 10) return 'moderate';
    return 'low';
  }

  private generateMELDInsights(): AIInsight[] {
    const insights: AIInsight[] = [];
    const meldScore = this.calculateCurrentMELD();
    
    if (meldScore) {
      let severity: 'info' | 'low' | 'medium' | 'high' | 'critical' = 'info';
      let description = '';
      let recommendation = '';

      if (meldScore >= 25) {
        severity = 'critical';
        description = 'MELD score indicates severe liver dysfunction';
        recommendation = 'Urgent hepatology consultation and transplant evaluation recommended';
      } else if (meldScore >= 15) {
        severity = 'high';
        description = 'MELD score indicates significant liver dysfunction';
        recommendation = 'Consider hepatology consultation and transplant evaluation';
      } else if (meldScore >= 10) {
        severity = 'medium';
        description = 'MELD score indicates moderate liver dysfunction';
        recommendation = 'Regular hepatology follow-up recommended';
      } else {
        severity = 'info';
        description = 'MELD score indicates stable liver function';
        recommendation = 'Continue current management and monitoring';
      }

      insights.push({
        id: `meld_assessment_${Date.now()}`,
        type: 'alert',
        severity,
        title: `MELD Score Assessment: ${meldScore}`,
        description,
        explanation: `MELD score of ${meldScore} places you in the ${severity} risk category for liver-related complications`,
        confidence: 0.95,
        actionable: true,
        recommendation,
        relatedMetrics: ['Bilirubin', 'Creatinine', 'INR'],
        created: new Date().toISOString()
      });
    }

    return insights;
  }

  private detectMilestones(): AIInsight[] {
    const insights: AIInsight[] = [];
    
    // Check for improvement milestones
    const altData = this.getMetricData('ALT');
    const astData = this.getMetricData('AST');
    
    if (altData.length > 0 && astData.length > 0) {
      const latestALT = altData[altData.length - 1];
      const latestAST = astData[astData.length - 1];
      
      if (latestALT < 40 && latestAST < 40) {
        insights.push({
          id: `milestone_normal_enzymes_${Date.now()}`,
          type: 'milestone',
          severity: 'info',
          title: '🎉 Liver Enzymes Normalized',
          description: 'Both ALT and AST are now within normal ranges',
          explanation: 'This is an excellent milestone indicating reduced liver inflammation',
          confidence: 0.9,
          actionable: false,
          relatedMetrics: ['ALT', 'AST'],
          created: new Date().toISOString()
        });
      }
    }

    return insights;
  }

  private getPatternRecommendation(pattern: PatternAnalysis): string {
    switch (pattern.type) {
      case 'correlation':
        if (pattern.metrics.includes('ALT') && pattern.metrics.includes('AST')) {
          return 'Continue monitoring liver enzymes closely and maintain current treatment';
        }
        return 'Monitor correlated metrics for continued patterns';
      case 'threshold':
        return 'Consider treatment adjustment based on threshold changes';
      default:
        return 'Continue current monitoring protocol';
    }
  }

  private getRiskFactors(metric: CanonicalMetric, trend: string): string[] {
    const riskFactors: Record<string, string[]> = {
      'ALT_declining': ['Medication non-adherence', 'Dietary changes', 'Alcohol use'],
      'AST_declining': ['Medication effects', 'Progression of liver disease', 'Alcohol use'],
      'Bilirubin_declining': ['Bile duct obstruction', 'Hemolysis', 'Liver dysfunction progression'],
      'Platelets_declining': ['Portal hypertension', 'Hypersplenism', 'Bone marrow dysfunction']
    };

    return riskFactors[`${metric}_${trend}`] || ['Monitor for changes in clinical status'];
  }

  private getMetricRecommendations(metric: CanonicalMetric, trend: string): string[] {
    const recommendations: Record<string, string[]> = {
      'ALT_declining': ['Hepatotoxic medication review', 'Alcohol cessation', 'Diet optimization'],
      'AST_declining': ['Hepatology consultation', 'Imaging studies', 'Medication review'],
      'Bilirubin_declining': ['Imaging studies for obstruction', 'Hemolysis workup', 'Hepatology referral']
    };

    return recommendations[`${metric}_${trend}`] || ['Continue regular monitoring'];
  }

  private generateRecommendations(currentStatus: string, meldScore?: number): Array<{
    category: 'lifestyle' | 'diet' | 'medication' | 'monitoring' | 'specialist';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    frequency?: string;
  }> {
    const recommendations = [];

    // High priority recommendations based on MELD score
    if (meldScore && meldScore >= 15) {
      recommendations.push({
        category: 'specialist' as const,
        priority: 'high' as const,
        title: 'Connect with Your Liver Specialist',
        description: 'Your numbers suggest it would be really beneficial to have a conversation with a hepatologist. They\'re experts who can provide specialized guidance tailored to your unique situation. This isn\'t about being alarmed—it\'s about getting you the best possible support.',
        frequency: 'Within 2 weeks'
      });
    }

    // Standard monitoring recommendations
    recommendations.push({
      category: 'monitoring' as const,
      priority: 'high' as const,
      title: 'Stay Connected with Your Health',
      description: 'Regular lab work helps us understand how your body is responding and gives us valuable insights to guide your care. Think of these tests as check-ins with your health—they help us celebrate progress and adjust our approach when needed.',
      frequency: 'Every 3 months'
    });

    // Lifestyle recommendations
    recommendations.push({
      category: 'lifestyle' as const,
      priority: 'medium' as const,
      title: 'Protect Your Liver with Love',
      description: 'Avoiding alcohol is one of the most powerful gifts you can give your liver. We know this can be challenging, and you don\'t have to do it alone. Your healthcare team is here to support you with resources, understanding, and encouragement every step of the way.',
      frequency: 'Daily commitment'
    });

    recommendations.push({
      category: 'diet' as const,
      priority: 'medium' as const,
      title: 'Nourish Your Body Mindfully',
      description: 'Eating in a way that supports your liver doesn\'t mean giving up everything you enjoy. Focus on gentle, nourishing choices: fresh foods when possible, mindful portions, and being kind to yourself when you\'re not perfect. Small, consistent changes make the biggest difference.',
      frequency: 'Daily practice'
    });

    // Add empowering lifestyle recommendation
    recommendations.push({
      category: 'lifestyle' as const,
      priority: 'medium' as const,
      title: 'Move Your Body with Compassion',
      description: 'Gentle movement—whether it\'s a short walk, stretching, or any activity that brings you joy—can boost your energy and mood. Listen to your body and do what feels good. Some days that might be more, some days less, and both are perfectly okay.',
      frequency: 'As you feel able'
    });

    // Add emotional support recommendation
    recommendations.push({
      category: 'lifestyle' as const,
      priority: 'low' as const,
      title: 'Honor Your Emotional Wellbeing',
      description: 'Managing a health condition can feel overwhelming sometimes, and that\'s completely normal. Consider connecting with a counselor, support group, or trusted friends and family. Taking care of your mental health is just as important as taking care of your physical health.',
      frequency: 'As needed'
    });

    return recommendations;
  }

  private generateNextActions(currentStatus: string, riskLevel: string): string[] {
    const actions = [];

    if (riskLevel === 'critical' || riskLevel === 'high') {
      actions.push('💙 Reach out to your hepatologist—they\'re your partner in this journey and want to help');
      actions.push('🌟 Consider exploring advanced care options with your medical team when you\'re ready');
    }

    actions.push('📊 Share your next lab results when they\'re available—every data point helps us support you better');
    actions.push('💭 Keep a gentle awareness of how you\'re feeling day-to-day, both physically and emotionally');
    actions.push('🍎 Take a moment to review the nutrition suggestions and see what feels manageable for you right now');
    actions.push('🤝 Remember that your healthcare team is here to support you—don\'t hesitate to reach out with questions or concerns');
    actions.push('🎯 Celebrate the small wins along the way—every positive choice you make matters');

    return actions;
  }

  private generateTargetMetrics(): Array<{
    metric: CanonicalMetric;
    targetValue: number;
    targetTimeframe: string;
  }> {
    return [
      { metric: 'ALT', targetValue: 35, targetTimeframe: '6 months' },
      { metric: 'AST', targetValue: 35, targetTimeframe: '6 months' },
      { metric: 'Bilirubin', targetValue: 1.5, targetTimeframe: '3 months' },
      { metric: 'Albumin', targetValue: 3.5, targetTimeframe: '6 months' }
    ];
  }
}
