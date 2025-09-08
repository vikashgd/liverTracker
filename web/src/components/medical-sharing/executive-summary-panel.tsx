"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface ExecutiveSummaryPanelProps {
  summary: any;
  patient: any;
}

export function ExecutiveSummaryPanel({ summary, patient }: ExecutiveSummaryPanelProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-blue-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'declining':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'stable':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-700 bg-green-50 border-green-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-medical-neutral-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-medical-neutral-900 mb-2">
          Executive Summary
        </h2>
        <p className="text-medical-neutral-600">
          Clinical overview and key findings for healthcare provider review
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Overview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-medical-neutral-900 border-b border-medical-neutral-200 pb-2">
            Patient Overview
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-medical-neutral-600">Age:</span>
              <span className="font-medium">{patient?.age || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-medical-neutral-600">Gender:</span>
              <span className="font-medium">{patient?.gender || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-medical-neutral-600">Primary Diagnosis:</span>
              <span className="font-medium">{summary?.patientOverview?.primaryDiagnosis || 'Not specified'}</span>
            </div>
            {summary?.patientOverview?.diagnosisDate && (
              <div className="flex justify-between">
                <span className="text-medical-neutral-600">Diagnosis Date:</span>
                <span className="font-medium">
                  {new Date(summary.patientOverview.diagnosisDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Current Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-medical-neutral-900 border-b border-medical-neutral-200 pb-2">
            Current Status
          </h3>
          
          <div className="space-y-3">
            {summary?.currentStatus?.latestMELDScore && (
              <div className="flex items-center justify-between">
                <span className="text-medical-neutral-600">MELD Score:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{summary.currentStatus.latestMELDScore}</span>
                  {getTrendIcon(summary.currentStatus.meldTrend)}
                </div>
              </div>
            )}
            
            {summary?.currentStatus?.childPughClass && (
              <div className="flex items-center justify-between">
                <span className="text-medical-neutral-600">Child-Pugh Class:</span>
                <span className="font-bold text-lg">{summary.currentStatus.childPughClass}</span>
              </div>
            )}

            {summary?.currentStatus?.meldTrend && (
              <div className="flex items-center justify-between">
                <span className="text-medical-neutral-600">Trend:</span>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getTrendColor(summary.currentStatus.meldTrend)}`}>
                  {summary.currentStatus.meldTrend.charAt(0).toUpperCase() + summary.currentStatus.meldTrend.slice(1)}
                </div>
              </div>
            )}
          </div>

          {/* Key Metrics */}
          {summary?.currentStatus?.keyMetrics && summary.currentStatus.keyMetrics.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-medical-neutral-900 mb-2">Key Metrics</h4>
              <div className="space-y-2">
                {summary.currentStatus.keyMetrics.slice(0, 3).map((metric: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-medical-neutral-600">{metric.name}:</span>
                    <span className="font-medium">
                      {metric.value} {metric.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clinical Highlights */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-medical-neutral-900 border-b border-medical-neutral-200 pb-2">
            Clinical Highlights
          </h3>
          
          {/* Critical Values */}
          {summary?.clinicalHighlights?.criticalValues && summary.clinicalHighlights.criticalValues.length > 0 && (
            <div>
              <h4 className="font-medium text-medical-neutral-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Critical Values
              </h4>
              <div className="space-y-2">
                {summary.clinicalHighlights.criticalValues.slice(0, 3).map((value: any, index: number) => (
                  <div key={index} className={`p-2 rounded-lg border text-xs ${getSeverityColor(value.severity)}`}>
                    <div className="font-medium">{value.name}</div>
                    <div>{value.value} {value.unit} (Normal: {value.normalRange})</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Significant Trends */}
          {summary?.clinicalHighlights?.significantTrends && summary.clinicalHighlights.significantTrends.length > 0 && (
            <div>
              <h4 className="font-medium text-medical-neutral-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Significant Trends
              </h4>
              <div className="space-y-2">
                {summary.clinicalHighlights.significantTrends.slice(0, 2).map((trend: any, index: number) => (
                  <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                    <div className="font-medium text-blue-900">{trend.metric}</div>
                    <div className="text-blue-700">{trend.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights Preview */}
          {summary?.clinicalHighlights?.aiInsights && summary.clinicalHighlights.aiInsights.length > 0 && (
            <div>
              <h4 className="font-medium text-medical-neutral-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                AI Insights
              </h4>
              <div className="space-y-2">
                {summary.clinicalHighlights.aiInsights.slice(0, 2).map((insight: any, index: number) => (
                  <div key={index} className="p-2 bg-green-50 border border-green-200 rounded-lg text-xs">
                    <div className="font-medium text-green-900">{insight.title}</div>
                    <div className="text-green-700">{insight.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {summary?.recommendations && (
        <div className="mt-6 pt-6 border-t border-medical-neutral-200">
          <h3 className="text-lg font-semibold text-medical-neutral-900 mb-4">
            Clinical Recommendations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.recommendations.immediate && summary.recommendations.immediate.length > 0 && (
              <div>
                <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Immediate Actions
                </h4>
                <ul className="space-y-1 text-sm">
                  {summary.recommendations.immediate.map((rec: string, index: number) => (
                    <li key={index} className="text-red-700">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {summary.recommendations.followUp && summary.recommendations.followUp.length > 0 && (
              <div>
                <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Follow-up
                </h4>
                <ul className="space-y-1 text-sm">
                  {summary.recommendations.followUp.map((rec: string, index: number) => (
                    <li key={index} className="text-orange-700">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {summary.recommendations.monitoring && summary.recommendations.monitoring.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Monitoring
                </h4>
                <ul className="space-y-1 text-sm">
                  {summary.recommendations.monitoring.map((rec: string, index: number) => (
                    <li key={index} className="text-blue-700">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}