"use client";

import { ChevronDownIcon } from "lucide-react";
import { forwardRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  isStandard?: boolean;
}

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ value, onValueChange, placeholder, options, className = "", disabled }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const selectedOption = options.find(option => option.value === value);
    
    return (
      <div className="relative">
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
          <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        
        {isOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown content */}
            <div className="absolute top-full left-0 z-20 mt-1 w-full rounded-md border bg-popover shadow-lg">
              <div className="max-h-60 overflow-y-auto p-1">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onValueChange?.(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                      option.value === value ? "bg-accent text-accent-foreground" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{option.label}</div>
                      {option.isStandard && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          Standard
                        </span>
                      )}
                    </div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {option.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
