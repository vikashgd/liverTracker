"use client";

import React from "react";

interface SimpleCheckboxProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function SimpleCheckbox({ 
  id, 
  checked, 
  onCheckedChange, 
  className = "" 
}: SimpleCheckboxProps) {
  return (
    <div 
      className={`relative inline-flex items-center justify-center w-4 h-4 border-2 border-gray-300 rounded-sm cursor-pointer hover:border-blue-500 transition-colors ${
        checked ? 'bg-blue-600 border-blue-600' : 'bg-white'
      } ${className}`}
      onClick={() => onCheckedChange(!checked)}
    >
      {checked && (
        <svg 
          className="w-3 h-3 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={3} 
            d="M5 13l4 4L19 7" 
          />
        </svg>
      )}
      {id && <input type="checkbox" id={id} className="sr-only" checked={checked} readOnly />}
    </div>
  );
}