"use client";

import { useState, useEffect } from 'react';

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
              <div className="h-48 relative">
                <svg className="w-full h-full">
                  <defs>
                    <linearGradient id="sizeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.3 }} />
                      <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.1 }} />
                    </linearGradient>
                  </defs>
                  
                  {/* Trend line */}
                  <path
                    d={selectedOrganTrend.data.map((point, index) => {
                      const x = (index / (selectedOrganTrend.data.length - 1)) * 100;
                      const maxSize = Math.max(...selectedOrganTrend.data.map(p => p.size));
                      const minSize = Math.min(...selectedOrganTrend.data.map(p => p.size));
                      const y = 100 - ((point.size - minSize) / (maxSize - minSize)) * 80;
                      return `${index === 0 ? 'M' : 'L'} ${x}% ${Math.max(10, Math.min(90, y))}%`;
                    }).join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  
                  {/* Data points */}
                  {selectedOrganTrend.data.map((point, index) => {
                    const x = (index / (selectedOrganTrend.data.length - 1)) * 100;
                    const maxSize = Math.max(...selectedOrganTrend.data.map(p => p.size));
                    const minSize = Math.min(...selectedOrganTrend.data.map(p => p.size));
                    const y = 100 - ((point.size - minSize) / (maxSize - minSize)) * 80;
                    return (
                      <circle
                        key={index}
                        cx={`${x}%`}
                        cy={`${Math.max(10, Math.min(90, y))}%`}
                        r="4"
                        fill="#10b981"
                        stroke="white"
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>
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

      {/* Recent Findings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Recent Findings</h3>
        
        {recentFindings.length > 0 ? (
          <div className="space-y-4">
            {/* Findings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 font-bold text-lg">{categorizedFindings.normal.length}</span>
                  <span className="text-sm text-green-800">Normal Findings</span>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600 font-bold text-lg">{categorizedFindings.mild.length}</span>
                  <span className="text-sm text-yellow-800">Mild Findings</span>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600 font-bold text-lg">{categorizedFindings.concerning.length}</span>
                  <span className="text-sm text-red-800">Concerning Findings</span>
                </div>
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-2">
              {recentFindings.map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                  <span className="text-lg">{getModalityIcon(item.modality)}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{item.finding}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${getModalityColor(item.modality)}`}>
                        {item.modality || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl">🔍</span>
            <p className="mt-2">No findings extracted from imaging reports yet</p>
          </div>
        )}
      </div>

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
                        {report.findings.slice(0, 3).map((finding, findIndex) => (
                          <p key={findIndex} className="text-xs text-gray-700">• {finding}</p>
                        ))}
                        {report.findings.length > 3 && (
                          <p className="text-xs text-gray-500">... and {report.findings.length - 3} more</p>
                        )}
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


