"use client";

import { useState, useEffect, useMemo } from 'react';
import { CanonicalMetric } from '@/lib/metrics';
import { PatientProfile } from '@/lib/ai-health-intelligence';
import { PatientData } from '@/lib/enhanced-ai-intelligence';
import { 
  UnifiedAIEngine, 
  EnhancedHealthScore, 
  UnifiedInsight, 
  AdvancedPatternAnalysis, 
  DynamicCareplan 
} from '@/lib/unified-ai-intelligence';
import { PredictionModel } from '@/lib/enhanced-ai-intelligence';
import { Brain, Lightbulb, TrendingUp, Activity, Heart, AlertTriangle, Target } from 'lucide-react';
import { HealthOverviewTab } from './health-overview-tab';
import { SmartInsightsAlertsTab } from './smart-insights-alerts-tab';
import { PredictiveAnalyticsTab } from './predictive-analytics-tab';
import { PatternIntelligenceTab } from './pattern-intelligence-tab';
import { PersonalizedCarePlanTab } from './personalized-care-plan-tab';

interface UnifiedAIIntelligenceDashboardProps {
  charts: Array<{
    title: CanonicalMetric;
    color: string;
    data: Array<{ date: string; value: number | null; reportCount?: number }>;
    range: { low: number; high: number };
    unit: string;
  }>;
  patientProfile?: PatientProfile;
  patientData?: PatientData;
}

type TabType = 'overview' | 'insights' | 'predictions' | 'patterns' | 'careplan';

export function UnifiedAIIntelligenceDashboard({ 
  charts, 
  patientProfile, 
  patientData 
}: UnifiedAIIntelligenceDashboardProps) {
  // Memoize patient data to prevent unnecessary re-renders
  const stablePatientProfile = useMemo(() => patientProfile || {}, [patientProfile]);
  const stablePatientData = useMemo(() => patientData || {}, [patientData]);

  // State management
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // AI Engine results
  const [aiEngine, setAIEngine] = useState<UnifiedAIEngine | null>(null);
  const [healthScore, setHealthScore] = useState<EnhancedHealthScore | null>(null);
  const [unifiedInsights, setUnifiedInsights] = useState<UnifiedInsight[]>([]);
  const [predictions, setPredictions] = useState<PredictionModel[]>([]);
  const [patterns, setPatterns] = useState<AdvancedPatternAnalysis[]>([]);
  const [careplan, setCareplan] = useState<DynamicCareplan | null>(null);

  // Initialize client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize AI Engine and generate all analyses
  useEffect(() => {
    if (!isClient || !charts.length) return;

    const initializeUnifiedAI = async () => {
      setIsLoading(true);
      
      try {
        // Convert charts to HealthMetric format
        const healthMetrics = charts.map(chart => ({
          name: chart.title,
          data: chart.data,
          unit: chart.unit,
          range: chart.range,
          color: chart.color
        }));

        // Initialize unified AI engine
        const engine = new UnifiedAIEngine(healthMetrics, stablePatientProfile, stablePatientData);
        setAIEngine(engine);

        // Generate all AI analyses
        const enhancedHealthScore = engine.calculateEnhancedHealthScore();
        const insights = engine.generateUnifiedInsights();
        const predictiveAnalytics = engine.generatePredictiveAnalytics();
        const advancedPatterns = engine.detectAdvancedPatterns();
        const dynamicCareplan = engine.createDynamicCareplan();

        // Update state
        setHealthScore(enhancedHealthScore);
        setUnifiedInsights(insights);
        setPredictions(predictiveAnalytics);
        setPatterns(advancedPatterns);
        setCareplan(dynamicCareplan);

        console.log('🧠 Unified AI Intelligence initialized:', {
          healthScore: enhancedHealthScore.overall,
          insights: insights.length,
          predictions: predictiveAnalytics.length,
          patterns: advancedPatterns.length,
          careplan: dynamicCareplan.id
        });

      } catch (error) {
        console.error('❌ Error initializing Unified AI Intelligence:', error);
        // Set empty states on error
        setHealthScore(null);
        setUnifiedInsights([]);
        setPredictions([]);
        setPatterns([]);
        setCareplan(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Delay initialization to prevent render blocking
    const timer = setTimeout(initializeUnifiedAI, 100);
    return () => clearTimeout(timer);
  }, [charts.length, isClient, stablePatientProfile, stablePatientData]);

  // Calculate summary statistics
  const totalInsights = unifiedInsights.length;
  const criticalInsights = unifiedInsights.filter(i => i.severity === 'critical' || i.severity === 'high').length;
  const actionableInsights = unifiedInsights.filter(i => i.actionable).length;
  const crossValidatedInsights = unifiedInsights.filter(i => i.crossValidated).length;
  const averageConfidence = unifiedInsights.length > 0 
    ? Math.round((unifiedInsights.reduce((sum, i) => sum + i.confidence, 0) / unifiedInsights.length) * 100)
    : 0;

  // Loading state
  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
        <div className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-purple-500 animate-pulse" />
            <span className="text-xl font-semibold text-gray-700">Unified AI Intelligence Analyzing...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
          <p className="text-gray-600">Merging insights from multiple AI engines to provide comprehensive health intelligence</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unified AI Intelligence Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Brain className="h-8 w-8" />
              <h2 className="text-2xl font-bold">🧠 Unified AI Health Intelligence</h2>
            </div>
            <p className="text-purple-100 mb-4">
              Advanced pattern recognition, predictive analytics, and personalized recommendations powered by multiple AI engines
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span>{totalInsights} Total Insights</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{criticalInsights} High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>{actionableInsights} Actionable</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span>{crossValidatedInsights} Cross-Validated</span>
              </div>
            </div>
          </div>
          {healthScore && (
            <div className="text-center">
              <div className="text-3xl font-bold">{healthScore.overall}/100</div>
              <div className="text-sm text-purple-100">Enhanced Health Score</div>
              <div className="flex items-center justify-center mt-2 gap-2">
                <div className="flex items-center">
                  {healthScore.trend === 'improving' ? '📈' : healthScore.trend === 'declining' ? '📉' : '📊'}
                  <span className="ml-1 text-xs capitalize">{healthScore.trend}</span>
                </div>
                <div className="text-xs">→</div>
                <div className="flex items-center">
                  {healthScore.predictedTrend === 'improving' ? '📈' : healthScore.predictedTrend === 'declining' ? '📉' : '📊'}
                  <span className="ml-1 text-xs capitalize">{healthScore.predictedTrend}</span>
                </div>
              </div>
              <div className="text-xs text-purple-200 mt-1">
                Confidence: {averageConfidence}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Health Overview', icon: '📊', description: 'Comprehensive health status' },
            { id: 'insights', name: 'Smart Insights & Alerts', icon: '💡', count: totalInsights, description: 'AI-generated insights' },
            { id: 'predictions', name: 'Predictive Analytics', icon: '🔮', count: predictions.length, description: 'Future health trajectories' },
            { id: 'patterns', name: 'Pattern Intelligence', icon: '🧩', count: patterns.length, description: 'Advanced pattern detection' },
            { id: 'careplan', name: 'Personalized Care Plan', icon: '❤️', description: 'Dynamic care recommendations' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              title={tab.description}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.name}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content Container */}
      <div className="min-h-96">
        {activeTab === 'overview' && healthScore && (
          <HealthOverviewTab 
            healthScore={healthScore}
            insights={unifiedInsights}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'insights' && (
          <SmartInsightsAlertsTab 
            insights={unifiedInsights}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'predictions' && (
          <PredictiveAnalyticsTab 
            predictions={predictions}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'patterns' && (
          <PatternIntelligenceTab 
            patterns={patterns}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'careplan' && (
          <PersonalizedCarePlanTab 
            careplan={careplan}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}