"use client";

import React, { useState } from "react";
import { Calendar, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface LabResultsTabProps {
  reports: any[];
}

export function LabResultsTab({ reports }: LabResultsTabProps) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  // Debug the actual data structure
  console.log('🧪 LabResultsTab - Full reports data:', reports);
  if (reports && reports.length > 0) {
    console.log('🧪 First report structure:', reports[0]);
    console.log('🧪 First report extractedData:', reports[0]?.extractedData);
    console.log('🧪 Is extractedData an array?', Array.isArray(reports[0]?.extractedData));
    console.log('🧪 extractedData type:', typeof reports[0]?.extractedData);
    
    // Debug the specific structure causing numeric keys
    if (reports[0]?.extractedData && typeof reports[0].extractedData === 'object' && !Array.isArray(reports[0].extractedData)) {
      console.log('🧪 Object keys:', Object.keys(reports[0].extractedData));
      console.log('🧪 First object entry:', Object.entries(reports[0].extractedData)[0]);
      console.log('🧪 Sample item structure:', reports[0].extractedData[Object.keys(reports[0].extractedData)[0]]);
    }
    
    if (reports[0]?.metrics) {
      console.log('🧪 Metrics structure:', reports[0].metrics);
      console.log('🧪 Is metrics an array?', Array.isArray(reports[0].metrics));
    }
  }



  // Handle different data structures
  const reportsList = Array.isArray(reports) ? reports : ((reports as any)?.individual || []);
  
  // If no reports, show sample data
  if (!reportsList || reportsList.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-medical-neutral-900">
              Laboratory Results
            </h3>
            <p className="text-medical-neutral-600">
              Chronological view of all lab reports and values
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-medical-neutral-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
              className="px-3 py-1 border border-medical-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-medical-primary-500 focus:border-transparent"
            >
              <option value="date">Date (Newest First)</option>
              <option value="name">Report Type</option>
            </select>
          </div>
        </div>

        {/* Sample Reports */}
        <div className="space-y-4">
          {/* Sample Report 1 - Recent */}
          <div className="bg-medical-neutral-50 rounded-lg border border-medical-neutral-200 overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-medical-neutral-100 transition-colors"
              onClick={() => setSelectedReport(selectedReport === 'sample1' ? null : 'sample1')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-medical-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-medical-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-medical-neutral-900">
                      Comprehensive Metabolic Panel
                    </h4>
                    <p className="text-sm text-medical-neutral-600">
                      {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-medical-neutral-600">8 values</span>
                  <div className={`transform transition-transform ${
                    selectedReport === 'sample1' ? 'rotate-180' : ''
                  }`}>
                    <svg className="w-5 h-5 text-medical-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {selectedReport === 'sample1' && (
              <div className="border-t border-medical-neutral-200 p-4 bg-white">
                {/* Clean Lab Results Grid - Similar to Single Report View */}
                <div className="space-y-4">
                  {/* Liver Function Panel */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      🧪 Liver Function Tests
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">ALT (Alanine Aminotransferase)</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-green-700">32 U/L</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 7-40 U/L</div>
                        <div className="text-xs text-green-600 mt-1">✓ Within normal range</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">AST (Aspartate Aminotransferase)</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-green-700">28 U/L</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 8-40 U/L</div>
                        <div className="text-xs text-green-600 mt-1">✓ Within normal range</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Total Bilirubin</span>
                          <TrendingUp className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="text-xl font-bold text-red-700">1.8 mg/dL</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 0.2-1.2 mg/dL</div>
                        <div className="text-xs text-red-600 mt-1">⚠ Above normal range</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Albumin</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-green-700">3.8 g/dL</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 3.5-5.0 g/dL</div>
                        <div className="text-xs text-green-600 mt-1">✓ Within normal range</div>
                      </div>
                    </div>
                  </div>

                  {/* Complete Blood Count */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                    <h5 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      🩸 Complete Blood Count
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Platelets</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-green-700">180 ×10³/μL</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 150-450 ×10³/μL</div>
                        <div className="text-xs text-green-600 mt-1">✓ Within normal range</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Hemoglobin</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-green-700">13.2 g/dL</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 12.0-15.5 g/dL</div>
                        <div className="text-xs text-green-600 mt-1">✓ Within normal range</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">White Blood Cells</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-green-700">6.2 ×10³/μL</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 4.5-11.0 ×10³/μL</div>
                        <div className="text-xs text-green-600 mt-1">✓ Within normal range</div>
                      </div>
                    </div>
                  </div>

                  {/* Kidney Function & Coagulation */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                    <h5 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                      🫘 Kidney Function & Coagulation
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Creatinine</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-green-700">1.1 mg/dL</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 0.6-1.2 mg/dL</div>
                        <div className="text-xs text-green-600 mt-1">✓ Within normal range</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-yellow-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">INR (International Normalized Ratio)</span>
                          <TrendingUp className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div className="text-xl font-bold text-yellow-700">1.4</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 0.8-1.2</div>
                        <div className="text-xs text-yellow-600 mt-1">⚠ Slightly elevated</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sample Report 2 - 3 months ago */}
          <div className="bg-medical-neutral-50 rounded-lg border border-medical-neutral-200 overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-medical-neutral-100 transition-colors"
              onClick={() => setSelectedReport(selectedReport === 'sample2' ? null : 'sample2')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-medical-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-medical-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-medical-neutral-900">
                      Liver Function Panel
                    </h4>
                    <p className="text-sm text-medical-neutral-600">
                      {new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-medical-neutral-600">6 values</span>
                  <div className={`transform transition-transform ${
                    selectedReport === 'sample2' ? 'rotate-180' : ''
                  }`}>
                    <svg className="w-5 h-5 text-medical-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {selectedReport === 'sample2' && (
              <div className="border-t border-medical-neutral-200 p-4 bg-white">
                {/* 3 Months Ago - Elevated Values */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                    <h5 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                      ⚠️ Liver Function Tests - Elevated
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">ALT (Alanine Aminotransferase)</span>
                          <TrendingUp className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="text-xl font-bold text-red-700">45 U/L</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 7-40 U/L</div>
                        <div className="text-xs text-red-600 mt-1">⚠ Above normal range</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">AST (Aspartate Aminotransferase)</span>
                          <TrendingUp className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="text-xl font-bold text-red-700">52 U/L</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 8-40 U/L</div>
                        <div className="text-xs text-red-600 mt-1">⚠ Significantly elevated</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Total Bilirubin</span>
                          <TrendingUp className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="text-xl font-bold text-red-700">2.4 mg/dL</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 0.2-1.2 mg/dL</div>
                        <div className="text-xs text-red-600 mt-1">⚠ Significantly elevated</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Albumin</span>
                          <TrendingDown className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-xl font-bold text-blue-700">3.2 g/dL</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 3.5-5.0 g/dL</div>
                        <div className="text-xs text-blue-600 mt-1">⚠ Below normal range</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100">
                    <h5 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                      🩸 Blood Count & Coagulation
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Platelets</span>
                          <TrendingDown className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-xl font-bold text-blue-700">145 ×10³/μL</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 150-450 ×10³/μL</div>
                        <div className="text-xs text-blue-600 mt-1">⚠ Slightly below normal</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">INR (International Normalized Ratio)</span>
                          <TrendingUp className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="text-xl font-bold text-red-700">1.6</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 0.8-1.2</div>
                        <div className="text-xs text-red-600 mt-1">⚠ Elevated - monitor closely</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h5 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                    📋 Clinical Notes
                  </h5>
                  <p className="text-sm text-amber-800">
                    <strong>Assessment:</strong> Elevated liver enzymes and bilirubin indicate hepatic stress. 
                    Decreased albumin and platelet count suggest possible liver dysfunction.
                  </p>
                  <p className="text-sm text-amber-800 mt-2">
                    <strong>Plan:</strong> Enhanced monitoring protocol initiated. Follow-up labs recommended in 6 weeks. 
                    Consider hepatology consultation if values don't improve.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sample Report 3 - 6 months ago */}
          <div className="bg-medical-neutral-50 rounded-lg border border-medical-neutral-200 overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-medical-neutral-100 transition-colors"
              onClick={() => setSelectedReport(selectedReport === 'sample3' ? null : 'sample3')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-medical-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-medical-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-medical-neutral-900">
                      Complete Blood Count
                    </h4>
                    <p className="text-sm text-medical-neutral-600">
                      {new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-medical-neutral-600">5 values</span>
                  <div className={`transform transition-transform ${
                    selectedReport === 'sample3' ? 'rotate-180' : ''
                  }`}>
                    <svg className="w-5 h-5 text-medical-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {selectedReport === 'sample3' && (
              <div className="border-t border-medical-neutral-200 p-4 bg-white">
                {/* 6 Months Ago - Complete Blood Count */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                    <h5 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      🩸 Complete Blood Count (CBC)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Hemoglobin</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-green-700">12.8 g/dL</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 12.0-15.5 g/dL</div>
                        <div className="text-xs text-green-600 mt-1">✓ Within normal range</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Hematocrit</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-green-700">38.4%</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 36-46%</div>
                        <div className="text-xs text-green-600 mt-1">✓ Within normal range</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Platelets</span>
                          <TrendingDown className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-xl font-bold text-blue-700">135 ×10³/μL</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 150-450 ×10³/μL</div>
                        <div className="text-xs text-blue-600 mt-1">⚠ Below normal range</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">White Blood Cells (WBC)</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-green-700">6.2 ×10³/μL</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 4.5-11.0 ×10³/μL</div>
                        <div className="text-xs text-green-600 mt-1">✓ Within normal range</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Red Blood Cells (RBC)</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-green-700">4.1 ×10⁶/μL</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 4.0-5.2 ×10⁶/μL</div>
                        <div className="text-xs text-green-600 mt-1">✓ Within normal range</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Mean Corpuscular Volume (MCV)</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-green-700">88 fL</div>
                        <div className="text-xs text-gray-500 mt-1">Normal: 80-100 fL</div>
                        <div className="text-xs text-green-600 mt-1">✓ Within normal range</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    📋 Clinical Assessment
                  </h5>
                  <p className="text-sm text-blue-800">
                    <strong>Overall:</strong> Complete blood count shows mostly normal values. 
                    Platelet count is slightly below normal range, which may indicate early signs of liver-related changes.
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    <strong>Recommendation:</strong> Monitor platelet trends in future lab work. 
                    Consider correlation with liver function tests.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-4">
          <h4 className="font-semibold text-medical-neutral-900 mb-3">
            Summary Statistics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-medical-primary-600">3</div>
              <div className="text-sm text-medical-neutral-600">Total Reports</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">15</div>
              <div className="text-sm text-medical-neutral-600">Normal Results</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">4</div>
              <div className="text-sm text-medical-neutral-600">Abnormal Results</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-medical-neutral-600">0</div>
              <div className="text-sm text-medical-neutral-600">Days Since Last</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getValueStatus = (value: number, normalRange: any) => {
    if (!normalRange || !normalRange.min || !normalRange.max) {
      return 'normal';
    }
    
    if (value < normalRange.min) return 'low';
    if (value > normalRange.max) return 'high';
    return 'normal';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'high':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'low':
        return <TrendingDown className="w-4 h-4 text-blue-600" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high':
      case 'critical':
        return 'text-red-700 bg-red-50';
      case 'low':
        return 'text-blue-700 bg-blue-50';
      default:
        return 'text-green-700 bg-green-50';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'high':
      case 'critical':
        return 'text-red-700';
      case 'low':
        return 'text-blue-700';
      default:
        return 'text-green-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'high':
        return '⚠ Above normal range';
      case 'low':
        return '⚠ Below normal range';
      case 'critical':
        return '🚨 Critical value';
      default:
        return '✓ Within normal range';
    }
  };

  const getFullMetricName = (name: string) => {
    // Map common abbreviations to full names
    const nameMap: Record<string, string> = {
      'ALT': 'ALT (Alanine Aminotransferase)',
      'AST': 'AST (Aspartate Aminotransferase)',
      'Bilirubin': 'Total Bilirubin',
      'Platelets': 'Platelets',
      'Albumin': 'Albumin',
      'Creatinine': 'Creatinine',
      'INR': 'INR (International Normalized Ratio)',
      'Hemoglobin': 'Hemoglobin',
      'Hematocrit': 'Hematocrit',
      'WBC': 'White Blood Cells (WBC)',
      'RBC': 'Red Blood Cells (RBC)'
    };
    
    return nameMap[name] || name;
  };

  const sortedReports = [...reports].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime();
    }
    return a.reportType?.localeCompare(b.reportType) || 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-medical-neutral-900">
            Laboratory Results
          </h3>
          <p className="text-medical-neutral-600">
            Chronological view of all lab reports and values
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-medical-neutral-600">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
            className="px-3 py-1 border border-medical-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-medical-primary-500 focus:border-transparent"
          >
            <option value="date">Date (Newest First)</option>
            <option value="name">Report Type</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {sortedReports.map((report, index) => (
          <div
            key={report.id || index}
            className="bg-medical-neutral-50 rounded-lg border border-medical-neutral-200 overflow-hidden"
          >
            {/* Report Header */}
            <div
              className="p-4 cursor-pointer hover:bg-medical-neutral-100 transition-colors"
              onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-medical-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-medical-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-medical-neutral-900">
                      {report.reportType || 'Lab Report'}
                    </h4>
                    <p className="text-sm text-medical-neutral-600">
                      {new Date(report.reportDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {(report.extractedData || report.metrics) && (
                    <span className="text-sm text-medical-neutral-600">
                      {Array.isArray(report.extractedData) 
                        ? report.extractedData.length 
                        : report.extractedData 
                          ? Object.keys(report.extractedData).length 
                          : Object.keys(report.metrics || {}).length
                      } values
                    </span>
                  )}
                  <div className={`transform transition-transform ${
                    selectedReport === report.id ? 'rotate-180' : ''
                  }`}>
                    <svg className="w-5 h-5 text-medical-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Details */}
            {selectedReport === report.id && (
              <div className="border-t border-medical-neutral-200 p-4 bg-white">
                {((report.extractedData && (Array.isArray(report.extractedData) ? report.extractedData.length > 0 : Object.keys(report.extractedData).length > 0)) || (report.metrics && Object.keys(report.metrics).length > 0)) ? (
                  <div className="space-y-4">
                    {/* Organize metrics by category */}
                    {(() => {
                      // Handle different extractedData structures
                      let metrics: Array<[string, any]> = [];
                      
                      if (report.extractedData) {
                        if (Array.isArray(report.extractedData)) {
                          // Handle proper array structure
                          metrics = report.extractedData.map((item: any, index: number) => [
                            item.name || item.metricName || `Metric ${item.id || index}`,
                            {
                              value: item.value,
                              unit: item.unit,
                              normalRange: item.normalRange || item.referenceRange,
                              uniqueId: `${item.name || 'metric'}_${index}` // Add unique identifier
                            }
                          ]);
                        } else if (typeof report.extractedData === 'object') {
                          // Handle object with numeric keys (0, 1, 2, 3...)
                          // CRITICAL FIX: Always use the item.name, never the numeric key
                          metrics = Object.entries(report.extractedData).map(([key, item]: [string, any]) => {
                            // Ensure we have a valid item object
                            if (!item || typeof item !== 'object') {
                              return [`Unknown Metric ${key}`, { value: null, unit: '', normalRange: null, uniqueId: `unknown_${key}` }];
                            }
                            
                            // Extract the actual metric name from the item, not the numeric key
                            const metricName = item.name || item.metricName || item.metric || item.label || `Unknown Metric ${key}`;
                            
                            return [
                              metricName,
                              {
                                value: item.value,
                                unit: item.unit || '',
                                normalRange: item.normalRange || item.referenceRange,
                                uniqueId: `${metricName}_${key}` // Add unique identifier
                              }
                            ];
                          });
                        }
                      } else if (report.metrics) {
                        // Handle metrics array structure
                        if (Array.isArray(report.metrics)) {
                          metrics = report.metrics.map((metric: any, index: number) => [
                            metric.name || metric.metricName || `Metric ${metric.id || index}`,
                            {
                              value: metric.value,
                              unit: metric.unit,
                              normalRange: metric.normalRange || metric.referenceRange,
                              uniqueId: `${metric.name || 'metric'}_${index}` // Add unique identifier
                            }
                          ]);
                        } else {
                          // Use metrics object directly
                          metrics = Object.entries(report.metrics).map(([key, data]: [string, any], index: number) => [
                            key,
                            {
                              ...data,
                              uniqueId: `${key}_${index}` // Add unique identifier
                            }
                          ]);
                        }
                      }

                      // Deduplicate metrics by name, keeping the first occurrence
                      const uniqueMetrics = new Map();
                      metrics.forEach(([name, data]) => {
                        if (!uniqueMetrics.has(name)) {
                          uniqueMetrics.set(name, data);
                        }
                      });
                      metrics = Array.from(uniqueMetrics.entries());
                      
                      const liverMetrics = metrics.filter(([name]) => 
                        name.toLowerCase().includes('alt') || 
                        name.toLowerCase().includes('ast') || 
                        name.toLowerCase().includes('bilirubin') || 
                        name.toLowerCase().includes('albumin')
                      );
                      const bloodMetrics = metrics.filter(([name]) => 
                        name.toLowerCase().includes('platelet') || 
                        name.toLowerCase().includes('hemoglobin') || 
                        name.toLowerCase().includes('hematocrit') || 
                        name.toLowerCase().includes('wbc') || 
                        name.toLowerCase().includes('rbc')
                      );
                      const kidneyMetrics = metrics.filter(([name]) => 
                        name.toLowerCase().includes('creatinine') || 
                        name.toLowerCase().includes('inr') || 
                        name.toLowerCase().includes('urea')
                      );
                      const otherMetrics = metrics.filter(([name]) => 
                        !liverMetrics.some(([ln]) => ln === name) &&
                        !bloodMetrics.some(([bn]) => bn === name) &&
                        !kidneyMetrics.some(([kn]) => kn === name)
                      );

                      return (
                        <>
                          {/* Liver Function Tests */}
                          {liverMetrics.length > 0 && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                              <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                🧪 Liver Function Tests
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {liverMetrics.map(([name, data]: [string, any], index: number) => {
                                  if (!data || data.value === null || data.value === undefined) return null;
                                  const status = getValueStatus(data.value, data.normalRange);
                                  const fullName = getFullMetricName(name);
                                  const uniqueKey = data.uniqueId || `liver_${name}_${index}`;
                                  
                                  return (
                                    <div key={uniqueKey} className="bg-white rounded-lg p-3 border border-gray-200">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">{fullName}</span>
                                        {getStatusIcon(status)}
                                      </div>
                                      <div className={`text-xl font-bold ${getStatusTextColor(status)}`}>
                                        {data.value} {data.unit}
                                      </div>
                                      {data.normalRange && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Normal: {data.normalRange.min}-{data.normalRange.max} {data.unit}
                                        </div>
                                      )}
                                      <div className={`text-xs mt-1 ${getStatusTextColor(status)}`}>
                                        {getStatusText(status)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Complete Blood Count */}
                          {bloodMetrics.length > 0 && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                              <h5 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                🩸 Complete Blood Count
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {bloodMetrics.map(([name, data]: [string, any], index: number) => {
                                  if (!data || data.value === null || data.value === undefined) return null;
                                  const status = getValueStatus(data.value, data.normalRange);
                                  const fullName = getFullMetricName(name);
                                  const uniqueKey = data.uniqueId || `blood_${name}_${index}`;
                                  
                                  return (
                                    <div key={uniqueKey} className="bg-white rounded-lg p-3 border border-gray-200">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">{fullName}</span>
                                        {getStatusIcon(status)}
                                      </div>
                                      <div className={`text-xl font-bold ${getStatusTextColor(status)}`}>
                                        {data.value} {data.unit}
                                      </div>
                                      {data.normalRange && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Normal: {data.normalRange.min}-{data.normalRange.max} {data.unit}
                                        </div>
                                      )}
                                      <div className={`text-xs mt-1 ${getStatusTextColor(status)}`}>
                                        {getStatusText(status)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Kidney Function & Coagulation */}
                          {kidneyMetrics.length > 0 && (
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                              <h5 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                                🫘 Kidney Function & Coagulation
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {kidneyMetrics.map(([name, data]: [string, any], index: number) => {
                                  if (!data || data.value === null || data.value === undefined) return null;
                                  const status = getValueStatus(data.value, data.normalRange);
                                  const fullName = getFullMetricName(name);
                                  const uniqueKey = data.uniqueId || `kidney_${name}_${index}`;
                                  
                                  return (
                                    <div key={uniqueKey} className="bg-white rounded-lg p-3 border border-gray-200">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">{fullName}</span>
                                        {getStatusIcon(status)}
                                      </div>
                                      <div className={`text-xl font-bold ${getStatusTextColor(status)}`}>
                                        {data.value} {data.unit}
                                      </div>
                                      {data.normalRange && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Normal: {data.normalRange.min}-{data.normalRange.max} {data.unit}
                                        </div>
                                      )}
                                      <div className={`text-xs mt-1 ${getStatusTextColor(status)}`}>
                                        {getStatusText(status)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Other Metrics */}
                          {otherMetrics.length > 0 && (
                            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100">
                              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                📊 Other Lab Values
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {otherMetrics.map(([name, data]: [string, any], index: number) => {
                                  if (!data || data.value === null || data.value === undefined) return null;
                                  const status = getValueStatus(data.value, data.normalRange);
                                  const fullName = getFullMetricName(name);
                                  const uniqueKey = data.uniqueId || `other_${name}_${index}`;
                                  
                                  return (
                                    <div key={uniqueKey} className="bg-white rounded-lg p-3 border border-gray-200">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">{fullName}</span>
                                        {getStatusIcon(status)}
                                      </div>
                                      <div className={`text-xl font-bold ${getStatusTextColor(status)}`}>
                                        {data.value} {data.unit}
                                      </div>
                                      {data.normalRange && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Normal: {data.normalRange.min}-{data.normalRange.max} {data.unit}
                                        </div>
                                      )}
                                      <div className={`text-xs mt-1 ${getStatusTextColor(status)}`}>
                                        {getStatusText(status)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-4 text-medical-neutral-500">
                    <p>No detailed metrics available for this report</p>
                  </div>
                )}

                {/* Additional Report Info */}
                {report.notes && (
                  <div className="mt-4 p-3 bg-medical-neutral-50 rounded-lg">
                    <h5 className="font-medium text-medical-neutral-900 mb-2">Notes</h5>
                    <p className="text-sm text-medical-neutral-700">{report.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="bg-white rounded-lg border border-medical-neutral-200 p-4">
        <h4 className="font-semibold text-medical-neutral-900 mb-3">
          Summary Statistics
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-medical-primary-600">
              {reports.length}
            </div>
            <div className="text-sm text-medical-neutral-600">Total Reports</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.status === 'normal').length}
            </div>
            <div className="text-sm text-medical-neutral-600">Normal Results</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {reports.filter(r => r.status === 'abnormal').length}
            </div>
            <div className="text-sm text-medical-neutral-600">Abnormal Results</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-medical-neutral-600">
              {Math.round((Date.now() - new Date(reports[reports.length - 1]?.reportDate).getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <div className="text-sm text-medical-neutral-600">Days Since Last</div>
          </div>
        </div>
      </div>
    </div>
  );
}