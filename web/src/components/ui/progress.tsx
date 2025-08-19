import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
}

export function Progress({ value, max = 100, className = '' }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full transition-all duration-300 ease-in-out rounded-full ${
          percentage >= 80 ? 'bg-green-500' :
          percentage >= 60 ? 'bg-yellow-500' :
          percentage >= 40 ? 'bg-orange-500' : 'bg-red-500'
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
