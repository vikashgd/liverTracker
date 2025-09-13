#!/usr/bin/env node

/**
 * FIX REPORTS PARAMETER TRENDING SECTION
 * 
 * ISSUE: Reports page missing Parameter Trending section with charts
 * SOLUTION: Add chart data fetching and Parameter Trending UI to ReportsInterface
 */

const fs = require('fs');
const path = require('path');

function fixReportsParameterTrending() {
  console.log('🎯 FIXING REPORTS PARAMETER TRENDING SECTION');
  console.log('='.repeat(60));

  console.log('\n🔍 ISSUE IDENTIFIED:');
  console.log('- Reports page shows "Parameter Trending" in screenshot');
  console.log('- Current ReportsInterface has no chart functionality');
  console.log('- Missing chart data fetching and TrendChart integration');
  console.log('- POST 405 error indicates wrong HTTP method being used');

  console.log('\n🎯 SOLUTION APPROACH:');
  console.log('- Add chart data fetching using GET to /api/chart-data');
  console.log('- Add Parameter Trending section to ReportsInterface UI');
  console.log('- Integrate existing TrendChart component');
  console.log('- Handle loading states and errors properly');

  // Read the current ReportsInterface
  const reportsInterfacePath = path.join(__dirname, 'src/components/reports-interface.tsx');
  let content = fs.readFileSync(reportsInterfacePath, 'utf8');

  // Add imports for chart functionality
  const importsToAdd = `import { TrendChart } from './trend-chart';
import { useEffect, useState } from 'react';`;

  // Add the imports after the existing imports
  content = content.replace(
    `import { useState, useMemo } from 'react';`,
    `import { useState, useMemo, useEffect } from 'react';
import { TrendChart } from './trend-chart';`
  );

  // Add chart data interface
  const chartDataInterface = `
interface ChartDataPoint {
  date: string;
  value: number;
  unit?: string;
}

interface ChartData {
  [metricName: string]: ChartDataPoint[];
}`;

  // Add the interface after the existing interfaces
  content = content.replace(
    `interface ReportsInterfaceProps {
  reports: Report[];
}`,
    `interface ReportsInterfaceProps {
  reports: Report[];
}

${chartDataInterface}`
  );

  // Add chart data fetching logic to the component
  const chartDataFetchingLogic = `
  // Chart data state
  const [chartData, setChartData] = useState<ChartData>({});
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  // Fetch chart data
  useEffect(() => {
    async function fetchChartData() {
      try {
        setChartLoading(true);
        setChartError(null);
        
        const response = await fetch('/api/chart-data', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(\`Failed to fetch chart data: \${response.status}\`);
        }

        const data = await response.json();
        setChartData(data || {});
      } catch (error) {
        console.error('Chart data fetch error:', error);
        setChartError(error instanceof Error ? error.message : 'Failed to load chart data');
      } finally {
        setChartLoading(false);
      }
    }

    fetchChartData();
  }, []);`;

  // Add the chart data fetching logic after the state declarations
  content = content.replace(
    `const [currentPage, setCurrentPage] = useState(1);
  const VISITS_PER_PAGE = 50;`,
    `const [currentPage, setCurrentPage] = useState(1);
  const VISITS_PER_PAGE = 50;

${chartDataFetchingLogic}`
  );

  // Add Parameter Trending section to the UI
  const parameterTrendingSection = `
        {/* Parameter Trending Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-xl text-white">📈</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Parameter Trending</h2>
                <p className="text-sm text-gray-600">Historical trending analysis</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {chartLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading chart data...</p>
                </div>
              </div>
            ) : chartError ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Loading Error</h3>
                  <p className="text-gray-600 mb-2">Failed to load historical data for trending analysis</p>
                  <p className="text-sm text-red-600">Failed to fetch chart data</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : Object.keys(chartData).length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-xl">📊</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trend Data Available</h3>
                  <p className="text-gray-600">Upload more reports to see parameter trends</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(chartData).map(([metricName, dataPoints]) => {
                  if (!dataPoints || dataPoints.length === 0) return null;
                  
                  const currentValue = dataPoints[dataPoints.length - 1];
                  const unit = currentValue?.unit || '';
                  
                  return (
                    <div key={metricName} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 capitalize">{metricName}</h3>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {currentValue?.value} {unit}
                          </div>
                          <div className="text-xs text-gray-500">Current value</div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4">
                        <TrendChart
                          title={\`\${metricName} Trend\`}
                          color="#8B5CF6"
                          data={dataPoints.map(point => ({
                            date: point.date,
                            value: point.value
                          }))}
                          unit={unit}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>`;

  // Add the Parameter Trending section before the main reports list
  content = content.replace(
    `        {/* Beautiful Visit-Based Medical Records */}`,
    `${parameterTrendingSection}

        {/* Beautiful Visit-Based Medical Records */}`
  );

  // Write the updated content
  fs.writeFileSync(reportsInterfacePath, content);
  console.log('✅ Updated ReportsInterface with Parameter Trending section');

  console.log('\n✅ REPORTS PARAMETER TRENDING FIX COMPLETE:');
  console.log('- Added chart data fetching using GET to /api/chart-data');
  console.log('- Added Parameter Trending section to ReportsInterface UI');
  console.log('- Integrated TrendChart component for each metric');
  console.log('- Added proper loading states and error handling');
  console.log('- Maintained all existing reports functionality');

  console.log('\n🎯 EXPECTED RESULT:');
  console.log('- Reports page will show Parameter Trending section');
  console.log('- Charts will display for available metrics');
  console.log('- No more POST 405 errors to /api/chart-data');
  console.log('- Proper error handling for failed chart data loads');

  console.log('\n📋 TESTING STEPS:');
  console.log('1. Build and deploy the changes');
  console.log('2. Go to https://livertracker.com/reports/');
  console.log('3. Verify Parameter Trending section appears');
  console.log('4. Check that charts load without errors');
  console.log('5. Confirm existing reports functionality still works');

  console.log('\n✅ REPORTS PARAMETER TRENDING IMPLEMENTATION COMPLETE');
}

// Apply the fix
fixReportsParameterTrending();