"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ReviewFormProps {
  extractedData: any;
  onSave: (data: any) => void;
  onRescan: () => void;
  isSaving?: boolean;
}

export function ReviewForm({ extractedData, onSave, onRescan, isSaving = false }: ReviewFormProps) {
  const [formData, setFormData] = useState(extractedData || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="review-form space-y-6">
      <div className="form-header">
        <h2 className="text-xl font-semibold text-medical-neutral-900 mb-2">
          Review Extracted Data
        </h2>
        <p className="text-medical-neutral-600 mb-6">
          Please review and edit the extracted information before saving.
        </p>
      </div>

      {/* Report Info */}
      <div className="form-section">
        <h3 className="font-medium text-medical-neutral-900 mb-3">Report Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-medical-neutral-700 mb-1">
              Report Type
            </label>
            <Input
              value={formData.reportType || ""}
              onChange={(e) => updateField('reportType', e.target.value)}
              placeholder="e.g., Blood Test"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-medical-neutral-700 mb-1">
              Report Date
            </label>
            <Input
              type="date"
              value={formData.reportDate || ""}
              onChange={(e) => updateField('reportDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lab Values */}
      {formData.metricsAll && formData.metricsAll.length > 0 && (
        <div className="form-section">
          <h3 className="font-medium text-medical-neutral-900 mb-3">Laboratory Values</h3>
          <div className="space-y-3">
            {formData.metricsAll.map((metric: any, i: number) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white border rounded-lg">
                <Input
                  placeholder="Test Name"
                  value={metric.name || ""}
                  onChange={(e) => {
                    const newMetrics = [...formData.metricsAll];
                    newMetrics[i] = { ...newMetrics[i], name: e.target.value };
                    updateField('metricsAll', newMetrics);
                  }}
                />
                <Input
                  type="number"
                  placeholder="Value"
                  value={metric.value || ""}
                  onChange={(e) => {
                    const newMetrics = [...formData.metricsAll];
                    newMetrics[i] = { ...newMetrics[i], value: parseFloat(e.target.value) || null };
                    updateField('metricsAll', newMetrics);
                  }}
                />
                <Input
                  placeholder="Unit"
                  value={metric.unit || ""}
                  onChange={(e) => {
                    const newMetrics = [...formData.metricsAll];
                    newMetrics[i] = { ...newMetrics[i], unit: e.target.value };
                    updateField('metricsAll', newMetrics);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="form-actions pt-4 border-t">
        <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
          <Button
            type="button"
            onClick={onRescan}
            variant="outline"
            className="w-full sm:w-auto min-w-[140px] h-[52px]"
            disabled={isSaving}
          >
            Re-scan
          </Button>
          <Button
            type="submit"
            disabled={isSaving || !formData.reportDate}
            className="btn-primary w-full sm:w-auto min-w-[180px] h-[52px]"
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              "Save Report"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}