"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export interface NextButtonProps {
  onNext: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
  loadingText?: string;
}

export function NextButton({ 
  onNext, 
  disabled = false, 
  loading = false,
  className = "",
  children,
  loadingText = "Processing..."
}: NextButtonProps) {
  return (
    <Button
      onClick={onNext}
      disabled={disabled || loading}
      className={`next-button btn-primary flex items-center space-x-2 ${className}`}
      aria-label={loading ? loadingText : "Proceed to next step"}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>{loadingText}</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <span>{children || "Next"}</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </Button>
  );
}