"use client";

import { EnhancedHealthScore, UnifiedInsight } from '@/lib/unified-ai-intelligence';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle2, Target, Heart } from 'lucide-react';

interface HealthOverviewTabProps {
  healthScore: EnhancedHealthScore;
  insights: UnifiedInsight[];
  isLoading?: boolean;
}

export function HealthOverviewTab({ healthScore, insights, isLoading = false }: HealthOverviewTabProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get top priority insights for quick action dashboard
  const priorityInsights = insights
    .filter(i => i.importance === 'critical' || i.importance === 'high')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Enhanced Health Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Health Score */}
        <Card className={`border-2 ${getScoreBackground(healthScore.overall)}`}>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Overall Health Score</h3>
            </div>
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(healthScore.overall)}`}>
              {healthScore.overall}/100
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-sm text-gray-600">Current:</span>
              {getTrendIcon(healthScore.trend)}
              <span className="text-sm capitalize">{healthScore.trend}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-600">Predicted:</span>
              {getTrendIcon(healthScore.predictedTrend)}
              <span className="text-sm capitalize">{healthScore.predictedTrend}</span>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Confidence Range: {healthScore.confidenceInterval.low}-{healthScore.confidenceInterval.high}
            </div>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card className="border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Risk Assessment</h3>
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Current Risk Level</span>
                <Badge className={getRiskLevelColor(healthScore.riskLevel)}>
                  {healthScore.riskLevel.toUpperCase()}
                </Badge>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Contributing Factors</h4>
                <div className="space-y-1">
                  {healthScore.contributingFactors.length > 0 ? (
                    healthScore.contributingFactors.map((factor, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
                        {factor}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      No major risk factors identified
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Action Dashboard */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Priority Actions</h3>
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-3">
              {priorityInsights.length > 0 ? (
                priorityInsights.map((insight, index) => (
                  <div key={insight.id} className="p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-800 line-clamp-1">
                        {insight.title}
                      </h4>
                      <Badge variant={insight.severity === 'critical' ? 'destructive' : 'default'} className="text-xs">
                        {insight.importance}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{insight.description}</p>
                    {insight.actionable && (
                      <div className="mt-2 text-xs text-blue-600 font-medium">
                        Action required
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No urgent actions needed</p>
                  <p className="text-xs text-gray-500">Continue regular monitoring</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Health Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Enhanced Health Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Liver Function', score: healthScore.liver, icon: '🫀', description: 'ALT, AST, Bilirubin levels' },
              { name: 'Kidney Function', score: healthScore.kidney, icon: '🩺', description: 'Creatinine, filtration rate' },
              { name: 'Coagulation', score: healthScore.coagulation, icon: '🩸', description: 'INR, Platelets' },
              { name: 'Nutrition', score: healthScore.nutrition, icon: '🥗', description: 'Albumin, Protein levels' }
            ].map((item) => (
              <div key={item.name} className="text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h4 className="font-medium text-gray-800 mb-1">{item.name}</h4>
                <div className={`text-2xl font-bold mb-2 ${getScoreColor(item.score)}`}>
                  {item.score}/100
                </div>
                <Progress value={item.score} className="h-2 mb-2" />
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Trends Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Health Trends Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current vs Predicted Trends */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Trend Comparison</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Current Trend</span>
                    {getTrendIcon(healthScore.trend)}
                  </div>
                  <span className="text-sm capitalize font-medium">{healthScore.trend}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Predicted Trend</span>
                    {getTrendIcon(healthScore.predictedTrend)}
                  </div>
                  <span className="text-sm capitalize font-medium">{healthScore.predictedTrend}</span>
                </div>
              </div>
            </div>

            {/* Confidence Metrics */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Prediction Confidence</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Confidence Range</span>
                    <span>{healthScore.confidenceInterval.low}-{healthScore.confidenceInterval.high}</span>
                  </div>
                  <Progress 
                    value={((healthScore.confidenceInterval.high - healthScore.confidenceInterval.low) / 100) * 100} 
                    className="h-2" 
                  />
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>AI Insight:</strong> Based on current data patterns, your health score is predicted to {healthScore.predictedTrend} with high confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}