"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DuplicateReportManagerProps {
  userId: string;
}

interface DuplicateReport {
  date: string;
  metrics: Array<{
    name: string;
    values: Array<{
      value: number;
      unit: string;
      reportId: string;
      confidence: string;
    }>;
  }>;
}

export function DuplicateReportManager({ userId }: DuplicateReportManagerProps) {
  const [duplicates, setDuplicates] = useState<DuplicateReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedActions, setSelectedActions] = useState<Record<string, string>>({});

  const scanForDuplicates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/duplicates?userId=${userId}`);
      const data = await response.json();
      setDuplicates(data.duplicates || []);
    } catch (error) {
      console.error('Error scanning for duplicates:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveDuplicate = async (date: string, metric: string, action: string) => {
    try {
      await fetch('/api/reports/resolve-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          date,
          metric,
          action
        })
      });
      
      // Refresh duplicates list
      await scanForDuplicates();
    } catch (error) {
      console.error('Error resolving duplicate:', error);
    }
  };

  const getStatusColor = (value: number, metric: string) => {
    // This would use the unified medical engine ranges
    return 'text-blue-600'; // Placeholder
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-medical-neutral-900">
            Duplicate Report Management
          </h2>
          <p className="text-medical-neutral-600">
            Review and resolve duplicate lab values for the same dates
          </p>
        </div>
        <Button onClick={scanForDuplicates} disabled={loading}>
          {loading ? '🔍 Scanning...' : '🔍 Scan for Duplicates'}
        </Button>
      </div>

      {duplicates.length === 0 && !loading && (
        <Card className="text-center py-8">
          <div className="text-medical-neutral-400 mb-2">✅</div>
          <p className="text-medical-neutral-600">No duplicates found</p>
        </Card>
      )}

      {duplicates.map((duplicate, index) => (
        <Card key={index} className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-lg font-semibold">📅 {new Date(duplicate.date).toLocaleDateString()}</h3>
            <span className="text-sm text-medical-neutral-500">
              {duplicate.metrics.length} metrics with duplicates
            </span>
          </div>
            {duplicate.metrics.map((metric, metricIndex) => (
              <div key={metricIndex} className="border rounded-lg p-4">
                <h4 className="font-medium text-medical-neutral-900 mb-3">
                  {metric.name}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {metric.values.map((value, valueIndex) => (
                    <div
                      key={valueIndex}
                      className="border rounded p-3 bg-medical-neutral-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${getStatusColor(value.value, metric.name)}`}>
                          {value.value} {value.unit}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          value.confidence === 'high' ? 'bg-green-100 text-green-800' :
                          value.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {value.confidence} confidence
                        </span>
                      </div>
                      <div className="text-xs text-medical-neutral-500">
                        Report ID: {value.reportId.slice(-8)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveDuplicate(duplicate.date, metric.name, 'keep_highest_confidence')}
                  >
                    ✨ Keep Highest Confidence
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveDuplicate(duplicate.date, metric.name, 'average')}
                  >
                    📊 Average Values
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveDuplicate(duplicate.date, metric.name, 'keep_latest')}
                  >
                    🕒 Keep Latest
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveDuplicate(duplicate.date, metric.name, 'manual_review')}
                  >
                    👁️ Manual Review
                  </Button>
                </div>
              </div>
            ))}
        </Card>
      ))}

      {duplicates.length > 0 && (
        <Card className="bg-blue-50 border-blue-200 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Batch Actions</h3>
              <p className="text-sm text-blue-700">Apply resolution strategy to all duplicates</p>
            </div>
            <div className="space-x-2">
              <Button
                size="sm"
                onClick={() => {
                  duplicates.forEach(duplicate => 
                    duplicate.metrics.forEach(metric => 
                      resolveDuplicate(duplicate.date, metric.name, 'keep_highest_confidence')
                    )
                  );
                }}
              >
                ✨ Auto-Resolve All
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
