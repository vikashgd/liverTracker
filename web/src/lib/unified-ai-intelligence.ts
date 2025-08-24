/**
 * Unified AI Intelligence Engine
 * Merges HealthIntelligenceEngine and EnhancedAIIntelligence into a single, powerful system
 */

import { CanonicalMetric } from './metrics';
import { HealthIntelligenceEngine, HealthMetric, HealthScore, HealthAlert, HealthInsight, PatientProfile } from './ai-health-intelligence';
import { EnhancedAIIntelligence, AIInsight, PredictionModel, PersonalizedCareplan, PatternAnalysis, PatientData } from './enhanced-ai-intelligence';

// Enhanced data models for unified system
export interface EnhancedHealthScore extends HealthScore {
  predictedTrend: 'improving' | 'stable' | 'declining';
  confidenceInterval: { low: number; high: number };
  contributingFactors: string[];
}

export interface UnifiedInsight {
  id: string;
  title: string;
  description: string;
  explanation: string;
  type: 'pattern' | 'prediction' | 'alert' | 'recommendation' | 'milestone';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  importance: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  clinicalRelevance: number;
  actionable: boolean;
  recommendation?: string;
  relatedMetrics: CanonicalMetric[];
  sources: ('health_intelligence' | 'enhanced_ai')[];
  crossValidated: boolean;
  timeframe?: string;
  created: string;
}

export interface AdvancedPatternAnalysis extends PatternAnalysis {
  detectedBy: ('health_intelligence' | 'enhanced_ai' | 'cross_validation')[];
  recommendations: string[];
}

export interface DynamicCareplan extends PersonalizedCareplan {
  milestones: Array<{
    title: string;
    description: string;
    targetDate: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
}

export interface ValidationResult {
  insight: UnifiedInsight;
  validated: boolean;
  confidence: number;
  conflictingEvidence?: string[];
}

export class UnifiedAIEngine {
  private healthEngine: HealthIntelligenceEngine;
  private enhancedEngine: EnhancedAIIntelligence;
  private metrics: HealthMetric[];
  private patientProfile: PatientProfile;
  private patientData: PatientData;

  constructor(metrics: HealthMetric[], patientProfile: PatientProfile = {}, patientData: PatientData = {}) {
    this.metrics = metrics;
    this.patientProfile = patientProfile;
    this.patientData = patientData;
    
    // Initialize both engines
    this.healthEngine = new HealthIntelligenceEngine(metrics, patientProfile);
    this.enhancedEngine = new EnhancedAIIntelligence(metrics, patientData);
  }

  /**
   * Calculate enhanced health score with predictive indicators
   */
  calculateEnhancedHealthScore(): EnhancedHealthScore {
    // Get base health score from original engine
    const baseScore = this.healthEngine.calculateHealthScore();
    
    // Get predictions for trend analysis
    const predictions = this.enhancedEngine.generatePredictions();
    
    // Calculate predicted trend based on key metrics
    const keyMetricPredictions = predictions.filter(p => 
      ['ALT', 'AST', 'Bilirubin', 'Albumin'].includes(p.metric)
    );
    
    let predictedTrend: 'improving' | 'stable' | 'declining' = 'stable';
    let improvingCount = 0;
    let decliningCount = 0;
    
    keyMetricPredictions.forEach(pred => {
      if (pred.trend === 'improving') improvingCount++;
      else if (pred.trend === 'declining') decliningCount++;
    });
    
    if (improvingCount > decliningCount) predictedTrend = 'improving';
    else if (decliningCount > improvingCount) predictedTrend = 'declining';
    
    // Calculate confidence interval based on prediction confidence
    const avgConfidence = keyMetricPredictions.length > 0 
      ? keyMetricPredictions.reduce((sum, p) => sum + p.predictedValues[0]?.confidence || 0, 0) / keyMetricPredictions.length
      : 0.7;
    
    const confidenceRange = (1 - avgConfidence) * 20; // ±20 points max uncertainty
    
    // Identify contributing factors
    const contributingFactors: string[] = [];
    
    if (baseScore.liver < 70) contributingFactors.push('Liver function decline');
    if (baseScore.kidney < 70) contributingFactors.push('Kidney function concerns');
    if (baseScore.coagulation < 70) contributingFactors.push('Coagulation abnormalities');
    if (baseScore.nutrition < 70) contributingFactors.push('Nutritional deficiencies');
    
    return {
      ...baseScore,
      predictedTrend,
      confidenceInterval: {
        low: Math.max(0, baseScore.overall - confidenceRange),
        high: Math.min(100, baseScore.overall + confidenceRange)
      },
      contributingFactors
    };
  }

  /**
   * Generate unified insights from both AI engines with cross-validation
   */
  generateUnifiedInsights(): UnifiedInsight[] {
    // Get insights from both engines
    const healthInsights = this.healthEngine.generateInsights();
    const enhancedInsights = this.enhancedEngine.generateAdvancedInsights();
    
    const unifiedInsights: UnifiedInsight[] = [];
    
    // Convert health intelligence insights
    healthInsights.forEach(insight => {
      unifiedInsights.push({
        id: `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: insight.title,
        description: insight.summary,
        explanation: insight.details,
        type: this.mapInsightType(insight.category),
        severity: this.mapSeverityLevel(insight.importance),
        importance: insight.importance,
        confidence: insight.confidence,
        clinicalRelevance: this.calculateClinicalRelevance(insight),
        actionable: insight.actionable,
        recommendation: insight.recommendation,
        relatedMetrics: insight.metrics,
        sources: ['health_intelligence'],
        crossValidated: false,
        created: new Date().toISOString()
      });
    });
    
    // Convert enhanced AI insights
    enhancedInsights.forEach(insight => {
      unifiedInsights.push({
        id: insight.id,
        title: insight.title,
        description: insight.description,
        explanation: insight.explanation,
        type: insight.type,
        severity: insight.severity,
        importance: this.mapSeverityToImportance(insight.severity),
        confidence: insight.confidence,
        clinicalRelevance: this.calculateClinicalRelevanceFromSeverity(insight.severity),
        actionable: insight.actionable,
        recommendation: insight.recommendation,
        relatedMetrics: insight.relatedMetrics,
        sources: ['enhanced_ai'],
        crossValidated: false,
        timeframe: insight.timeframe,
        created: insight.created
      });
    });
    
    // Cross-validate insights
    const validatedInsights = this.crossValidateInsights(unifiedInsights);
    
    // Sort by importance and confidence
    return validatedInsights.sort((a, b) => {
      const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const importanceDiff = importanceOrder[b.importance] - importanceOrder[a.importance];
      if (importanceDiff !== 0) return importanceDiff;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Generate predictive analytics combining both engines
   */
  generatePredictiveAnalytics(): PredictionModel[] {
    const predictions = this.enhancedEngine.generatePredictions();
    
    // Enhance predictions with health intelligence trend analysis
    return predictions.map(prediction => {
      const metric = this.metrics.find(m => m.name === prediction.metric);
      if (!metric) return prediction;
      
      const trendAnalysis = this.healthEngine.analyzeTrend(metric);
      
      // Adjust confidence based on trend analysis confidence
      const enhancedPredictions = prediction.predictedValues.map(pred => ({
        ...pred,
        confidence: Math.min(pred.confidence, pred.confidence * (trendAnalysis.confidence + 0.5))
      }));
      
      // Add trend-based risk factors
      const trendRiskFactors = trendAnalysis.significance !== 'none' 
        ? [`${trendAnalysis.significance} ${trendAnalysis.direction} trend detected`]
        : [];
      
      return {
        ...prediction,
        predictedValues: enhancedPredictions,
        riskFactors: [...prediction.riskFactors, ...trendRiskFactors]
      };
    });
  }

  /**
   * Detect advanced patterns using both engines
   */
  detectAdvancedPatterns(): AdvancedPatternAnalysis[] {
    const enhancedPatterns = this.enhancedEngine.detectPatterns();
    const correlations = this.analyzeHealthIntelligenceCorrelations();
    
    const advancedPatterns: AdvancedPatternAnalysis[] = [];
    
    // Convert enhanced patterns
    enhancedPatterns.forEach(pattern => {
      advancedPatterns.push({
        ...pattern,
        detectedBy: ['enhanced_ai'],
        recommendations: this.generatePatternRecommendations(pattern)
      });
    });
    
    // Add correlation patterns from health intelligence
    correlations.forEach(corr => {
      if (Math.abs(corr.correlation) > 0.7) {
        advancedPatterns.push({
          type: 'correlation',
          metrics: [corr.metric1, corr.metric2],
          strength: Math.abs(corr.correlation),
          description: `${corr.correlation > 0 ? 'Positive' : 'Negative'} correlation between ${corr.metric1} and ${corr.metric2}`,
          significance: corr.significance === 'concerning' ? 'high' : 'medium',
          clinical_relevance: this.getCorrelationClinicalRelevance(corr.metric1, corr.metric2, corr.correlation),
          detectedBy: ['health_intelligence'],
          recommendations: this.getCorrelationRecommendations(corr.metric1, corr.metric2)
        });
      }
    });
    
    return advancedPatterns;
  }

  /**
   * Create dynamic care plan combining both engines
   */
  createDynamicCareplan(): DynamicCareplan {
    const baseCareplan = this.enhancedEngine.generateCareplan();
    const healthScore = this.calculateEnhancedHealthScore();
    
    // Generate milestones based on current status and predictions
    const milestones = this.generateMilestones(healthScore, baseCareplan);
    
    // Enhance recommendations with health intelligence insights
    const enhancedRecommendations = this.enhanceRecommendations(baseCareplan.recommendations);
    
    return {
      ...baseCareplan,
      recommendations: enhancedRecommendations,
      milestones
    };
  }

  /**
   * Cross-validate insights between engines
   */
  crossValidateInsights(insights: UnifiedInsight[]): UnifiedInsight[] {
    const validatedInsights: UnifiedInsight[] = [];
    
    insights.forEach(insight => {
      const validation = this.validateInsight(insight, insights);
      
      // Mark as cross-validated if supported by multiple sources
      const crossValidated = validation.validated && validation.confidence > 0.7;
      
      validatedInsights.push({
        ...insight,
        crossValidated,
        confidence: crossValidated ? Math.min(1, insight.confidence * 1.2) : insight.confidence
      });
    });
    
    return validatedInsights;
  }

  // Helper methods
  private mapInsightType(category: string): UnifiedInsight['type'] {
    const mapping: Record<string, UnifiedInsight['type']> = {
      'trend': 'pattern',
      'correlation': 'pattern',
      'risk': 'alert',
      'improvement': 'milestone',
      'stability': 'recommendation'
    };
    return mapping[category] || 'recommendation';
  }

  private mapSeverityLevel(importance: string): UnifiedInsight['severity'] {
    const mapping: Record<string, UnifiedInsight['severity']> = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };
    return mapping[importance] || 'info';
  }

  private mapSeverityToImportance(severity: string): UnifiedInsight['importance'] {
    const mapping: Record<string, UnifiedInsight['importance']> = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low',
      'info': 'low'
    };
    return mapping[severity] || 'low';
  }

  private calculateClinicalRelevance(insight: HealthInsight): number {
    // Base relevance on importance and actionability
    let relevance = 0.5;
    
    if (insight.importance === 'critical') relevance = 0.95;
    else if (insight.importance === 'high') relevance = 0.8;
    else if (insight.importance === 'medium') relevance = 0.6;
    
    if (insight.actionable) relevance += 0.1;
    
    return Math.min(1, relevance);
  }

  private calculateClinicalRelevanceFromSeverity(severity: string): number {
    const mapping: Record<string, number> = {
      'critical': 0.95,
      'high': 0.8,
      'medium': 0.6,
      'low': 0.4,
      'info': 0.3
    };
    return mapping[severity] || 0.3;
  }

  private validateInsight(insight: UnifiedInsight, allInsights: UnifiedInsight[]): ValidationResult {
    // Look for supporting or conflicting insights
    const relatedInsights = allInsights.filter(other => 
      other.id !== insight.id && 
      other.relatedMetrics.some(metric => insight.relatedMetrics.includes(metric))
    );
    
    let supportingEvidence = 0;
    let conflictingEvidence: string[] = [];
    
    relatedInsights.forEach(related => {
      if (related.type === insight.type && related.severity === insight.severity) {
        supportingEvidence++;
      } else if (related.type === insight.type && related.severity !== insight.severity) {
        conflictingEvidence.push(`Conflicting severity: ${related.title}`);
      }
    });
    
    const validated = supportingEvidence > 0 || conflictingEvidence.length === 0;
    const confidence = supportingEvidence > 0 ? 0.8 + (supportingEvidence * 0.1) : 0.6;
    
    return {
      insight,
      validated,
      confidence: Math.min(1, confidence),
      conflictingEvidence: conflictingEvidence.length > 0 ? conflictingEvidence : undefined
    };
  }

  private analyzeHealthIntelligenceCorrelations(): Array<{
    metric1: CanonicalMetric;
    metric2: CanonicalMetric;
    correlation: number;
    significance: 'normal' | 'unusual' | 'concerning';
  }> {
    // Use reflection to access private method (for integration purposes)
    return (this.healthEngine as any).analyzeCorrelations();
  }

  private generatePatternRecommendations(pattern: PatternAnalysis): string[] {
    const recommendations: string[] = [];
    
    switch (pattern.type) {
      case 'correlation':
        recommendations.push('Monitor correlated metrics together for changes');
        recommendations.push('Consider underlying factors affecting both metrics');
        break;
      case 'threshold':
        recommendations.push('Review treatment plan for threshold changes');
        recommendations.push('Consider dose adjustments if appropriate');
        break;
      case 'acceleration':
        recommendations.push('Urgent medical evaluation recommended');
        recommendations.push('Consider intervention to slow progression');
        break;
      default:
        recommendations.push('Continue monitoring pattern development');
    }
    
    return recommendations;
  }

  private getCorrelationClinicalRelevance(metric1: CanonicalMetric, metric2: CanonicalMetric, correlation: number): string {
    const pairs: Record<string, string> = {
      'ALT-AST': 'Both enzymes indicate hepatocellular injury pattern',
      'Bilirubin-Platelets': 'May indicate portal hypertension development',
      'Creatinine-Bilirubin': 'Hepatorenal syndrome consideration',
      'Albumin-TotalProtein': 'Reflects liver synthetic function'
    };
    
    const key1 = `${metric1}-${metric2}`;
    const key2 = `${metric2}-${metric1}`;
    
    return pairs[key1] || pairs[key2] || 'Correlation may indicate shared pathophysiology';
  }

  private getCorrelationRecommendations(metric1: CanonicalMetric, metric2: CanonicalMetric): string[] {
    if ((metric1 === 'ALT' && metric2 === 'AST') || (metric1 === 'AST' && metric2 === 'ALT')) {
      return ['Monitor liver function closely', 'Consider hepatotoxic medication review'];
    }
    
    if ((metric1 === 'Bilirubin' && metric2 === 'Platelets') || (metric1 === 'Platelets' && metric2 === 'Bilirubin')) {
      return ['Evaluate for portal hypertension', 'Consider imaging studies'];
    }
    
    return ['Monitor both metrics together', 'Discuss correlation with healthcare provider'];
  }

  private generateMilestones(healthScore: EnhancedHealthScore, careplan: PersonalizedCareplan): Array<{
    title: string;
    description: string;
    targetDate: string;
    status: 'pending' | 'in_progress' | 'completed';
  }> {
    const milestones = [];
    const now = new Date();
    
    // Health score improvement milestone
    if (healthScore.overall < 80) {
      const targetDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 3 months
      milestones.push({
        title: 'Health Score Improvement',
        description: `Achieve health score of ${Math.min(100, healthScore.overall + 20)}`,
        targetDate: targetDate.toISOString().split('T')[0],
        status: 'pending' as const
      });
    }
    
    // Liver function milestone
    if (healthScore.liver < 70) {
      const targetDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 6 months
      milestones.push({
        title: 'Liver Function Stabilization',
        description: 'Achieve stable liver enzyme levels within normal range',
        targetDate: targetDate.toISOString().split('T')[0],
        status: 'pending' as const
      });
    }
    
    // MELD score milestone
    if (careplan.meldScore && careplan.meldScore > 15) {
      const targetDate = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000); // 4 months
      milestones.push({
        title: 'MELD Score Reduction',
        description: `Reduce MELD score to below 15 (current: ${careplan.meldScore})`,
        targetDate: targetDate.toISOString().split('T')[0],
        status: 'pending' as const
      });
    }
    
    return milestones;
  }

  private enhanceRecommendations(recommendations: PersonalizedCareplan['recommendations']): PersonalizedCareplan['recommendations'] {
    // Add health intelligence-based recommendations
    const healthScore = this.healthEngine.calculateHealthScore();
    const enhancedRecommendations = [...recommendations];
    
    // Add specific recommendations based on health score
    if (healthScore.liver < 60) {
      enhancedRecommendations.push({
        category: 'lifestyle',
        priority: 'high',
        title: 'Liver Protection Protocol',
        description: 'Implement comprehensive liver protection measures including diet, supplements, and lifestyle modifications',
        frequency: 'Daily'
      });
    }
    
    if (healthScore.kidney < 60) {
      enhancedRecommendations.push({
        category: 'monitoring',
        priority: 'high',
        title: 'Enhanced Kidney Monitoring',
        description: 'Increase frequency of creatinine and kidney function monitoring',
        frequency: 'Monthly'
      });
    }
    
    return enhancedRecommendations;
  }
}