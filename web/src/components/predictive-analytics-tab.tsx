"use client";

import { PredictionModel } from '@/lib/enhanced-ai-intelligence';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  CheckCircle2,
  Target,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PredictiveAnalyticsTabProps {
  predictions: PredictionModel[];
  isLoading?: boolean;
}

export function PredictiveAnalyticsTab({ predictions, isLoading = false }: PredictiveAnalyticsTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  // Statistics
  const stats = {
    totalPredictions: predictions.length,
    improvingTrends: predictions.filter(p => p.trend === 'improving').length,
    decliningTrends: predictions.filter(p => p.trend === 'declining').length,
    avgConfidence: predictions.length > 0 
      ? Math.round(predictions.reduce((sum, p) => {
          const avgPredConfidence = p.predictedValues.reduce((s, pv) => s + pv.confidence, 0) / p.predictedValues.length;
          return sum + avgPredConfidence;
        }, 0) / predictions.length * 100)
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{stats.totalPredictions}</div>
            <div className="text-sm text-gray-600">Prediction Models</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{stats.improvingTrends}</div>
            <div className="text-sm text-gray-600">Improving Trends</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <TrendingDown className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold text-red-600">{stats.decliningTrends}</div>
            <div className="text-sm text-gray-600">Declining Trends</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <Target className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">{stats.avgConfidence}%</div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </CardContent>
        </Card>
      </div>



      {/* Prediction Models */}
      <div className="space-y-6">
        {predictions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Predictions Available</h3>
              <p className="text-gray-600">
                Insufficient data points to generate reliable predictions. More historical data is needed.
              </p>
            </CardContent>
          </Card>
        ) : (
          predictions.map((prediction) => (
            <Card key={prediction.metric} className="border-l-4 border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <span>{prediction.metric} Forecast</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {prediction.currentValue.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">Current</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Prediction Chart */}
                  <div className="lg:col-span-2">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prediction.predictedValues.filter(p => p.scenario === 'likely')}>
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
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Prediction Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Trend Analysis</h4>
                      <div className={`text-sm flex items-center gap-1 ${
                        prediction.trend === 'improving' ? 'text-green-600' :
                        prediction.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {prediction.trend === 'improving' && <TrendingUp className="h-4 w-4" />}
                        {prediction.trend === 'declining' && <TrendingDown className="h-4 w-4" />}
                        {prediction.trend === 'stable' && <Activity className="h-4 w-4" />}
                        {prediction.trend}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Risk Factors</h4>
                      <div className="space-y-1">
                        {prediction.riskFactors.slice(0, 3).map((factor, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            {factor}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Recommendations</h4>
                      <div className="space-y-1">
                        {prediction.recommendations.slice(0, 2).map((rec, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Insights */}
      {predictions.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Predictive Analytics Summary</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Key Predictions</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {stats.totalPredictions} metrics have predictive models</li>
                  <li>• {stats.improvingTrends} metrics show improving trends</li>
                  <li>• {stats.decliningTrends} metrics show declining trends</li>
                  <li>• Average prediction confidence: {stats.avgConfidence}%</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Clinical Insights</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Focus on metrics with declining trends</li>
                  <li>• Monitor high-confidence predictions closely</li>
                  <li>• Consider interventions for worst-case scenarios</li>
                  <li>• Discuss predictions with healthcare provider</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}