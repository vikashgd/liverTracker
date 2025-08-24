"use client";

import { useState, useEffect } from 'react';
import { ImagingDashboard } from './imaging-dashboard';

interface ImagingLabCorrelation {
  imagingDate: string;
  organSize: number;
  organUnit: string;
  labValues: Array<{
    metric: string;
    value: number;
    unit: string;
    status: 'normal' | 'abnormal' | 'borderline';
  }>;
  correlation: {
    liverEnzymes: 'elevated' | 'normal' | 'improving';
    syntheticFunction: 'impaired' | 'normal' | 'improving';
    overallTrend: 'concerning' | 'stable' | 'improving';
  };
}

interface EnhancedImagingDashboardProps {
  userId: string;
}

export function EnhancedImagingDashboard({ userId }: EnhancedImagingDashboardProps) {
  const [correlations, setCorrelations] = useState<ImagingLabCorrelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'3m' | '6m' | '1y' | 'all'>('6m');

  useEffect(() => {
    loadImagingLabCorrelations();
  }, [userId, selectedTimeframe]);

  const loadImagingLabCorrelations = async () => {
    try {
      setLoading(true);
      
      // Load correlations from API
      const response = await fetch(`/api/imaging-correlations?timeframe=${selectedTimeframe}`);
      
      if (!response.ok) {
        console.warn('Failed to load correlations:', response.status, response.statusText);
        setCorrelations([]);
        return;
      }
      
      const data = await response.json();
      setCorrelations(data.correlations || []);

    } catch (error) {
      console.error('Failed to load imaging-lab correlations:', error);
      setCorrelations([]);
    } finally {
      setLoading(false);
    }
  };

  const getCorrelationColor = (trend: string) => {
    switch (trend) {
      case 'concerning': return 'bg-red-50 border-red-200 text-red-800';
      case 'stable': return 'bg-green-50 border-green-200 text-green-800';
      case 'improving': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return '✅';
      case 'borderline': return '⚠️';
      case 'abnormal': return '🔴';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-8">
      {/* Standard Imaging Dashboard */}
      <ImagingDashboard userId={userId} />

      {/* Enhanced Imaging-Lab Correlations */}
      {correlations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="mr-3">🔗</span>
                Imaging-Lab Correlations
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Liver size measurements correlated with nearby lab values
              </p>
            </div>
            
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="1y">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {correlations.map((correlation, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">🏥</span>
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {new Date(correlation.imagingDate).toLocaleDateString()}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Liver size: {correlation.organSize} {correlation.organUnit}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getCorrelationColor(correlation.correlation.overallTrend)}`}>
                      {correlation.correlation.overallTrend.toUpperCase()}
                    </div>
                  </div>

                  {/* Lab Values */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    {correlation.labValues.map((lab, labIndex) => (
                      <div key={labIndex} className="bg-gray-50 rounded p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {lab.metric}
                          </span>
                          <span className="text-lg">
                            {getStatusIcon(lab.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {lab.value} {lab.unit}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Correlation Analysis */}
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <h5 className="text-sm font-medium text-blue-800 mb-2">
                      Clinical Correlation
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-700">
                      <div>
                        <span className="font-medium">Liver Enzymes:</span>
                        <span className="ml-2 capitalize">{correlation.correlation.liverEnzymes}</span>
                      </div>
                      <div>
                        <span className="font-medium">Synthetic Function:</span>
                        <span className="ml-2 capitalize">{correlation.correlation.syntheticFunction}</span>
                      </div>
                      <div>
                        <span className="font-medium">Overall Trend:</span>
                        <span className="ml-2 capitalize">{correlation.correlation.overallTrend}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clinical Insights */}
      {correlations.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
            <span className="mr-3">🧠</span>
            Clinical Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-purple-800 mb-2">Correlation Patterns</h4>
              <div className="space-y-2 text-sm text-purple-700">
                <div className="flex justify-between">
                  <span>Concerning trends:</span>
                  <span className="font-medium">
                    {correlations.filter(c => c.correlation.overallTrend === 'concerning').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Stable patterns:</span>
                  <span className="font-medium">
                    {correlations.filter(c => c.correlation.overallTrend === 'stable').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Improving trends:</span>
                  <span className="font-medium">
                    {correlations.filter(c => c.correlation.overallTrend === 'improving').length}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-purple-800 mb-2">Recommendations</h4>
              <div className="space-y-1 text-sm text-purple-700">
                {correlations.some(c => c.correlation.overallTrend === 'concerning') && (
                  <p>• Consider more frequent monitoring for concerning trends</p>
                )}
                {correlations.some(c => c.correlation.liverEnzymes === 'elevated') && (
                  <p>• Elevated liver enzymes warrant clinical attention</p>
                )}
                {correlations.some(c => c.correlation.syntheticFunction === 'impaired') && (
                  <p>• Impaired synthetic function may indicate progression</p>
                )}
                {correlations.every(c => c.correlation.overallTrend === 'stable') && (
                  <p>• Current monitoring frequency appears appropriate</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-yellow-600 text-lg">⚠️</span>
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Medical Disclaimer</p>
            <p>
              Imaging-lab correlations are for informational purposes only. Clinical interpretation 
              should always be performed by qualified healthcare professionals considering the complete 
              clinical context, patient history, and other relevant factors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}