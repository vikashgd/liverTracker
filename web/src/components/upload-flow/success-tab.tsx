"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export interface SuccessTabProps {
  savedId: string | null;
  reportData?: any;
  onUploadAnother: () => void;
  onViewReport?: (id: string) => void;
}

export function SuccessTab({ savedId, reportData, onUploadAnother, onViewReport }: SuccessTabProps) {
  if (!savedId) {
    return (
      <div className="text-center p-8">
        <p className="text-medical-neutral-600">No report saved yet.</p>
      </div>
    );
  }

  return (
    <div className="success-tab text-center p-8">
      {/* Success Icon */}
      <div className="success-icon mb-6">
        <div className="w-20 h-20 bg-medical-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-medical-success-600" />
        </div>
        <h2 className="text-2xl font-bold text-medical-neutral-900 mb-2">
          Report Saved Successfully!
        </h2>
        <p className="text-medical-neutral-600 mb-6">
          Your medical report has been processed and saved securely.
        </p>
      </div>

      {/* Report Summary */}
      <div className="report-summary bg-medical-neutral-50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
        <h3 className="font-medium text-medical-neutral-900 mb-2">Report Summary</h3>
        <div className="text-sm text-medical-neutral-600 space-y-1">
          <p><strong>Report ID:</strong> {savedId}</p>
          {reportData?.reportType && (
            <p><strong>Type:</strong> {reportData.reportType}</p>
          )}
          {reportData?.reportDate && (
            <p><strong>Date:</strong> {reportData.reportDate}</p>
          )}
          {reportData?.metricsAll && (
            <p><strong>Lab Values:</strong> {reportData.metricsAll.length} metrics</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons space-y-3">
        {onViewReport && (
          <Button
            onClick={() => onViewReport(savedId)}
            className="btn-primary w-full md:w-auto"
          >
            View Report Details
          </Button>
        )}
        <Button
          onClick={onUploadAnother}
          variant="outline"
          className="w-full md:w-auto"
        >
          Upload Another Report
        </Button>
      </div>
    </div>
  );
}