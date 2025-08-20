'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TimelineEvent {
  id: string;
  date: string;
  type: 'lab' | 'imaging' | 'clinical' | 'medication' | 'procedure' | 'milestone';
  title: string;
  description: string;
  value?: string | number;
  trend?: 'improving' | 'stable' | 'concerning';
  category: string;
  importance: 'high' | 'medium' | 'low';
  relatedFiles?: string[];
}

interface GroupedTimeline {
  [period: string]: TimelineEvent[];
}

export function EnhancedTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [groupBy, setGroupBy] = useState<'month' | 'quarter' | 'year'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [showTrends, setShowTrends] = useState(true);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockEvents: TimelineEvent[] = [
      {
        id: '1',
        date: '2024-01-15',
        type: 'lab',
        title: 'ALT Level',
        description: 'Liver enzyme test showing improvement',
        value: '35 U/L',
        trend: 'improving',
        category: 'Liver Function',
        importance: 'high',
        relatedFiles: ['Lab_Results_2024_Jan.pdf']
      },
      {
        id: '2',
        date: '2024-01-20',
        type: 'imaging',
        title: 'CT Scan',
        description: 'Liver imaging shows stable condition',
        trend: 'stable',
        category: 'Diagnostic Imaging',
        importance: 'high',
        relatedFiles: ['CT_Scan_Liver_2024.pdf']
      },
      {
        id: '3',
        date: '2024-01-25',
        type: 'clinical',
        title: 'Doctor Visit',
        description: 'Routine follow-up appointment',
        category: 'Medical Consultation',
        importance: 'medium',
        relatedFiles: ['Doctor_Visit_Notes.pdf']
      },
      {
        id: '4',
        date: '2024-02-01',
        type: 'medication',
        title: 'Medication Adjustment',
        description: 'Dosage increased based on latest results',
        category: 'Treatment Plan',
        importance: 'high'
      },
      {
        id: '5',
        date: '2024-02-15',
        type: 'milestone',
        title: '6-Month Progress',
        description: 'Significant improvement in liver function markers',
        trend: 'improving',
        category: 'Health Milestone',
        importance: 'high'
      }
    ];
    setEvents(mockEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const getEventConfig = (type: string) => {
    const configs = {
      lab: {
        color: 'bg-red-50 border-l-red-400',
        icon: '🧪',
        iconBg: 'bg-red-100',
        label: 'Lab Test'
      },
      imaging: {
        color: 'bg-blue-50 border-l-blue-400',
        icon: '🏥',
        iconBg: 'bg-blue-100',
        label: 'Imaging'
      },
      clinical: {
        color: 'bg-green-50 border-l-green-400',
        icon: '👩‍⚕️',
        iconBg: 'bg-green-100',
        label: 'Clinical'
      },
      medication: {
        color: 'bg-yellow-50 border-l-yellow-400',
        icon: '💊',
        iconBg: 'bg-yellow-100',
        label: 'Medication'
      },
      procedure: {
        color: 'bg-purple-50 border-l-purple-400',
        icon: '🏥',
        iconBg: 'bg-purple-100',
        label: 'Procedure'
      },
      milestone: {
        color: 'bg-indigo-50 border-l-indigo-400',
        icon: '🏆',
        iconBg: 'bg-indigo-100',
        label: 'Milestone'
      }
    };
    return configs[type as keyof typeof configs] || configs.clinical;
  };

  const getTrendConfig = (trend?: string) => {
    const configs = {
      improving: { color: 'text-green-600', icon: '📈', label: 'Improving' },
      stable: { color: 'text-blue-600', icon: '➡️', label: 'Stable' },
      concerning: { color: 'text-red-600', icon: '📉', label: 'Concerning' }
    };
    return trend ? configs[trend as keyof typeof configs] : null;
  };

  const groupEventsByPeriod = (events: TimelineEvent[]): GroupedTimeline => {
    return events.reduce((groups: GroupedTimeline, event) => {
      const date = new Date(event.date);
      let period: string;

      switch (groupBy) {
        case 'year':
          period = date.getFullYear().toString();
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          period = `Q${quarter} ${date.getFullYear()}`;
          break;
        case 'month':
        default:
          period = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          break;
      }

      if (!groups[period]) groups[period] = [];
      groups[period].push(event);
      return groups;
    }, {});
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(event => event.type === filterType);

  const groupedEvents = groupEventsByPeriod(filteredEvents);

  const eventTypes = [
    { value: 'all', label: 'All Events', icon: '📋' },
    { value: 'lab', label: 'Lab Tests', icon: '🧪' },
    { value: 'imaging', label: 'Imaging', icon: '🏥' },
    { value: 'clinical', label: 'Clinical', icon: '👩‍⚕️' },
    { value: 'medication', label: 'Medications', icon: '💊' },
    { value: 'milestone', label: 'Milestones', icon: '🏆' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Timeline</h1>
          <p className="text-gray-600">Track your medical journey over time</p>
        </div>
        
        <div className="flex flex-wrap items-center space-x-4">
          {/* Time Period Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Group by:</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            >
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
          </div>

          {/* Trends Toggle */}
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showTrends}
              onChange={(e) => setShowTrends(e.target.checked)}
              className="rounded"
            />
            <span>Show Trends</span>
          </label>
        </div>
      </div>

      {/* Event Type Filters */}
      <div className="flex flex-wrap gap-2">
        {eventTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setFilterType(type.value)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              filterType === type.value
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <span>{type.icon}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(groupedEvents).map(([period, periodEvents]) => (
          <div key={period} className="space-y-4">
            {/* Period Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-2">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900">{period}</h2>
                <Badge className="bg-gray-100 text-gray-600">
                  {periodEvents.length} {periodEvents.length === 1 ? 'event' : 'events'}
                </Badge>
                
                {/* Period Summary */}
                {showTrends && (
                  <div className="flex items-center space-x-2 text-sm">
                    {periodEvents.filter(e => e.trend === 'improving').length > 0 && (
                      <Badge className="bg-green-100 text-green-700">
                        📈 {periodEvents.filter(e => e.trend === 'improving').length} improving
                      </Badge>
                    )}
                    {periodEvents.filter(e => e.trend === 'concerning').length > 0 && (
                      <Badge className="bg-red-100 text-red-700">
                        📉 {periodEvents.filter(e => e.trend === 'concerning').length} concerning
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Events in Period */}
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-6">
                {periodEvents.map((event, index) => {
                  const config = getEventConfig(event.type);
                  const trendConfig = getTrendConfig(event.trend);
                  
                  return (
                    <div key={event.id} className="relative flex items-start space-x-4">
                      {/* Timeline Dot */}
                      <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${config.iconBg} border-4 border-white shadow-sm`}>
                        <span className="text-lg">{config.icon}</span>
                      </div>

                      {/* Event Card */}
                      <div className="flex-1 min-w-0">
                        <Card className={`${config.color} border-l-4 hover:shadow-md transition-shadow`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <CardTitle className="text-base font-medium text-gray-900">
                                    {event.title}
                                  </CardTitle>
                                  <Badge className="bg-white/50 text-gray-600 text-xs">
                                    {config.label}
                                  </Badge>
                                  
                                  {event.importance === 'high' && (
                                    <Badge className="bg-orange-100 text-orange-700 text-xs">
                                      ⭐ Important
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>{formatDate(event.date)}</span>
                                  <span>•</span>
                                  <span>{event.category}</span>
                                  
                                  {trendConfig && showTrends && (
                                    <>
                                      <span>•</span>
                                      <span className={`flex items-center space-x-1 ${trendConfig.color}`}>
                                        <span>{trendConfig.icon}</span>
                                        <span>{trendConfig.label}</span>
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {event.value && (
                                <div className="text-right">
                                  <div className="font-semibold text-gray-900">{event.value}</div>
                                </div>
                              )}
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            <p className="text-gray-700 mb-3">{event.description}</p>
                            
                            {/* Related Files */}
                            {event.relatedFiles && event.relatedFiles.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-700">Related Documents:</span>
                                <div className="flex flex-wrap gap-2">
                                  {event.relatedFiles.map((file) => (
                                    <button
                                      key={file}
                                      className="inline-flex items-center space-x-1 px-2 py-1 bg-white/60 hover:bg-white/80 rounded text-xs text-gray-700 border border-gray-200 transition-colors"
                                    >
                                      <span>📄</span>
                                      <span>{file}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Timeline Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{events.length}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {events.filter(e => e.trend === 'improving').length}
              </div>
              <div className="text-sm text-gray-600">Improving</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {events.filter(e => e.trend === 'stable').length}
              </div>
              <div className="text-sm text-gray-600">Stable</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {events.filter(e => e.trend === 'concerning').length}
              </div>
              <div className="text-sm text-gray-600">Concerning</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
