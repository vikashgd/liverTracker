"use client";

import React, { useState } from "react";
import { Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareCreationModal } from "./share-creation-modal";

interface ShareReportButtonProps {
  reportId?: string;
  reportIds?: string[];
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function ShareReportButton({ 
  reportId,
  reportIds = [],
  variant = 'outline',
  size = 'sm',
  className = '',
  children
}: ShareReportButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleShareCreated = (shareLink: any) => {
    // Could show success toast or redirect
    console.log('Share created:', shareLink);
  };

  const finalReportIds = reportId ? [reportId] : reportIds;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <Share2 className="w-4 h-4" />
        {children || 'Share'}
      </Button>

      <ShareCreationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        reportIds={finalReportIds}
        onShareCreated={handleShareCreated}
      />
    </>
  );
}

// Quick Share Button for specific use cases
export function QuickShareButton({ 
  reportId, 
  className = '' 
}: { 
  reportId: string; 
  className?: string; 
}) {
  return (
    <ShareReportButton
      reportId={reportId}
      variant="ghost"
      size="sm"
      className={`text-medical-neutral-600 hover:text-medical-primary-600 ${className}`}
    >
      <Share2 className="w-4 h-4" />
    </ShareReportButton>
  );
}

// Share with Doctor Button for prominent placement
export function ShareWithDoctorButton({ 
  reportIds = [],
  className = '' 
}: { 
  reportIds?: string[];
  className?: string; 
}) {
  return (
    <ShareReportButton
      reportIds={reportIds}
      variant="default"
      size="default"
      className={`bg-medical-primary-600 hover:bg-medical-primary-700 text-white ${className}`}
    >
      <Share2 className="w-4 h-4" />
      Share with Doctor
    </ShareReportButton>
  );
}