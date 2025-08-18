"use client";
import { useState } from "react";

export function ExportSummaryButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/export/summary-pdf?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        throw new Error("Export failed");
      }
      const { url } = await response.json();
      
      // Open or download the PDF
      if (navigator.share) {
        try {
          await navigator.share({
            title: "LiverTrack Summary Report",
            url,
          });
        } catch (e) {
          // Fall back to opening the URL if share fails
          window.open(url, "_blank");
        }
      } else {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Exporting..." : "Export Summary PDF"}
    </button>
  );
}
