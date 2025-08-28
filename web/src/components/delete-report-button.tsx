"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

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
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onDelete = async () => {
    if (busy) return;
    
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setBusy(true);
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error('Failed to delete report');
      }
      
      // Handle navigation based on current page
      if (pathname.includes('/reports/') && pathname !== '/reports') {
        // On individual report page - navigate to reports list
        router.push('/reports');
      } else {
        // On reports list page - refresh to update the list
        router.refresh();
      }
      
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete report. Please try again.');
      setBusy(false);
      setShowConfirm(false);
      setIsDeleting(false);
    }
    // Note: Don't reset states here since we're navigating away on success
  };

  const onCancel = () => {
    if (busy) return;
    setShowConfirm(false);
  };

  return (
    <>
      {/* Loading Overlay */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-red-200 rounded-full animate-pulse"></div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Deleting Report
            </h3>
            <p className="text-gray-600">
              Please wait while we delete your report...
            </p>
            <div className="mt-4 flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative inline-block">
        <button
          onClick={onDelete}
          disabled={busy}
          className={`
            ${variant === 'compact' 
              ? 'px-2 py-1 text-xs' 
              : 'px-4 py-2 text-sm'
            }
            bg-red-600 hover:bg-red-700 disabled:bg-red-400 
            text-white font-medium rounded-lg 
            transition-colors duration-200 flex items-center gap-2
            ${showConfirm ? 'animate-pulse' : ''}
            ${className}
          `}
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Deleting...
            </>
          ) : showConfirm ? (
            <>
              <Trash2 className="w-4 h-4" />
              Confirm Delete
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Delete
            </>
          )}
        </button>
        
        {/* Confirmation Tooltip */}
        {showConfirm && !busy && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
              <div className="text-center mb-2">Click again to confirm</div>
              <div className="flex justify-center">
                <button
                  onClick={onCancel}
                  className="text-gray-300 hover:text-white underline text-xs"
                >
                  Cancel
                </button>
              </div>
              {/* Arrow pointing up */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}


