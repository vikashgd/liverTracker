"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteReportButtonProps {
  reportId: string;
  variant?: 'default' | 'compact';
  className?: string;
}

export function DeleteReportButton({ 
  reportId, 
  variant = 'default',
  className = '' 
}: DeleteReportButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onDelete = async () => {
    if (busy) return;
    
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error('Failed to delete report');
      }
      
      // Show success message briefly
      const originalText = 'Delete';
      
      // Refresh the page to update the reports list
      router.refresh();
      
      // Optional: Show success feedback
      setTimeout(() => {
        // The component will be unmounted after refresh, so this is just for immediate feedback
      }, 100);
      
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete report. Please try again.');
    } finally {
      setBusy(false);
      setShowConfirm(false);
    }
  };

  const onCancel = () => {
    setShowConfirm(false);
  };

  if (variant === 'compact') {
    if (showConfirm) {
      return (
        <div className="flex items-center space-x-1">
          <button
            onClick={onDelete}
            disabled={busy}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
          >
            {busy ? "..." : "✓"}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      );
    }
    
    return (
      <button 
        type="button" 
        onClick={onDelete} 
        disabled={busy} 
        className={`inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors ${className}`}
      >
        <span className="mr-1">🗑️</span>
        <span className="hidden sm:inline">{busy ? "Deleting..." : "Delete"}</span>
        <span className="sm:hidden">{busy ? "..." : "Del"}</span>
      </button>
    );
  }

  if (showConfirm) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2 min-w-0">
        <button
          onClick={onDelete}
          disabled={busy}
          className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <span className="mr-1">⚠️</span>
          {busy ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={onCancel}
          disabled={busy}
          className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button 
      type="button" 
      onClick={onDelete} 
      disabled={busy} 
      className={`inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <span className="mr-2">🗑️</span>
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}


