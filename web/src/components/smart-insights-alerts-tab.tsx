"use client";

import { UnifiedInsight } from '@/lib/unified-ai-intelligence';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Target, 
  Star, 
  ArrowRight, 
  Brain,
  CheckCircle2,
  Clock,
  Filter
} from 'lucide-react';
import { useState } from 'react';

interface SmartInsightsAlertsTabProps {
  insights: UnifiedInsight[];
  isLoading?: boolean;
}

type FilterType = 'all' | 'critical' | 'actionable' | 'cross-validated' | 'recent';
type SortType = 'importance' | 'confidence' | 'date';

export function SmartInsightsAlertsTab({ insights, isLoading = false }: SmartInsightsAlertsTabProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('importance');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <Activity className="h-5 w-5 text-purple-600" />;
      case 'prediction': return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'alert': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'recommendation': return <Target className="h-5 w-5 text-green-600" />;
      case 'milestone': return <Star className="h-5 w-5 text-yellow-600" />;
      default: return <Lightbulb className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  // Filter insights
  const filteredInsights = insights.filter(insight => {
    switch (filter) {
      case 'critical':
        return insight.severity === 'critical' || insight.importance === 'critical';
      case 'actionable':
        return insight.actionable;
      case 'cross-validated':
        return insight.crossValidated;
      case 'recent':
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(insight.created) > dayAgo;
      default:
        return true;
    }
  });

  // Sort insights
  const sortedInsights = [...filteredInsights].sort((a, b) => {
    switch (sort) {
      case 'importance':
        const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return importanceOrder[b.importance as keyof typeof importanceOrder] - importanceOrder[a.importance as keyof typeof importanceOrder];
      case 'confidence':
        return b.confidence - a.confidence;
      case 'date':
        return new Date(b.created).getTime() - new Date(a.created).getTime();
      default:
        return 0;
    }
  });

  // Statistics
  const stats = {
    total: insights.length,
    critical: insights.filter(i => i.severity === 'critical' || i.importance === 'critical').length,
    actionable: insights.filter(i => i.actionable).length,
    crossValidated: insights.filter(i => i.crossValidated).length,
    avgConfidence: insights.length > 0 ? Math.round((insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length) * 100) : 0
  };

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Insights</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-sm text-gray-600">High Priority</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.actionable}</div>
            <div className="text-sm text-gray-600">Actionable</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.crossValidated}</div>
            <div className="text-sm text-gray-600">Cross-Validated</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-indigo-600">{stats.avgConfidence}%</div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All', count: insights.length },
                  { key: 'critical', label: 'Critical', count: stats.critical },
                  { key: 'actionable', label: 'Actionable', count: stats.actionable },
                  { key: 'cross-validated', label: 'Validated', count: stats.crossValidated }
                ].map(({ key, label, count }) => (
                  <Button
                    key={key}
                    variant={filter === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(key as FilterType)}
                    className="text-xs"
                  >
                    {label} ({count})
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="importance">Importance</option>
                <option value="confidence">Confidence</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <div className="space-y-4">
        {sortedInsights.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Insights Found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'No insights have been generated yet. The AI is still analyzing your data.'
                  : `No insights match the current filter: ${filter}`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedInsights.map((insight) => (
            <Card key={insight.id} className={`border-l-4 ${getSeverityColor(insight.severity)}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getInsightIcon(insight.type)}
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {insight.title}
                        {insight.crossValidated && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            <Brain className="h-3 w-3 mr-1" />
                            Cross-Validated
                          </Badge>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getImportanceBadge(insight.importance) as any}>
                          {insight.importance.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {insight.type}
                        </Badge>
                        {insight.sources.length > 1 && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            Multi-Engine
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700">
                      {Math.round(insight.confidence * 100)}% confidence
                    </div>
                    <div className="text-xs text-gray-500">
                      Clinical relevance: {Math.round(insight.clinicalRelevance * 100)}%
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                <p className="text-xs text-gray-600 mb-4">{insight.explanation}</p>

                {insight.recommendation && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <ArrowRight className="h-4 w-4" />
                      <span className="text-sm font-medium">AI Recommendation:</span>
                    </div>
                    <p className="text-sm text-gray-700">{insight.recommendation}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span>Metrics: {insight.relatedMetrics.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(insight.created).toLocaleDateString()}</span>
                    </div>
                    {insight.timeframe && (
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>Timeframe: {insight.timeframe}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {insight.actionable && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Action Required
                      </Badge>
                    )}
                    <div className="text-xs text-gray-500">
                      Sources: {insight.sources.join(', ')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Card */}
      {sortedInsights.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">AI Intelligence Summary</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Key Findings</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {stats.total} total insights generated from multiple AI engines</li>
                  <li>• {stats.crossValidated} insights cross-validated for accuracy</li>
                  <li>• {stats.actionable} insights require immediate attention</li>
                  <li>• Average confidence level: {stats.avgConfidence}%</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Next Steps</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Review high-priority insights first</li>
                  <li>• Focus on actionable recommendations</li>
                  <li>• Monitor cross-validated patterns closely</li>
                  <li>• Discuss findings with healthcare provider</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}