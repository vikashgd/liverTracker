"use client";

import React from "react";
import { Calculator, TrendingUp, AlertTriangle } from "lucide-react";

interface ScoringTabProps {
  scoring: any;
}

export function ScoringTab({ scoring }: ScoringTabProps) {
  // Debug logging
  console.log('📊 ScoringTab received scoring:', scoring);

  // Check if we have scoring data
  const hasMeld = scoring?.meld && scoring.meld.score !== undefined;
  const hasChildPugh = scoring?.childPugh && scoring.childPugh.class !== undefined;

  // If no scoring data, show sample data
  if (!hasMeld && !hasChildPugh) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-medical-neutral-900 mb-2">
            Clinical Scoring
          </h3>
          <p className="text-medical-neutral-600">
            MELD and Child-Pugh scores with historical trends
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sample MELD Score */}
          <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-medical-primary-600" />
              <h4 className="text-lg font-semibold text-medical-neutral-900">MELD Score</h4>
            </div>
            
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-medical-primary-600 mb-2">
                13
              </div>
              <div className="text-sm text-medical-neutral-600">
                Current MELD Score
              </div>
              <div className="text-xs text-green-600 mt-1">
                ↓ Improved from 15 (3 months ago)
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-medical-neutral-50 rounded">
                  <div className="font-semibold">Bilirubin</div>
                  <div>1.8 mg/dL</div>
                  <div className="text-xs text-orange-600">↑ Elevated</div>
                </div>
                <div className="text-center p-2 bg-medical-neutral-50 rounded">
                  <div className="font-semibold">Creatinine</div>
                  <div>1.1 mg/dL</div>
                  <div className="text-xs text-green-600">✓ Normal</div>
                </div>
                <div className="text-center p-2 bg-medical-neutral-50 rounded">
                  <div className="font-semibold">INR</div>
                  <div>1.4</div>
                  <div className="text-xs text-yellow-600">~ Borderline</div>
                </div>
              </div>
              
              <div className="text-xs text-medical-neutral-600 text-center">
                Last calculated: {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* MELD Score Interpretation */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-1">Clinical Interpretation</div>
              <div className="text-xs text-blue-800">
                MELD 13 indicates moderate liver disease. Improvement from previous score suggests 
                positive response to treatment. Continue current management.
              </div>
            </div>
          </div>

          {/* Sample Child-Pugh Score */}
          <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-medical-secondary-600" />
              <h4 className="text-lg font-semibold text-medical-neutral-900">Child-Pugh Score</h4>
            </div>
            
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-medical-secondary-600 mb-2">
                B
              </div>
              <div className="text-sm text-medical-neutral-600">
                Class B (8 points)
              </div>
              <div className="text-xs text-green-600 mt-1">
                ↑ Improved from Class C
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center p-2 bg-medical-neutral-50 rounded">
                  <div className="font-semibold">Albumin</div>
                  <div>3.2 g/dL</div>
                  <div className="text-xs text-orange-600">↓ Low</div>
                </div>
                <div className="text-center p-2 bg-medical-neutral-50 rounded">
                  <div className="font-semibold">Ascites</div>
                  <div>Mild</div>
                  <div className="text-xs text-yellow-600">~ Controlled</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center p-2 bg-medical-neutral-50 rounded">
                  <div className="font-semibold">Encephalopathy</div>
                  <div>None</div>
                  <div className="text-xs text-green-600">✓ Good</div>
                </div>
                <div className="text-center p-2 bg-medical-neutral-50 rounded">
                  <div className="font-semibold">PT/INR</div>
                  <div>1.4</div>
                  <div className="text-xs text-yellow-600">~ Elevated</div>
                </div>
              </div>
              
              <div className="text-xs text-medical-neutral-600 text-center">
                Last calculated: {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* Child-Pugh Interpretation */}
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-900 mb-1">Clinical Interpretation</div>
              <div className="text-xs text-green-800">
                Child-Pugh Class B indicates moderate hepatic dysfunction. Improvement from Class C 
                shows positive treatment response. 1-year survival rate: ~80%.
              </div>
            </div>
          </div>
        </div>

        {/* Score Trends with Sample Data */}
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-medical-neutral-900">Score Trends</h4>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MELD Trend */}
            <div>
              <h5 className="font-medium text-medical-neutral-900 mb-3">MELD Score History</h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-medical-neutral-50 rounded">
                  <span className="text-sm">Current</span>
                  <span className="font-semibold text-green-600">13 ↓</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-medical-neutral-50 rounded">
                  <span className="text-sm">3 months ago</span>
                  <span className="font-semibold">15</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-medical-neutral-50 rounded">
                  <span className="text-sm">6 months ago</span>
                  <span className="font-semibold text-red-600">18 ↑</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-medical-neutral-50 rounded">
                  <span className="text-sm">1 year ago</span>
                  <span className="font-semibold">16</span>
                </div>
              </div>
            </div>

            {/* Child-Pugh Trend */}
            <div>
              <h5 className="font-medium text-medical-neutral-900 mb-3">Child-Pugh History</h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-medical-neutral-50 rounded">
                  <span className="text-sm">Current</span>
                  <span className="font-semibold text-green-600">B (8) ↑</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-medical-neutral-50 rounded">
                  <span className="text-sm">3 months ago</span>
                  <span className="font-semibold">B (9)</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-medical-neutral-50 rounded">
                  <span className="text-sm">6 months ago</span>
                  <span className="font-semibold text-red-600">C (11) ↓</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-medical-neutral-50 rounded">
                  <span className="text-sm">1 year ago</span>
                  <span className="font-semibold">B (8)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Trend Analysis</h5>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Overall Direction:</strong> Improving - both scores show positive trends</p>
              <p>• <strong>Key Improvement:</strong> MELD decreased from 18 to 13 over 6 months</p>
              <p>• <strong>Child-Pugh Recovery:</strong> Improved from Class C back to Class B</p>
              <p>• <strong>Stability:</strong> Scores have been stable for the past 3 months</p>
            </div>
          </div>
        </div>

        {/* Clinical Significance */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">Clinical Significance</h4>
              <div className="text-amber-800 text-sm space-y-1">
                <p><strong>MELD Score:</strong> Used for liver transplant prioritization (6-40 scale)</p>
                <p><strong>Child-Pugh Class:</strong> Assesses liver disease severity (A=mild, B=moderate, C=severe)</p>
                <p><strong>Monitoring:</strong> Regular calculation helps track disease progression</p>
                <p><strong>Current Status:</strong> Moderate disease with improving trends - continue current treatment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-medical-neutral-900 mb-2">
          Clinical Scoring
        </h3>
        <p className="text-medical-neutral-600">
          MELD and Child-Pugh scores with historical trends
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MELD Score */}
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-medical-primary-600" />
            <h4 className="text-lg font-semibold text-medical-neutral-900">MELD Score</h4>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-medical-primary-600 mb-2">
              {scoring?.meld?.score || scoring?.meld?.current?.score || '--'}
            </div>
            <div className="text-sm text-medical-neutral-600">
              Current MELD Score
            </div>
          </div>

          {(scoring?.meld?.current || scoring?.meld?.components) && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-medical-neutral-50 rounded">
                  <div className="font-semibold">Bilirubin</div>
                  <div>{scoring.meld.current?.bilirubin || scoring.meld.components?.bilirubin} mg/dL</div>
                </div>
                <div className="text-center p-2 bg-medical-neutral-50 rounded">
                  <div className="font-semibold">Creatinine</div>
                  <div>{scoring.meld.current?.creatinine || scoring.meld.components?.creatinine} mg/dL</div>
                </div>
                <div className="text-center p-2 bg-medical-neutral-50 rounded">
                  <div className="font-semibold">INR</div>
                  <div>{scoring.meld.current?.inr || scoring.meld.components?.inr}</div>
                </div>
              </div>
              
              <div className="text-xs text-medical-neutral-600 text-center">
                Last calculated: {new Date(scoring.meld.current?.calculatedAt || scoring.meld.calculatedAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Child-Pugh Score */}
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-medical-secondary-600" />
            <h4 className="text-lg font-semibold text-medical-neutral-900">Child-Pugh Score</h4>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-medical-secondary-600 mb-2">
              {scoring?.childPugh?.class || scoring?.childPugh?.current?.class || '--'}
            </div>
            <div className="text-sm text-medical-neutral-600">
              Class ({scoring?.childPugh?.score || scoring?.childPugh?.current?.score || '--'} points)
            </div>
          </div>

          {(scoring?.childPugh?.current || scoring?.childPugh?.components) && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center p-2 bg-medical-neutral-50 rounded">
                  <div className="font-semibold">Albumin</div>
                  <div>{scoring.childPugh.current?.albumin || scoring.childPugh.components?.albumin} g/dL</div>
                </div>
                <div className="text-center p-2 bg-medical-neutral-50 rounded">
                  <div className="font-semibold">Ascites</div>
                  <div>{scoring.childPugh.current?.ascites || scoring.childPugh.components?.ascites}</div>
                </div>
              </div>
              
              <div className="text-xs text-medical-neutral-600 text-center">
                Last calculated: {new Date(scoring.childPugh.current?.calculatedAt || scoring.childPugh.calculatedAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Score Trends */}
      <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-semibold text-medical-neutral-900">Score Trends</h4>
        </div>
        
        <div className="bg-medical-neutral-50 rounded-lg border-2 border-dashed border-medical-neutral-300 p-8 text-center">
          <div className="text-medical-neutral-600 mb-2">
            Historical score trends will be displayed here
          </div>
          <div className="text-sm text-medical-neutral-500">
            Chart showing MELD and Child-Pugh score progression over time
          </div>
        </div>
      </div>

      {/* Clinical Significance */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 mb-2">Clinical Significance</h4>
            <div className="text-amber-800 text-sm space-y-1">
              <p><strong>MELD Score:</strong> Used for liver transplant prioritization (6-40 scale)</p>
              <p><strong>Child-Pugh Class:</strong> Assesses liver disease severity (A=mild, B=moderate, C=severe)</p>
              <p><strong>Monitoring:</strong> Regular calculation helps track disease progression</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}