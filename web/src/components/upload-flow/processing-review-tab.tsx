"use client";

import React from "react";
import { ProcessingOverlay } from "./processing-overlay";
import { ReviewForm } from "./review-form";
import { UploadFlowState } from "@/lib/upload-flow-state";

export interface ProcessingReviewTabProps {
  flowState: UploadFlowState;
  onProcessingComplete?: (data: any) => void;
  onCancelProcessing?: () => void;
  onRescan?: () => void;
  onSaveReport?: (data?: any) => void;
}

export function ProcessingReviewTab({
  flowState,
  onProcessingComplete,
  onCancelProcessing,
  onRescan,
  onSaveReport
}: ProcessingReviewTabProps) {
  
  return (
    <div className="processing-review-tab relative">
      {/* Processing Overlay */}
      <ProcessingOverlay
        isVisible={flowState.isProcessing}
        message="Processing with AI Vision - Our AI is detecting professional medical data"
        onCancel={onCancelProcessing}
      />

      {/* Review Content */}
      <div className="review-content">
        {flowState.isProcessing ? (
          <div className="processing-placeholder text-center p-8">
            <p className="text-medical-neutral-600">
              Please wait while we process your files...
            </p>
          </div>
        ) : flowState.extractedData ? (
          <ReviewForm
            extractedData={flowState.extractedData}
            onSave={(data) => {
              // Update the extracted data with any edits
              onProcessingComplete?.(data);
              // Pass the edited data directly to save
              onSaveReport?.(data);
            }}
            onRescan={() => onRescan?.()}
            isSaving={flowState.isSaving}
          />
        ) : (
          <div className="no-data-placeholder text-center p-8">
            <p className="text-medical-neutral-600">
              No data to review. Please go back and upload files.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}