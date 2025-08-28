"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export interface BackButtonProps {
  onBack: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function BackButton({ 
  onBack, 
  disabled = false, 
  loading = false,
  className = "",
  children 
}: BackButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onBack}
      disabled={disabled || loading}
      className={`back-button flex items-center space-x-2 text-medical-neutral-600 hover:text-medical-neutral-900 hover:bg-medical-neutral-100 ${className}`}
      aria-label="Go back to previous step"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{children || "Back"}</span>
    </Button>
  );
}