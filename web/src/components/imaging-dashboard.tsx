"use client";

import { useState, useEffect } from 'react';
import { TrendChart, type SeriesPoint } from './trend-chart';

interface ImagingReport {
  id: string;
  date: string;
  reportType: string;
  modality: string | null;
  organs: Array<{
    name: string;
    size?: { value: number; unit: string } | null;
    notes?: string | null;
  }>;
  findings: string[];
}

interface ImagingDashboardProps {
  userId?: string;
}

export function ImagingDashboard({ userId }: ImagingDashboardProps) {
  const [imagingReports, setImagingReports] = useState<ImagingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgan, setSelectedOrgan] = useState<string>('Liver');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadImagingReports();
  }, [userId]);

  const loadImagingReports = async () => {
    try {
      const response = await fetch('/api/imaging-reports');
      if (response.ok) {
        const data = await response.json();
        setImagingReports(data.reports || []);
      }
    } catch (error) {
      console.error('Failed to load imaging reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModalityIcon = (modality: string | null) => {
    switch (modality?.toLowerCase()) {
      case 'ultrasound': return '🔊';
      case 'ct': return '💾';
      case 'mri': return '🧲';
      default: return '🏥';
    }
  };

  const getModalityColor = (modality: string | null) => {
    switch (modality?.toLowerCase()) {
      case 'ultrasound': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'ct': return 'bg-green-50 border-green-200 text-green-800';
      case 'mri': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getOrganTrend = (organName: string) => {
    const organData = imagingReports
      .filter(report => report.organs.some(organ => organ.name === organName && organ.size?.value))
      .map(report => ({
        date: report.date,
        size: report.organs.find(organ => organ.name === organName)?.size?.value || 0,
        unit: report.organs.find(organ => organ.name === organName)?.size?.unit || 'cm'
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (organData.length < 2) return null;

    const trend = organData[organData.length - 1].size - organData[0].size;
    return {
      direction: trend > 0.5 ? 'increasing' : trend < -0.5 ? 'decreasing' : 'stable',
      change: Math.abs(trend),
      data: organData
    };
  };

  const getUniqueOrgans = () => {
    const organs = new Set<string>();
    imagingReports.forEach(report => {
      report.organs.forEach(organ => organs.add(organ.name));
    });
    return Array.from(organs).sort();
  };

  const getRecentFindings = () => {
    const allFindings: Array<{ finding: string; date: string; modality: string | null }> = [];
    
    imagingReports.forEach(report => {
      report.findings.forEach(finding => {
        allFindings.push({
          finding,
          date: report.date,
          modality: report.modality
        });
      });
    });
    
    return allFindings
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  const categorizeFindings = (findings: string[]) => {
    const categories = {
      normal: [] as string[],
      mild: [] as string[],
      concerning: [] as string[]
    };

    findings.forEach(finding => {
      const lower = finding.toLowerCase();
      if (lower.includes('normal') || lower.includes('unremarkable') || lower.includes('no abnormalities')) {
        categories.normal.push(finding);
      } else if (lower.includes('mild') || lower.includes('slight') || lower.includes('minimal')) {
        categories.mild.push(finding);
      } else if (lower.includes('moderate') || lower.includes('severe') || lower.includes('enlarged') || 
                 lower.includes('lesion') || lower.includes('mass') || lower.includes('concerning')) {
        categories.concerning.push(finding);
      } else {
        categories.mild.push(finding); // Default to mild for uncertain findings
      }
    });

    return categories;
  };

  if (!isClient || loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (imagingReports.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <span className="text-6xl">🏥</span>
        <h3 className="text-xl font-semibold text-gray-800 mt-4">No Imaging Reports</h3>
        <p className="text-gray-600 mt-2 max-w-md mx-auto">
          Upload CT scans, ultrasound reports, or MRI results to see imaging trends and analysis here.
        </p>
        <div className="mt-6 space-y-2 text-sm text-gray-500">
          <p>📊 Track organ size changes over time</p>
          <p>🔍 Monitor findings and progression</p>
          <p>📈 Correlate with lab value trends</p>
        </div>
      </div>
    );
  }

  const uniqueOrgans = getUniqueOrgans();
  const selectedOrganTrend = getOrganTrend(selectedOrgan);
  const recentFindings = getRecentFindings();
  const categorizedFindings = categorizeFindings(recentFindings.map(f => f.finding));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🏥 Imaging Analysis</h2>
        <p className="text-teal-100">
          CT scans, ultrasounds, and MRI report trends
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📊</span>
            <div>
              <div className="text-2xl font-bold text-gray-800">{imagingReports.length}</div>
              <div className="text-sm text-gray-600">Total Reports</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔊</span>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {imagingReports.filter(r => r.modality?.toLowerCase() === 'ultrasound').length}
              </div>
              <div className="text-sm text-gray-600">Ultrasounds</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">💾</span>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {imagingReports.filter(r => r.modality?.toLowerCase() === 'ct').length}
              </div>
              <div className="text-sm text-gray-600">CT Scans</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">👁️</span>
            <div>
              <div className="text-2xl font-bold text-purple-600">{uniqueOrgans.length}</div>
              <div className="text-sm text-gray-600">Organs Tracked</div>
            </div>
          </div>
        </div>
      </div>

      {/* Organ Size Trends */}
      {uniqueOrgans.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">📏 Organ Size Trends</h3>
            <select
              value={selectedOrgan}
              onChange={(e) => setSelectedOrgan(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              {uniqueOrgans.map(organ => (
                <option key={organ} value={organ}>{organ}</option>
              ))}
            </select>
          </div>

          {selectedOrganTrend ? (
            <div className="space-y-4">
              {/* Trend Summary */}
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
                <span className="text-2xl">
                  {selectedOrganTrend.direction === 'increasing' ? '📈' : 
                   selectedOrganTrend.direction === 'decreasing' ? '📉' : '📊'}
                </span>
                <div>
                  <div className="font-medium text-gray-800">
                    {selectedOrgan} Size: {selectedOrganTrend.direction.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Change: {selectedOrganTrend.change.toFixed(1)} {selectedOrganTrend.data[0]?.unit} over {selectedOrganTrend.data.length} measurements
                  </div>
                </div>
              </div>

              {/* Size Chart */}
              <div className="h-64 relative bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-6">
                <div className="h-full">
                  {/* Chart Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-gray-800">{selectedOrgan} Size Trend</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">{selectedOrganTrend.data[0]?.unit || 'cm'}</span>
                    </div>
                  </div>
                  
                  {/* Custom Wide Chart */}
                  <div className="h-40 relative">
                    <svg className="w-full h-full" viewBox="0 0 800 160">
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
                          <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      {[0, 1, 2, 3, 4].map(i => (
                        <line
                          key={i}
                          x1="60"
                          y1={20 + (i * 30)}
                          x2="740"
                          y2={20 + (i * 30)}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                          opacity="0.5"
                        />
                      ))}
                      
                      {/* Y-axis */}
                      <line x1="60" y1="20" x2="60" y2="140" stroke="#d1d5db" strokeWidth="2"/>
                      
                      {/* X-axis */}
                      <line x1="60" y1="140" x2="740" y2="140" stroke="#d1d5db" strokeWidth="2"/>
                      
                      {/* Data Line and Points */}
                      {(() => {
                        const data = selectedOrganTrend.data;
                        const maxSize = Math.max(...data.map(p => p.size));
                        const minSize = Math.min(...data.map(p => p.size));
                        const range = maxSize - minSize || 1;
                        const padding = range * 0.1;
                        const adjustedMax = maxSize + padding;
                        const adjustedMin = minSize - padding;
                        const adjustedRange = adjustedMax - adjustedMin;
                        
                        const points = data.map((point, index) => {
                          const x = 60 + ((index / (data.length - 1)) * 680);
                          const y = 140 - (((point.size - adjustedMin) / adjustedRange) * 120);
                          return { x, y, size: point.size, date: point.date };
                        });
                        
                        // Create path for line
                        const pathData = points.map((point, index) => 
                          `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                        ).join(' ');
                        
                        return (
                          <g>
                            {/* Trend Line */}
                            <path
                              d={pathData}
                              fill="none"
                              stroke="url(#lineGradient)"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            
                            {/* Data Points */}
                            {points.map((point, index) => (
                              <g key={index}>
                                <circle
                                  cx={point.x}
                                  cy={point.y}
                                  r="6"
                                  fill="#10b981"
                                  stroke="white"
                                  strokeWidth="3"
                                  className="hover:r-8 transition-all duration-200 cursor-pointer"
                                />
                                
                                {/* Value Labels */}
                                <text
                                  x={point.x}
                                  y={point.y - 15}
                                  textAnchor="middle"
                                  fontSize="12"
                                  fontWeight="600"
                                  fill="#059669"
                                >
                                  {point.size}
                                </text>
                                
                                {/* Date Labels */}
                                <text
                                  x={point.x}
                                  y="155"
                                  textAnchor="middle"
                                  fontSize="11"
                                  fill="#6b7280"
                                >
                                  {new Date(point.date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric'
                                  })}
                                </text>
                              </g>
                            ))}
                            
                            {/* Y-axis Labels */}
                            {[adjustedMin, (adjustedMin + adjustedMax) / 2, adjustedMax].map((value, index) => (
                              <text
                                key={index}
                                x="50"
                                y={140 - (index * 60) + 5}
                                textAnchor="end"
                                fontSize="11"
                                fill="#6b7280"
                              >
                                {value.toFixed(1)}
                              </text>
                            ))}
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              </div>

              {/* Size Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Size</th>
                      <th className="px-3 py-2 text-left">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrganTrend.data.map((point, index) => {
                      const prevSize = index > 0 ? selectedOrganTrend.data[index - 1].size : null;
                      const change = prevSize ? point.size - prevSize : 0;
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            {new Date(point.date).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 font-medium">
                            {point.size.toFixed(1)} {point.unit}
                          </td>
                          <td className="px-3 py-2">
                            {index > 0 ? (
                              <span className={`flex items-center ${
                                change > 0.2 ? 'text-red-600' : 
                                change < -0.2 ? 'text-green-600' : 'text-gray-600'
                              }`}>
                                {change > 0.2 ? '↗' : change < -0.2 ? '↘' : '→'}
                                <span className="ml-1">
                                  {change > 0 ? '+' : ''}{change.toFixed(1)} {point.unit}
                                </span>
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl">📏</span>
              <p className="mt-2">No size measurements available for {selectedOrgan}</p>
            </div>
          )}
        </div>
      )}



      {/* Report Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Report Timeline</h3>
        
        <div className="space-y-4">
          {imagingReports
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)
            .map((report, index) => (
              <div key={report.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                <span className="text-2xl">{getModalityIcon(report.modality)}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-800">{report.reportType || 'Imaging Report'}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getModalityColor(report.modality)}`}>
                      {report.modality || 'Unknown'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {new Date(report.date).toLocaleDateString()}
                  </div>
                  
                  {/* Organs */}
                  {report.organs.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-500 mb-1">Organs examined:</div>
                      <div className="flex flex-wrap gap-1">
                        {report.organs.map((organ, orgIndex) => (
                          <span
                            key={orgIndex}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                          >
                            {organ.name}
                            {organ.size && ` (${organ.size.value} ${organ.size.unit})`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Findings */}
                  {report.findings.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Key findings:</div>
                      <div className="space-y-1">
                        {report.findings.map((finding, findIndex) => (
                          <p key={findIndex} className="text-xs text-gray-700">• {finding}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}


