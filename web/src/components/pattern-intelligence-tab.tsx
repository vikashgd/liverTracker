"use client";

import { AdvancedPatternAnalysis } from '@/lib/unified-ai-intelligence';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  BarChart3,
  Brain,
  Target,
  Clock,
  Filter,
  Eye
} from 'lucide-react';
import { useState } from 'react';

interface PatternIntelligenceTabProps {
  patterns: AdvancedPatternAnalysis[];
  isLoading?: boolean;
}

type PatternTypeFilter = 'all' | 'correlation' | 'cycle' | 'threshold' | 'acceleration' | 'plateau';
type SignificanceFilter = 'all' | 'high' | 'medium' | 'low';

export function PatternIntelligenceTab({ patterns, isLoading = false }: PatternIntelligenceTabProps) {
  const [typeFilter, setTypeFilter] = useState<PatternTypeFilter>('all');
  const [significanceFilter, setSignificanceFilter] = useState<SignificanceFilter>('all');
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'correlation': return <Activity className="h-5 w-5 text-purple-600" />;
      case 'cycle': return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'threshold': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'acceleration': return <Zap className="h-5 w-5 text-red-600" />;
      case 'plateau': return <BarChart3 className="h-5 w-5 text-green-600" />;
      default: return <Brain className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPatternColor = (type: string) => {
    switch (type) {
      case 'correlation': return 'border-purple-500 bg-purple-50';
      case 'cycle': return 'border-blue-500 bg-blue-50';
      case 'threshold': return 'border-orange-500 bg-orange-50';
      case 'acceleration': return 'border-red-500 bg-red-50';
      case 'plateau': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getSignificanceBadge = (significance: string) => {
    switch (significance) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getDetectionSourceBadge = (sources: string[]) => {
    if (sources.includes('cross_validation')) {
      return { variant: 'default' as const, text: 'Cross-Validated', color: 'bg-purple-100 text-purple-800' };
    } else if (sources.length > 1) {
      return { variant: 'secondary' as const, text: 'Multi-Engine', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { variant: 'outline' as const, text: sources[0] || 'Single Engine', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Filter patterns
  const filteredPatterns = patterns.filter(pattern => {
    const typeMatch = typeFilter === 'all' || pattern.type === typeFilter;
    const significanceMatch = significanceFilter === 'all' || pattern.significance === significanceFilter;
    return typeMatch && significanceMatch;
  });

  // Statistics
  const stats = {
    total: patterns.length,
    highSignificance: patterns.filter(p => p.significance === 'high').length,
    correlations: patterns.filter(p => p.type === 'correlation').length,
    crossValidated: patterns.filter(p => p.detectedBy.includes('cross_validation')).length,
    avgStrength: patterns.length > 0 
      ? Math.round((patterns.reduce((sum, p) => sum + p.strength, 0) / patterns.length) * 100)
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <Brain className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Patterns</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold text-red-600">{stats.highSignificance}</div>
            <div className="text-sm text-gray-600">High Significance</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <Activity className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{stats.correlations}</div>
            <div className="text-sm text-gray-600">Correlations</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <Target className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{stats.crossValidated}</div>
            <div className="text-sm text-gray-600">Cross-Validated</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <Zap className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-orange-600">{stats.avgStrength}%</div>
            <div className="text-sm text-gray-600">Avg Strength</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Pattern Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as PatternTypeFilter)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">All Types</option>
                  <option value="correlation">Correlation</option>
                  <option value="cycle">Cyclical</option>
                  <option value="threshold">Threshold</option>
                  <option value="acceleration">Acceleration</option>
                  <option value="plateau">Plateau</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Significance:</span>
                <select
                  value={significanceFilter}
                  onChange={(e) => setSignificanceFilter(e.target.value as SignificanceFilter)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">All Levels</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredPatterns.length} of {patterns.length} patterns
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pattern List */}
      <div className="space-y-4">
        {filteredPatterns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Patterns Found</h3>
              <p className="text-gray-600">
                {patterns.length === 0 
                  ? 'No patterns have been detected yet. The AI needs more data points to identify meaningful patterns.'
                  : `No patterns match the current filters. Try adjusting the filter criteria.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPatterns.map((pattern, index) => {
            const patternId = `${pattern.type}-${index}`;
            const isSelected = selectedPattern === patternId;
            const detectionBadge = getDetectionSourceBadge(pattern.detectedBy);
            
            return (
              <Card 
                key={patternId}
                className={`border-l-4 cursor-pointer transition-all ${getPatternColor(pattern.type)} ${
                  isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedPattern(isSelected ? null : patternId)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getPatternIcon(pattern.type)}
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {pattern.type} Pattern
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getSignificanceBadge(pattern.significance) as any}>
                            {pattern.significance.toUpperCase()} SIGNIFICANCE
                          </Badge>
                          <Badge className={detectionBadge.color}>
                            {detectionBadge.text}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {Math.round(pattern.strength * 100)}%
                      </div>
                      <div className="text-sm text-gray-500">Pattern Strength</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Progress value={pattern.strength * 100} className="h-3 mb-2" />
                    <p className="text-sm text-gray-700 mb-2">{pattern.description}</p>
                    <p className="text-xs text-gray-600">{pattern.clinical_relevance}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span>Metrics: {pattern.metrics.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Brain className="h-3 w-3" />
                        <span>Detected by: {pattern.detectedBy.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isSelected && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pattern Analysis */}
                        <div>
                          <h4 className="font-medium text-gray-800 mb-3">Pattern Analysis</h4>
                          <div className="space-y-3">
                            <div className="p-3 bg-white rounded-lg border">
                              <div className="text-sm font-medium text-gray-700 mb-1">Pattern Type</div>
                              <div className="text-sm text-gray-600 capitalize">{pattern.type}</div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border">
                              <div className="text-sm font-medium text-gray-700 mb-1">Strength</div>
                              <div className="flex items-center gap-2">
                                <Progress value={pattern.strength * 100} className="h-2 flex-1" />
                                <span className="text-sm text-gray-600">{Math.round(pattern.strength * 100)}%</span>
                              </div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border">
                              <div className="text-sm font-medium text-gray-700 mb-1">Clinical Significance</div>
                              <Badge variant={getSignificanceBadge(pattern.significance) as any}>
                                {pattern.significance.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                          <h4 className="font-medium text-gray-800 mb-3">AI Recommendations</h4>
                          <div className="space-y-2">
                            {pattern.recommendations && pattern.recommendations.length > 0 ? (
                              pattern.recommendations.map((rec, i) => (
                                <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="flex items-start gap-2">
                                    <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <span className="text-sm text-blue-800">{rec}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 bg-gray-50 rounded-lg border">
                                <div className="text-sm text-gray-600">
                                  Continue monitoring this pattern for changes
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Affected Metrics */}
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-800 mb-3">Affected Metrics</h4>
                        <div className="flex flex-wrap gap-2">
                          {pattern.metrics.map((metric, i) => (
                            <Badge key={i} variant="outline" className="bg-white">
                              {metric}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Detection Sources */}
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-800 mb-3">Detection Sources</h4>
                        <div className="flex flex-wrap gap-2">
                          {pattern.detectedBy.map((source, i) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className={
                                source === 'cross_validation' 
                                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {source.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pattern Intelligence Summary */}
      {filteredPatterns.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">Pattern Intelligence Summary</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Key Findings</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {stats.total} patterns detected across multiple metrics</li>
                  <li>• {stats.highSignificance} patterns have high clinical significance</li>
                  <li>• {stats.crossValidated} patterns cross-validated by multiple engines</li>
                  <li>• Average pattern strength: {stats.avgStrength}%</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Clinical Insights</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Focus on high-significance patterns first</li>
                  <li>• Monitor cross-validated patterns closely</li>
                  <li>• Consider correlations for treatment planning</li>
                  <li>• Discuss unusual patterns with healthcare provider</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}