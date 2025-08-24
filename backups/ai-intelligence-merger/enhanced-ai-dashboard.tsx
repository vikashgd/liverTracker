'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  Target,
  Calendar,
  Activity,
  Heart,
  Zap,
  Star,
  ArrowRight,
  Clock,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { EnhancedAIIntelligence, AIInsight, PredictionModel, PersonalizedCareplan, PatternAnalysis } from '@/lib/enhanced-ai-intelligence';

interface EnhancedAIDashboardProps {
  charts: Array<{
    title: string;
    color: string;
    data: Array<{ date: string; value: number | null; reportCount?: number }>;
    range: { low: number; high: number };
    unit: string;
  }>;
  patientData?: {
    age?: number;
    gender?: 'male' | 'female';
    diagnosisDate?: string;
    primaryCondition?: string;
  };
}

export default function EnhancedAIDashboard({ charts, patientData = {} }: EnhancedAIDashboardProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'predictions' | 'patterns' | 'careplan'>('insights');
  const [isClient, setIsClient] = useState(false);
  const [aiEngine, setAIEngine] = useState<EnhancedAIIntelligence | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [predictions, setPredictions] = useState<PredictionModel[]>([]);
  const [patterns, setPatterns] = useState<PatternAnalysis[]>([]);
  const [careplan, setCareplan] = useState<PersonalizedCareplan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize AI Engine and generate insights
  useEffect(() => {
    if (!isClient || !charts.length) return;

    setIsLoading(true);
    
    // Use a timeout to prevent blocking the render
    const initializeAI = async () => {
      try {
        // Convert charts to the format expected by AI engine
        const healthMetrics = charts.map(chart => ({
          name: chart.title as any,
          data: chart.data,
          unit: chart.unit,
          range: chart.range
        }));

        const engine = new EnhancedAIIntelligence(healthMetrics, patientData);
        setAIEngine(engine);

        // Generate all AI analyses
        const generatedInsights = engine.generateAdvancedInsights();
        const generatedPredictions = engine.generatePredictions();
        const detectedPatterns = engine.detectPatterns();
        const generatedCareplan = engine.generateCareplan();

        setInsights(generatedInsights);
        setPredictions(generatedPredictions);
        setPatterns(detectedPatterns);
        setCareplan(generatedCareplan);

      } catch (error) {
        console.error('Error initializing AI engine:', error);
        // Set empty states on error to prevent infinite loading
        setInsights([]);
        setPredictions([]);
        setPatterns([]);
        setCareplan(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Delay initialization to prevent render blocking
    const timer = setTimeout(initializeAI, 100);
    return () => clearTimeout(timer);
  }, [charts.length, isClient]); // Simplified dependencies

  const totalInsights = insights?.length || 0;
  const criticalInsights = insights?.filter(i => i.severity === 'critical' || i.severity === 'high').length || 0;
  const actionableInsights = insights?.filter(i => i.actionable).length || 0;

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
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="h-8 w-8 text-blue-500 animate-pulse" />
              <span className="text-xl font-semibold text-gray-700">AI Intelligence Analyzing...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <p className="text-gray-600">Processing your health data to generate personalized insights</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Intelligence Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Brain className="h-8 w-8" />
                <h2 className="text-2xl font-bold">Enhanced AI Intelligence</h2>
              </div>
              <p className="text-purple-100 mb-4">
                Advanced pattern recognition, predictive analytics, and personalized recommendations
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  <span className="text-sm">{totalInsights} Insights Generated</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm">{criticalInsights} Require Attention</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <span className="text-sm">{actionableInsights} Actionable Items</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{Math.round((insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length) * 100)}%</div>
              <div className="text-sm text-purple-100">Average Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'insights', name: 'AI Insights', icon: <Lightbulb className="h-4 w-4" />, count: insights.length },
            { id: 'predictions', name: 'Predictions', icon: <TrendingUp className="h-4 w-4" />, count: predictions.length },
            { id: 'patterns', name: 'Patterns', icon: <Activity className="h-4 w-4" />, count: patterns.length },
            { id: 'careplan', name: 'Care Plan', icon: <Heart className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {insights && insights.length > 0 ? insights.map((insight, index) => (
            <Card key={insight.id} className={`border-l-4 ${
              insight.severity === 'critical' ? 'border-red-500 bg-red-50' :
              insight.severity === 'high' ? 'border-orange-500 bg-orange-50' :
              insight.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {insight.type === 'pattern' && <Activity className="h-5 w-5 text-purple-600" />}
                    {insight.type === 'prediction' && <TrendingUp className="h-5 w-5 text-blue-600" />}
                    {insight.type === 'alert' && <AlertTriangle className="h-5 w-5 text-orange-600" />}
                    {insight.type === 'recommendation' && <Target className="h-5 w-5 text-green-600" />}
                    {insight.type === 'milestone' && <Star className="h-5 w-5 text-yellow-600" />}
                    <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                  </div>
                  <Badge variant={
                    insight.severity === 'critical' ? 'destructive' :
                    insight.severity === 'high' ? 'default' : 'secondary'
                  }>
                    {insight.severity}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                <p className="text-xs text-gray-600 mb-4">{insight.explanation}</p>
                
                {insight.recommendation && (
                  <div className="bg-white p-3 rounded border border-gray-200 mb-3">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <ArrowRight className="h-3 w-3" />
                      <span className="text-xs font-medium">Recommendation:</span>
                    </div>
                    <p className="text-sm text-gray-700">{insight.recommendation}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div>Confidence: {Math.round(insight.confidence * 100)}%</div>
                  <div>Metrics: {insight.relatedMetrics.join(', ')}</div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-2 text-center py-8">
              <div className="text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No insights available yet. Please wait while AI analyzes your data.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="space-y-6">
          {predictions.map((prediction, index) => (
            <Card key={`${prediction.metric}-${index}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {prediction.metric} Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        {(() => {
                          const chartData = prediction.predictedValues.filter(p => p.scenario === 'likely');
                          return chartData.length > 0 ? (
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="timeframe" />
                              <YAxis />
                              <Tooltip />
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#8884d8" 
                                strokeDasharray="5 5"
                                name="Predicted"
                              />
                            </LineChart>
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                              <span>No prediction data available</span>
                            </div>
                          );
                        })()}
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Current Status</h4>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {prediction.currentValue.toFixed(1)}
                      </div>
                      <div className={`text-sm flex items-center gap-1 ${
                        prediction.trend === 'improving' ? 'text-green-600' :
                        prediction.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {prediction.trend === 'improving' && <TrendingDown className="h-4 w-4" />}
                        {prediction.trend === 'declining' && <TrendingUp className="h-4 w-4" />}
                        {prediction.trend === 'stable' && <Activity className="h-4 w-4" />}
                        {prediction.trend}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Risk Factors</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {prediction.riskFactors.slice(0, 3).map((factor, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Recommendations</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {prediction.recommendations.slice(0, 2).map((rec, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'patterns' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {patterns.map((pattern, index) => (
            <Card key={index} className="border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-purple-900 capitalize">
                    {pattern.type} Pattern
                  </h3>
                  <Badge variant={
                    pattern.significance === 'high' ? 'default' : 'secondary'
                  }>
                    {pattern.significance} significance
                  </Badge>
                </div>
                
                <p className="text-sm text-purple-800 mb-3">{pattern.description}</p>
                <p className="text-xs text-purple-700 mb-4">{pattern.clinical_relevance}</p>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-purple-600">
                    Strength: {Math.round(pattern.strength * 100)}%
                  </div>
                  <div className="text-xs text-purple-600">
                    Metrics: {pattern.metrics.join(', ')}
                  </div>
                </div>
                
                <div className="mt-3">
                  <Progress value={pattern.strength * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'careplan' && careplan && (
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6 text-center">
                <Heart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-blue-900 capitalize">
                  {careplan.currentStatus}
                </div>
                <div className="text-sm text-blue-700">Current Status</div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-green-900">
                  {careplan.meldScore || 'N/A'}
                </div>
                <div className="text-sm text-green-700">MELD Score</div>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-orange-900 capitalize">
                  {careplan.riskLevel}
                </div>
                <div className="text-sm text-orange-700">Risk Level</div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {careplan.recommendations.map((rec, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                    rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                    {rec.frequency && (
                      <div className="text-xs text-gray-600">
                        Frequency: {rec.frequency}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Next Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {careplan.nextActions.map((action, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Target Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Target Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {careplan.targetMetrics.map((target, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {target.metric}
                    </div>
                    <div className="text-lg font-bold text-blue-600 mb-1">
                      {target.targetValue}
                    </div>
                    <div className="text-xs text-gray-500">
                      Target: {target.targetTimeframe}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
