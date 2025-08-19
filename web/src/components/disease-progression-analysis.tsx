'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  Activity, 
  Heart, 
  Brain, 
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Lightbulb,
  Star,
  Shield,
  ArrowRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface DiseaseProgressionData {
  reportFiles: any[];
  extractedMetrics: any[];
  imagingReports: any[];
}

interface ProgressionInsight {
  type: 'positive' | 'concern' | 'neutral' | 'milestone';
  title: string;
  description: string;
  icon: React.ReactNode;
  data?: any;
  recommendation?: string;
}

interface TimelineEvent {
  date: Date;
  type: 'diagnosis' | 'improvement' | 'concern' | 'milestone' | 'imaging';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  metrics?: any[];
}

export default function DiseaseProgressionAnalysis({ data }: { data: DiseaseProgressionData }) {
  const [isClient, setIsClient] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'3m' | '6m' | '1y' | 'all'>('1y');

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate disease timeline and progression
  const progressionAnalysis = useMemo(() => {
    if (!data || !data.extractedMetrics?.length) {
      return {
        timelineEvents: [],
        managementScore: 0,
        diseaseDuration: 0,
        insights: [],
        trends: {},
        overallAssessment: 'insufficient-data'
      };
    }

    const sortedMetrics = [...data.extractedMetrics].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const firstReport = sortedMetrics[0];
    const latestReport = sortedMetrics[sortedMetrics.length - 1];
    const diseaseDuration = firstReport ? 
      Math.ceil((new Date().getTime() - new Date(firstReport.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;

    // Group metrics by type for trend analysis
    const metricsByType = sortedMetrics.reduce((acc, metric) => {
      const type = metric.metricType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(metric);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate trends for key liver markers
    const calculateTrend = (metrics: any[]) => {
      if (metrics.length < 2) return 'stable';
      const recent = metrics.slice(-3);
      const earlier = metrics.slice(0, Math.max(1, metrics.length - 3));
      
      const recentAvg = recent.reduce((sum, m) => sum + parseFloat(m.numericValue || 0), 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, m) => sum + parseFloat(m.numericValue || 0), 0) / earlier.length;
      
      const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
      
      if (Math.abs(change) < 5) return 'stable';
      return change > 0 ? 'increasing' : 'decreasing';
    };

    // Analyze key liver function markers
    const trends = {
      alt: calculateTrend(metricsByType['ALT'] || []),
      ast: calculateTrend(metricsByType['AST'] || []),
      bilirubin: calculateTrend(metricsByType['Total Bilirubin'] || []),
      albumin: calculateTrend(metricsByType['Albumin'] || []),
      platelets: calculateTrend(metricsByType['Platelets'] || []),
      inr: calculateTrend(metricsByType['INR'] || []),
      creatinine: calculateTrend(metricsByType['Creatinine'] || [])
    };

    // Generate timeline events
    const timelineEvents: TimelineEvent[] = [];

    // First diagnosis event
    if (firstReport) {
      timelineEvents.push({
        date: new Date(firstReport.createdAt),
        type: 'diagnosis',
        title: 'Initial Assessment',
        description: 'First comprehensive liver function evaluation',
        severity: 'medium'
      });
    }

    // Add significant changes as events
    Object.entries(metricsByType).forEach(([type, metrics]) => {
      const typedMetrics = metrics as any[];
      if (typedMetrics.length >= 2) {
        const trend = calculateTrend(typedMetrics);
        const latest = typedMetrics[typedMetrics.length - 1];
        
        if (trend === 'decreasing' && ['ALT', 'AST', 'Total Bilirubin'].includes(type)) {
          timelineEvents.push({
            date: new Date(latest.createdAt),
            type: 'improvement',
            title: `${type} Improvement`,
            description: `${type} levels showing positive trend`,
            severity: 'low',
            metrics: [latest]
          });
        } else if (trend === 'increasing' && ['ALT', 'AST', 'Total Bilirubin'].includes(type)) {
          timelineEvents.push({
            date: new Date(latest.createdAt),
            type: 'concern',
            title: `${type} Elevation`,
            description: `${type} levels requiring attention`,
            severity: 'high',
            metrics: [latest]
          });
        }
      }
    });

    // Add imaging events
    data.imagingReports?.forEach(report => {
      timelineEvents.push({
        date: new Date(report.createdAt),
        type: 'imaging',
        title: `${report.reportType || 'Imaging'} Study`,
        description: `Advanced imaging assessment performed`,
        severity: 'medium'
      });
    });

    // Calculate management score (0-100)
    let managementScore = 60; // Base score

    // Positive factors
    if (trends.alt === 'decreasing' || trends.alt === 'stable') managementScore += 10;
    if (trends.ast === 'decreasing' || trends.ast === 'stable') managementScore += 10;
    if (trends.bilirubin === 'decreasing' || trends.bilirubin === 'stable') managementScore += 8;
    if (trends.albumin === 'increasing' || trends.albumin === 'stable') managementScore += 7;
    if (trends.platelets === 'increasing' || trends.platelets === 'stable') managementScore += 5;

    // Consistency bonus (regular monitoring)
    const monthsWithData = new Set(sortedMetrics.map(m => 
      new Date(m.createdAt).toISOString().slice(0, 7)
    )).size;
    if (monthsWithData >= 6) managementScore += 10;
    if (monthsWithData >= 12) managementScore += 5;

    managementScore = Math.min(100, Math.max(0, managementScore));

    // Generate insights
    const insights: ProgressionInsight[] = [];

    // Positive insights
    if (managementScore >= 80) {
      insights.push({
        type: 'positive',
        title: 'Excellent Disease Management',
        description: `You've been managing your liver health exceptionally well for ${diseaseDuration} months. Your consistent monitoring and stable/improving markers show dedication to your health.`,
        icon: <Award className="h-5 w-5" />,
        recommendation: 'Continue your current management approach and maintain regular monitoring.'
      });
    }

    if (trends.alt === 'decreasing' && trends.ast === 'decreasing') {
      insights.push({
        type: 'positive',
        title: 'Liver Enzymes Improving',
        description: 'Both ALT and AST levels are trending downward, indicating reduced liver inflammation.',
        icon: <TrendingDown className="h-5 w-5 text-green-500" />,
        recommendation: 'Maintain current lifestyle and treatment regimen.'
      });
    }

    if (monthsWithData >= 6) {
      insights.push({
        type: 'milestone',
        title: 'Consistent Monitoring Achieved',
        description: `You've maintained regular health monitoring for ${monthsWithData} months, which is crucial for effective disease management.`,
        icon: <CheckCircle2 className="h-5 w-5" />
      });
    }

    // Areas for improvement
    if (trends.bilirubin === 'increasing') {
      insights.push({
        type: 'concern',
        title: 'Bilirubin Levels Rising',
        description: 'Recent bilirubin trends require attention and possible treatment adjustment.',
        icon: <AlertTriangle className="h-5 w-5" />,
        recommendation: 'Consult with your hepatologist about recent bilirubin elevation.'
      });
    }

    if (trends.albumin === 'decreasing') {
      insights.push({
        type: 'concern',
        title: 'Albumin Levels Declining',
        description: 'Decreasing albumin may indicate reduced liver synthetic function.',
        icon: <TrendingDown className="h-5 w-5 text-orange-500" />,
        recommendation: 'Focus on adequate protein intake and discuss with your care team.'
      });
    }

    // Overall assessment
    let overallAssessment = 'stable';
    if (managementScore >= 85) overallAssessment = 'excellent';
    else if (managementScore >= 70) overallAssessment = 'good';
    else if (managementScore >= 50) overallAssessment = 'needs-attention';
    else overallAssessment = 'concerning';

    return {
      timelineEvents: timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime()),
      managementScore,
      diseaseDuration,
      insights,
      trends,
      overallAssessment
    };
  }, [data]);

  // Generate progression chart data
  const progressionChartData = useMemo(() => {
    if (!data?.extractedMetrics?.length) return [];

    const keyMetrics = ['ALT', 'AST', 'Total Bilirubin', 'Albumin'];
    const metricsByDate = data.extractedMetrics.reduce((acc, metric) => {
      const date = new Date(metric.createdAt).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = {};
      if (keyMetrics.includes(metric.metricType)) {
        acc[date][metric.metricType] = parseFloat(metric.numericValue || 0);
      }
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return Object.entries(metricsByDate)
      .map(([date, metrics]) => {
        const typedMetrics = metrics as Record<string, number>;
        return {
          date,
          ...typedMetrics,
          healthScore: Object.keys(typedMetrics).length > 0 ? 
            Math.max(0, 100 - (Object.values(typedMetrics).reduce((sum, val) => sum + (val > 40 ? val - 40 : 0), 0) / Object.keys(typedMetrics).length)) : 0
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
          <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
          <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
        </div>
        <div className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Disease Duration */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Disease Duration</p>
                <p className="text-3xl font-bold text-blue-900">
                  {progressionAnalysis.diseaseDuration > 0 ? `${progressionAnalysis.diseaseDuration}mo` : 'New'}
                </p>
                <p className="text-sm text-blue-700">
                  {progressionAnalysis.diseaseDuration > 12 ? 'Long-term management' : 'Recent diagnosis'}
                </p>
              </div>
              <Clock className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Management Score */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-green-600 mb-1">Management Score</p>
                <p className="text-3xl font-bold text-green-900 mb-2">
                  {progressionAnalysis.managementScore}/100
                </p>
                <Progress 
                  value={progressionAnalysis.managementScore} 
                  className="h-2 mb-1"
                />
                <p className="text-sm text-green-700 capitalize">
                  {progressionAnalysis.overallAssessment.replace('-', ' ')}
                </p>
              </div>
              <div className="ml-4">
                {progressionAnalysis.managementScore >= 80 ? (
                  <Award className="h-12 w-12 text-green-500" />
                ) : progressionAnalysis.managementScore >= 60 ? (
                  <Target className="h-12 w-12 text-green-500" />
                ) : (
                  <AlertTriangle className="h-12 w-12 text-orange-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Recent Activity</p>
                <p className="text-3xl font-bold text-purple-900">
                  {progressionAnalysis.timelineEvents.length}
                </p>
                <p className="text-sm text-purple-700">Total health events</p>
              </div>
              <Activity className="h-12 w-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progression Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Health Progression Over Time
          </CardTitle>
          <div className="flex gap-2">
            {(['3m', '6m', '1y', 'all'] as const).map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe)}
              >
                {timeframe === 'all' ? 'All Time' : timeframe.toUpperCase()}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                />
                <Area 
                  type="monotone" 
                  dataKey="healthScore" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                  name="Health Score"
                />
                <Line type="monotone" dataKey="ALT" stroke="#ff7300" name="ALT" />
                <Line type="monotone" dataKey="AST" stroke="#00ff00" name="AST" />
                <Line type="monotone" dataKey="Total Bilirubin" stroke="#ff0000" name="Bilirubin" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Health Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {progressionAnalysis.timelineEvents.slice(0, 10).map((event, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    event.type === 'improvement' ? 'bg-green-100 text-green-600' :
                    event.type === 'concern' ? 'bg-red-100 text-red-600' :
                    event.type === 'milestone' ? 'bg-blue-100 text-blue-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {event.type === 'improvement' ? <TrendingUp className="h-4 w-4" /> :
                     event.type === 'concern' ? <AlertTriangle className="h-4 w-4" /> :
                     event.type === 'milestone' ? <Star className="h-4 w-4" /> :
                     <Activity className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <Badge variant={
                        event.severity === 'high' ? 'destructive' :
                        event.severity === 'medium' ? 'default' : 'secondary'
                      }>
                        {event.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {event.date.toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Personalized Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {progressionAnalysis.insights.map((insight, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'positive' ? 'bg-green-50 border-green-400' :
                  insight.type === 'concern' ? 'bg-red-50 border-red-400' :
                  insight.type === 'milestone' ? 'bg-blue-50 border-blue-400' :
                  'bg-gray-50 border-gray-400'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-1 rounded ${
                      insight.type === 'positive' ? 'text-green-600' :
                      insight.type === 'concern' ? 'text-red-600' :
                      insight.type === 'milestone' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {insight.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                      {insight.recommendation && (
                        <div className="bg-white/50 p-2 rounded text-sm">
                          <div className="flex items-center gap-2 text-blue-600">
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-medium">Recommendation:</span>
                          </div>
                          <p className="text-gray-700 mt-1">{insight.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Encouragement Section */}
      {progressionAnalysis.managementScore >= 70 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-900 mb-2">Excellent Progress! 🎉</h3>
                <p className="text-green-800 mb-3">
                  You've been managing your liver health exceptionally well for <strong>{progressionAnalysis.diseaseDuration} months</strong>. 
                  Your consistent monitoring and stable markers demonstrate real commitment to your health journey.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Consistent Monitoring ✓
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Stable Trends ✓
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    Proactive Management ✓
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
