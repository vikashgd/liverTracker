"use client";

import { useState, useEffect } from 'react';
import { HealthIntelligenceEngine, HealthMetric, HealthScore, HealthAlert, HealthInsight, PatientProfile } from '@/lib/ai-health-intelligence';
import { CanonicalMetric } from '@/lib/metrics';
import { SmartAlertSystem, CompactAlertBanner } from './smart-alert-system';
import { MELDIntelligence } from './meld-intelligence';
import { ImagingDashboard } from './imaging-dashboard';
import DiseaseProgressionAnalysis from './disease-progression-analysis';

interface HealthIntelligenceDashboardProps {
  charts: Array<{
    title: CanonicalMetric;
    color: string;
    data: Array<{ date: string; value: number | null; reportCount?: number }>;
    range: { low: number; high: number };
    unit: string;
  }>;
  patientProfile?: PatientProfile;
}

export function HealthIntelligenceDashboard({ charts, patientProfile = {} }: HealthIntelligenceDashboardProps) {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'insights' | 'trends' | 'meld' | 'imaging' | 'progression'>('overview');
  const [currentProfile, setCurrentProfile] = useState<PatientProfile>(patientProfile);

  useEffect(() => {
    setIsClient(true);
    
    // Convert charts to HealthMetric format
    const healthMetrics: HealthMetric[] = charts.map(chart => ({
      name: chart.title,
      data: chart.data,
      unit: chart.unit,
      range: chart.range,
      color: chart.color
    }));

    // Initialize AI engine
    const engine = new HealthIntelligenceEngine(healthMetrics, currentProfile);

    // Generate insights
    setHealthScore(engine.calculateHealthScore());
    setAlerts(engine.generateAlerts());
    setInsights(engine.generateInsights());
  }, [charts, currentProfile]);

  if (!isClient) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
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

  const getSeverityColor = (severity: HealthAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'concerning': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getImportanceColor = (importance: HealthInsight['importance']) => {
    switch (importance) {
      case 'critical': return 'bg-red-50 border-l-red-500';
      case 'high': return 'bg-orange-50 border-l-orange-500';
      case 'medium': return 'bg-yellow-50 border-l-yellow-500';
      default: return 'bg-blue-50 border-l-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Compact Alert Banner */}
      <CompactAlertBanner alerts={alerts} />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">🧠 AI Health Intelligence</h2>
            <p className="text-blue-100">
              Advanced analytics and personalized insights for your health data
            </p>
          </div>
          {healthScore && (
            <div className="text-center">
              <div className="text-3xl font-bold">{healthScore.overall}/100</div>
              <div className="text-sm text-blue-100">Health Score</div>
              <div className="flex items-center mt-2">
                {healthScore.trend === 'improving' ? '📈' : healthScore.trend === 'declining' ? '📉' : '📊'}
                <span className="ml-1 text-sm capitalize">{healthScore.trend}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'progression', name: 'Disease Journey', icon: '🚶‍♂️' },
            { id: 'meld', name: 'MELD Score', icon: '🏥' },
            { id: 'imaging', name: 'Imaging', icon: '🔬' },
            { id: 'alerts', name: 'Alerts', icon: '🚨', count: alerts.length },
            { id: 'insights', name: 'Insights', icon: '💡', count: insights.length },
            { id: 'trends', name: 'Trends', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && healthScore && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health Score Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Score Breakdown</h3>
            <div className="space-y-4">
              {[
                { name: 'Overall Health', score: healthScore.overall, icon: '🏥' },
                { name: 'Liver Function', score: healthScore.liver, icon: '🫀' },
                { name: 'Kidney Function', score: healthScore.kidney, icon: '🩺' },
                { name: 'Coagulation', score: healthScore.coagulation, icon: '🩸' },
                { name: 'Nutrition', score: healthScore.nutrition, icon: '🥗' }
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>{item.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.score >= 80 ? 'bg-green-500' :
                          item.score >= 60 ? 'bg-yellow-500' :
                          item.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${getScoreColor(item.score)}`}>
                      {item.score}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className={`rounded-lg border p-6 ${getScoreBackground(healthScore.overall)}`}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Assessment</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Risk Level</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  healthScore.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                  healthScore.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  healthScore.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {healthScore.riskLevel.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Trend Direction</span>
                <span className="flex items-center space-x-1">
                  {healthScore.trend === 'improving' ? '📈' : healthScore.trend === 'declining' ? '📉' : '📊'}
                  <span className="text-sm capitalize">{healthScore.trend}</span>
                </span>
              </div>
              <div className="mt-4 p-3 bg-white rounded border">
                <p className="text-sm text-gray-600">
                  {healthScore.riskLevel === 'low' && 'Your health indicators are generally within normal ranges. Continue monitoring regularly.'}
                  {healthScore.riskLevel === 'medium' && 'Some health indicators need attention. Consider discussing with your healthcare provider.'}
                  {healthScore.riskLevel === 'high' && 'Multiple health indicators are concerning. Consultation with healthcare provider recommended.'}
                  {healthScore.riskLevel === 'critical' && 'Critical health indicators detected. Urgent medical consultation recommended.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'progression' && (
        <DiseaseProgressionAnalysis 
          data={{
            reportFiles: [], // Will be populated when we integrate with actual data
            extractedMetrics: charts.flatMap(chart => 
              chart.data
                .filter(d => d.value !== null)
                .map(d => ({
                  metricType: chart.title,
                  numericValue: d.value?.toString(),
                  textValue: JSON.stringify({ confidence: 'high' }),
                  createdAt: d.date,
                  unit: chart.unit
                }))
            ),
            imagingReports: [] // Will be populated when we integrate with actual imaging data
          }}
        />
      )}

      {activeTab === 'meld' && (
        <MELDIntelligence 
          charts={charts} 
          patientProfile={currentProfile} 
          onProfileUpdate={setCurrentProfile}
        />
      )}

      {activeTab === 'imaging' && (
        <ImagingDashboard />
      )}

      {activeTab === 'alerts' && (
        <SmartAlertSystem alerts={alerts} />
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Health Insights</h3>
            <span className="text-sm text-gray-500">{insights.length} insights generated</span>
          </div>
          
          {insights.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <span className="text-4xl">🤔</span>
              <h4 className="text-lg font-medium text-gray-800 mt-2">No Insights Available</h4>
              <p className="text-gray-600 mt-1">More data points are needed to generate meaningful insights.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`border-l-4 rounded-r-lg p-4 ${getImportanceColor(insight.importance)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">
                          {insight.category === 'trend' ? '📈' :
                           insight.category === 'correlation' ? '🔗' :
                           insight.category === 'risk' ? '⚠️' :
                           insight.category === 'improvement' ? '✅' : '📊'}
                        </span>
                        <h4 className="font-medium text-gray-800">{insight.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          insight.importance === 'critical' ? 'bg-red-100 text-red-700' :
                          insight.importance === 'high' ? 'bg-orange-100 text-orange-700' :
                          insight.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {insight.importance.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{insight.summary}</p>
                      <p className="text-xs text-gray-500 mb-3">{insight.details}</p>
                      
                      {insight.actionable && insight.recommendation && (
                        <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                          <p className="text-xs font-medium text-blue-800">Action Recommended:</p>
                          <p className="text-sm text-blue-700 mt-1">{insight.recommendation}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="text-xs text-gray-500">
                          Confidence: {(insight.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Metrics: {insight.metrics.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Trend Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {charts.map((chart) => {
              // Quick trend calculation for display
              const validData = chart.data.filter(d => d.value !== null);
              if (validData.length < 2) return null;
              
              const trend = validData.length >= 2 ? 
                validData[validData.length - 1].value! > validData[validData.length - 2].value! ? 'up' : 'down' : 'stable';
              
              return (
                <div key={chart.title} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">{chart.title}</h4>
                    <span className="text-lg">
                      {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '📊'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Latest:</span>
                      <span className="font-medium">
                        {validData[validData.length - 1]?.value?.toFixed(1)} {chart.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Range:</span>
                      <span>{chart.range.low}-{chart.range.high} {chart.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Data Points:</span>
                      <span>{validData.length}</span>
                    </div>
                  </div>
                  
                  {/* Mini trend visualization */}
                  <div className="mt-3 h-12 relative">
                    <svg className="w-full h-full">
                      <path
                        d={validData.map((d, i) => {
                          const x = (i / (validData.length - 1)) * 100;
                          const y = 100 - ((d.value! - chart.range.low) / (chart.range.high - chart.range.low)) * 100;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(5, Math.min(95, y))}`
                        }).join(' ')}
                        fill="none"
                        stroke={chart.color}
                        strokeWidth="2"
                        className="drop-shadow-sm"
                      />
                    </svg>
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  );
}
