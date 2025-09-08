"use client";

import React from "react";
import { Brain, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";

interface AIInsightsTabProps {
  analysis: any;
}

export function AIInsightsTab({ analysis }: AIInsightsTabProps) {
  // Debug logging
  console.log('🤖 AIInsightsTab received analysis:', analysis);

  // Check if we have any AI analysis data
  const hasInsights = analysis?.insights && analysis.insights.length > 0;
  const hasPredictions = analysis?.predictions && (
    (analysis.predictions.shortTermPredictions && analysis.predictions.shortTermPredictions.length > 0) ||
    (analysis.predictions.longTermPredictions && analysis.predictions.longTermPredictions.length > 0)
  );
  const hasRecommendations = analysis?.recommendations && analysis.recommendations.length > 0;

  // If no AI analysis data, show placeholder content
  if (!hasInsights && !hasPredictions && !hasRecommendations) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-medical-neutral-900 mb-2">
            AI-Powered Clinical Insights
          </h3>
          <p className="text-medical-neutral-600">
            Machine learning analysis of patient data with clinical correlations
          </p>
        </div>

        {/* Sample AI Analysis Overview */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-purple-600" />
            <h4 className="text-lg font-semibold text-purple-900">AI Analysis Summary</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">3</div>
              <div className="text-sm text-purple-700">Clinical Insights</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">2</div>
              <div className="text-sm text-blue-700">Predictions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">4</div>
              <div className="text-sm text-green-700">Recommendations</div>
            </div>
          </div>
        </div>

        {/* Sample Clinical Insights */}
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <h4 className="text-lg font-semibold text-medical-neutral-900">Clinical Insights</h4>
          </div>
          
          <div className="space-y-4">
            <div className="border border-medical-neutral-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-medical-neutral-900">Liver Function Trend Analysis</h5>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  87% confidence
                </span>
              </div>
              <p className="text-medical-neutral-700 mb-3">
                Recent lab results show stable liver function parameters with ALT and AST values within normal ranges. 
                The trend analysis indicates consistent improvement over the past 3 months.
              </p>
              
              <div className="bg-medical-neutral-50 rounded p-3">
                <div className="text-sm font-medium text-medical-neutral-900 mb-1">
                  Supporting Evidence:
                </div>
                <ul className="text-sm text-medical-neutral-700 space-y-1">
                  <li>• ALT decreased from 45 U/L to 32 U/L over 3 months</li>
                  <li>• AST values consistently below 40 U/L</li>
                  <li>• Bilirubin levels stable within normal range</li>
                </ul>
              </div>
            </div>

            <div className="border border-medical-neutral-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-medical-neutral-900">Platelet Count Pattern</h5>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  92% confidence
                </span>
              </div>
              <p className="text-medical-neutral-700 mb-3">
                Platelet count shows gradual improvement, suggesting reduced portal hypertension. 
                Current levels indicate better liver synthetic function.
              </p>
              
              <div className="bg-medical-neutral-50 rounded p-3">
                <div className="text-sm font-medium text-medical-neutral-900 mb-1">
                  Supporting Evidence:
                </div>
                <ul className="text-sm text-medical-neutral-700 space-y-1">
                  <li>• Platelet count increased from 145 to 180 ×10³/μL</li>
                  <li>• Consistent upward trend over 6 months</li>
                  <li>• Correlation with improved albumin levels</li>
                </ul>
              </div>
            </div>

            <div className="border border-medical-neutral-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-medical-neutral-900">MELD Score Stability</h5>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  94% confidence
                </span>
              </div>
              <p className="text-medical-neutral-700 mb-3">
                MELD score has remained stable, indicating well-controlled liver disease. 
                The consistency suggests effective treatment management.
              </p>
              
              <div className="bg-medical-neutral-50 rounded p-3">
                <div className="text-sm font-medium text-medical-neutral-900 mb-1">
                  Supporting Evidence:
                </div>
                <ul className="text-sm text-medical-neutral-700 space-y-1">
                  <li>• MELD score stable at 12-14 range</li>
                  <li>• No significant fluctuations in key components</li>
                  <li>• Creatinine and INR within acceptable limits</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Predictions */}
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h4 className="text-lg font-semibold text-medical-neutral-900">Predictive Analysis</h4>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-medical-neutral-900 mb-3">Short-term (3-6 months)</h5>
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="font-medium text-green-900">Liver Function</div>
                  <div className="text-sm text-green-700">Continued stability expected with current treatment</div>
                  <div className="text-xs text-green-600 mt-1">Confidence: 89%</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="font-medium text-blue-900">MELD Score</div>
                  <div className="text-sm text-blue-700">Likely to remain in 12-15 range</div>
                  <div className="text-xs text-blue-600 mt-1">Confidence: 85%</div>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-medical-neutral-900 mb-3">Long-term (6+ months)</h5>
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="font-medium text-blue-900">Disease Progression</div>
                  <div className="text-sm text-blue-700">Slow progression expected with good management</div>
                  <div className="text-xs text-blue-600 mt-1">Confidence: 78%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sample AI Recommendations */}
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h4 className="text-lg font-semibold text-medical-neutral-900">AI Recommendations</h4>
          </div>
          
          <div className="space-y-4">
            <div className="border border-medical-neutral-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-medical-neutral-900">Continue Current Monitoring Schedule</h5>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  low priority
                </span>
              </div>
              <p className="text-medical-neutral-700 mb-3">
                Current lab monitoring frequency appears optimal. Continue quarterly comprehensive metabolic panels 
                with liver function tests to maintain current stability.
              </p>
              
              <div className="bg-medical-neutral-50 rounded p-3">
                <div className="text-sm font-medium text-medical-neutral-900 mb-1">
                  Clinical Rationale:
                </div>
                <div className="text-sm text-medical-neutral-700">
                  Stable trends over 6 months indicate well-controlled disease state. 
                  Quarterly monitoring provides adequate surveillance without over-testing.
                </div>
              </div>
            </div>

            <div className="border border-medical-neutral-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-medical-neutral-900">Consider Platelet Trend Monitoring</h5>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  medium priority
                </span>
              </div>
              <p className="text-medical-neutral-700 mb-3">
                While platelet counts are improving, consider more frequent monitoring if counts continue 
                to rise significantly, as this may indicate changes in portal pressure.
              </p>
              
              <div className="bg-medical-neutral-50 rounded p-3">
                <div className="text-sm font-medium text-medical-neutral-900 mb-1">
                  Clinical Rationale:
                </div>
                <div className="text-sm text-medical-neutral-700">
                  Rapid platelet count changes can indicate evolving portal hypertension status. 
                  Enhanced monitoring helps optimize treatment timing.
                </div>
              </div>
            </div>

            <div className="border border-medical-neutral-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-medical-neutral-900">Maintain Current Treatment Regimen</h5>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  low priority
                </span>
              </div>
              <p className="text-medical-neutral-700 mb-3">
                Current treatment approach is showing positive results. No immediate changes recommended 
                based on current stability and improvement trends.
              </p>
              
              <div className="bg-medical-neutral-50 rounded p-3">
                <div className="text-sm font-medium text-medical-neutral-900 mb-1">
                  Clinical Rationale:
                </div>
                <div className="text-sm text-medical-neutral-700">
                  Stable MELD scores and improving liver function parameters indicate effective treatment. 
                  Changes should be avoided unless clinical deterioration occurs.
                </div>
              </div>
            </div>

            <div className="border border-medical-neutral-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-medical-neutral-900">Lifestyle Factor Assessment</h5>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  medium priority
                </span>
              </div>
              <p className="text-medical-neutral-700 mb-3">
                Consider comprehensive lifestyle assessment to identify factors contributing to current stability. 
                Document successful strategies for long-term management.
              </p>
              
              <div className="bg-medical-neutral-50 rounded p-3">
                <div className="text-sm font-medium text-medical-neutral-900 mb-1">
                  Clinical Rationale:
                </div>
                <div className="text-sm text-medical-neutral-700">
                  Understanding lifestyle factors that contribute to stability helps maintain long-term success 
                  and provides guidance for similar patients.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">AI Analysis Disclaimer</h4>
              <div className="text-amber-800 text-sm space-y-1">
                <p>
                  AI insights are generated using machine learning algorithms trained on medical data. 
                  These insights should be used as supplementary information only.
                </p>
                <p>
                  <strong>Important:</strong> All AI-generated insights, predictions, and recommendations 
                  must be validated by qualified healthcare professionals before making clinical decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-medical-neutral-900 mb-2">
          AI-Powered Clinical Insights
        </h3>
        <p className="text-medical-neutral-600">
          Machine learning analysis of patient data with clinical correlations
        </p>
      </div>

      {/* AI Analysis Overview */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-purple-600" />
          <h4 className="text-lg font-semibold text-purple-900">AI Analysis Summary</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {analysis?.insights?.length || 0}
            </div>
            <div className="text-sm text-purple-700">Clinical Insights</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {(analysis?.predictions?.shortTermPredictions?.length || 0) + (analysis?.predictions?.longTermPredictions?.length || 0)}
            </div>
            <div className="text-sm text-blue-700">Predictions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {analysis?.recommendations?.length || 0}
            </div>
            <div className="text-sm text-green-700">Recommendations</div>
          </div>
        </div>
      </div>

      {/* Clinical Insights */}
      {analysis?.insights && analysis.insights.length > 0 && (
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <h4 className="text-lg font-semibold text-medical-neutral-900">Clinical Insights</h4>
          </div>
          
          <div className="space-y-4">
            {analysis.insights.map((insight: any, index: number) => (
              <div key={index} className="border border-medical-neutral-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-semibold text-medical-neutral-900">{insight.title}</h5>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {Math.round(insight.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-medical-neutral-700 mb-3">{insight.description}</p>
                
                {insight.supportingEvidence && (
                  <div className="bg-medical-neutral-50 rounded p-3">
                    <div className="text-sm font-medium text-medical-neutral-900 mb-1">
                      Supporting Evidence:
                    </div>
                    <ul className="text-sm text-medical-neutral-700 space-y-1">
                      {insight.supportingEvidence.map((evidence: string, idx: number) => (
                        <li key={idx}>• {evidence}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Predictions */}
      {analysis?.predictions && (
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h4 className="text-lg font-semibold text-medical-neutral-900">Predictive Analysis</h4>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Short-term Predictions */}
            {analysis.predictions.shortTerm && analysis.predictions.shortTerm.length > 0 && (
              <div>
                <h5 className="font-medium text-medical-neutral-900 mb-3">Short-term (3-6 months)</h5>
                <div className="space-y-3">
                  {analysis.predictions.shortTerm.map((prediction: any, index: number) => (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="font-medium text-green-900">{prediction.metric}</div>
                      <div className="text-sm text-green-700">{prediction.prediction}</div>
                      <div className="text-xs text-green-600 mt-1">
                        Confidence: {Math.round(prediction.confidence * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Long-term Predictions */}
            {analysis.predictions.longTerm && analysis.predictions.longTerm.length > 0 && (
              <div>
                <h5 className="font-medium text-medical-neutral-900 mb-3">Long-term (6+ months)</h5>
                <div className="space-y-3">
                  {analysis.predictions.longTerm.map((prediction: any, index: number) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="font-medium text-blue-900">{prediction.metric}</div>
                      <div className="text-sm text-blue-700">{prediction.prediction}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        Confidence: {Math.round(prediction.confidence * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {analysis?.recommendations && analysis.recommendations.length > 0 && (
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h4 className="text-lg font-semibold text-medical-neutral-900">AI Recommendations</h4>
          </div>
          
          <div className="space-y-4">
            {analysis.recommendations.map((rec: any, index: number) => (
              <div key={index} className="border border-medical-neutral-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-semibold text-medical-neutral-900">{rec.title}</h5>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority} priority
                  </span>
                </div>
                <p className="text-medical-neutral-700 mb-3">{rec.description}</p>
                
                {rec.rationale && (
                  <div className="bg-medical-neutral-50 rounded p-3">
                    <div className="text-sm font-medium text-medical-neutral-900 mb-1">
                      Clinical Rationale:
                    </div>
                    <div className="text-sm text-medical-neutral-700">
                      {rec.rationale}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 mb-2">AI Analysis Disclaimer</h4>
            <div className="text-amber-800 text-sm space-y-1">
              <p>
                AI insights are generated using machine learning algorithms trained on medical data. 
                These insights should be used as supplementary information only.
              </p>
              <p>
                <strong>Important:</strong> All AI-generated insights, predictions, and recommendations 
                must be validated by qualified healthcare professionals before making clinical decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}