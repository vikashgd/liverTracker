import { prisma } from "@/lib/db";
import { canonicalizeMetricName, type CanonicalMetric } from "@/lib/metrics";
import { MedicalIntelligenceEngine } from "@/lib/medical-intelligence";
import { requireAuth } from "@/lib/auth";

export default async function DebugDataPage() {
  const userId = await requireAuth();

  // Get all metrics with March 2021 data
  const march2021Data = await prisma.extractedMetric.findMany({
    where: {
      report: { 
        userId,
        OR: [
          { reportDate: { gte: new Date('2021-03-01'), lte: new Date('2021-03-31') } },
          { createdAt: { gte: new Date('2021-03-01'), lte: new Date('2021-03-31') } }
        ]
      }
    },
    include: {
      report: {
        select: { reportDate: true, createdAt: true, reportType: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Get all platelets data for comparison
  const allPlateletsData = await prisma.extractedMetric.findMany({
    where: {
      report: { userId },
      name: { in: ['Platelets', 'Platelet Count', 'PLT', 'Platelet'] }
    },
    include: {
      report: {
        select: { reportDate: true, createdAt: true, reportType: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Process platelets data through medical intelligence
  const plateletsDataPoints = allPlateletsData
    .filter(r => r.value !== null)
    .map(r => ({
      value: r.value!,
      unit: r.unit,
      date: (r.report.reportDate ?? r.report.createdAt).toISOString().slice(0, 10),
      originalData: r
    }));

  const plateletsAnalysis = MedicalIntelligenceEngine.processTimeSeries('Platelets', plateletsDataPoints);
  const plateletsChartData = MedicalIntelligenceEngine.getChartData('Platelets', plateletsDataPoints);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">🔍 Data Debug Dashboard</h1>
      
      {/* March 2021 Raw Data */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">📅 March 2021 Raw Data ({march2021Data.length} records)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Metric</th>
                <th className="text-left p-2">Value</th>
                <th className="text-left p-2">Unit</th>
                <th className="text-left p-2">Report Date</th>
                <th className="text-left p-2">Report Type</th>
              </tr>
            </thead>
            <tbody>
              {march2021Data.map((record, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 font-medium">{record.name}</td>
                  <td className="p-2">{record.value}</td>
                  <td className="p-2">{record.unit || 'null'}</td>
                  <td className="p-2">{record.report.reportDate?.toISOString().slice(0, 10) || 'null'}</td>
                  <td className="p-2">{record.report.reportType || 'null'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platelets Deep Dive */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">🩸 Platelets Analysis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold">Raw Data Points</h3>
            <p className="text-2xl font-bold text-blue-600">{plateletsDataPoints.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-semibold">After Processing</h3>
            <p className="text-2xl font-bold text-green-600">{plateletsAnalysis.processed.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <h3 className="font-semibold">Chart Data</h3>
            <p className="text-2xl font-bold text-purple-600">{plateletsChartData.length}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Quality Score: {(plateletsAnalysis.qualityScore * 100).toFixed(1)}%</h3>
          <div className="bg-yellow-50 p-3 rounded">
            <h4 className="font-medium">Recommendations:</h4>
            <ul className="list-disc list-inside">
              {plateletsAnalysis.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="overflow-x-auto">
          <h3 className="font-semibold mb-2">Detailed Processing Results:</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Original</th>
                <th className="text-left p-2">Unit</th>
                <th className="text-left p-2">Normalized</th>
                <th className="text-left p-2">Confidence</th>
                <th className="text-left p-2">Valid</th>
                <th className="text-left p-2">In Chart?</th>
                <th className="text-left p-2">Warnings</th>
              </tr>
            </thead>
            <tbody>
              {plateletsDataPoints.map((point, idx) => {
                const processed = MedicalIntelligenceEngine.processValue('Platelets', point.value, point.unit);
                const inChart = plateletsChartData.some(c => c.date === point.date && Math.abs(c.value! - processed.normalizedValue) < 0.01);
                
                return (
                  <tr key={idx} className={`border-b ${inChart ? 'bg-green-50' : 'bg-red-50'}`}>
                    <td className="p-2">{point.date}</td>
                    <td className="p-2 font-mono">{point.value}</td>
                    <td className="p-2">{point.unit || 'null'}</td>
                    <td className="p-2 font-mono">{processed.normalizedValue.toFixed(1)}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        processed.confidence === 'high' ? 'bg-green-100 text-green-800' :
                        processed.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        processed.confidence === 'low' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {processed.confidence}
                      </span>
                    </td>
                    <td className="p-2">{processed.isValid ? '✅' : '❌'}</td>
                    <td className="p-2">{inChart ? '✅' : '❌'}</td>
                    <td className="p-2 text-xs">{processed.warnings.join(', ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Metrics Summary */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">📊 All Metrics Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from(new Set(march2021Data.map(r => r.name))).map(metricName => {
            const metricData = march2021Data.filter(r => r.name === metricName);
            const dataPoints = metricData
              .filter(r => r.value !== null)
              .map(r => ({
                value: r.value!,
                unit: r.unit,
                date: (r.report.reportDate ?? r.report.createdAt).toISOString().slice(0, 10)
              }));
            
            const chartData = MedicalIntelligenceEngine.getChartData(metricName, dataPoints);
            
            return (
              <div key={metricName} className="bg-gray-50 p-3 rounded">
                <h3 className="font-medium text-sm">{metricName}</h3>
                <p className="text-xs text-gray-600">Raw: {dataPoints.length}</p>
                <p className="text-xs text-gray-600">Chart: {chartData.length}</p>
                <p className="text-xs font-mono">
                  {dataPoints.length > 0 && chartData.length === 0 ? 
                    <span className="text-red-600">❌ All filtered out</span> : 
                    <span className="text-green-600">✅ Some visible</span>
                  }
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded border">
        <h3 className="font-semibold mb-2">🛠️ Quick Fixes</h3>
        <p className="text-sm mb-2">If data is missing from charts, it&apos;s likely being filtered by the medical intelligence engine. Common issues:</p>
        <ul className="text-sm list-disc list-inside space-y-1">
          <li><strong>Unit mismatch:</strong> The AI extracted unusual units that don&apos;t match our patterns</li>
          <li><strong>Value ranges:</strong> Values outside expected ranges get low confidence</li>
          <li><strong>Old dates:</strong> Pre-2020 data with low confidence gets filtered</li>
          <li><strong>Confidence threshold:</strong> Engine rejects &quot;reject&quot; confidence values</li>
        </ul>
      </div>
    </div>
  );
}
