'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PDFViewerProps {
  reportId: string;
  fileName: string;
  onClose: () => void;
  onDownload: () => void;
}

export function PDFViewer({ reportId, fileName, onClose, onDownload }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'fit' | 'width' | 'custom'>('fit');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      setTotalPages(5); // Mock total pages
    }, 1000);
  }, []);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
    setViewMode('custom');
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
    setViewMode('custom');
  };

  const handleFitToScreen = () => {
    setZoomLevel(100);
    setViewMode('fit');
  };

  const handleFitToWidth = () => {
    setZoomLevel(120);
    setViewMode('width');
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full h-full max-w-6xl max-h-[95vh] m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📄</div>
            <div>
              <h3 className="font-semibold text-gray-900">{fileName}</h3>
              <p className="text-sm text-gray-600">Original Document Viewer</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Page Navigation */}
            <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-1 border">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                ⬅️
              </button>
              <span className="text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                ➡️
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-white rounded-lg px-2 py-1 border">
              <button
                onClick={handleZoomOut}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Zoom Out"
              >
                🔍-
              </button>
              <span className="text-sm font-medium min-w-[3rem] text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Zoom In"
              >
                🔍+
              </button>
            </div>

            {/* View Mode */}
            <div className="flex items-center space-x-1 bg-white rounded-lg px-2 py-1 border">
              <button
                onClick={handleFitToScreen}
                className={`px-2 py-1 text-xs rounded ${viewMode === 'fit' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                title="Fit to Screen"
              >
                📱
              </button>
              <button
                onClick={handleFitToWidth}
                className={`px-2 py-1 text-xs rounded ${viewMode === 'width' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                title="Fit to Width"
              >
                📏
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={onDownload}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
            >
              📥 Download
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 p-4 bg-gray-100 overflow-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div 
                className="bg-white shadow-lg"
                style={{ 
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center'
                }}
              >
                {/* Mock PDF Page */}
                <div className="w-[8.5in] h-[11in] bg-white border p-8 space-y-4" style={{ minHeight: '11in' }}>
                  <div className="text-center border-b pb-4">
                    <h1 className="text-xl font-bold">MEDICAL LABORATORY REPORT</h1>
                    <p className="text-gray-600">General Hospital - Laboratory Services</p>
                    <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold mb-2">Patient Information</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> John Doe</p>
                        <p><span className="font-medium">DOB:</span> 01/15/1980</p>
                        <p><span className="font-medium">ID:</span> 123456789</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Report Details</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
                        <p><span className="font-medium">Physician:</span> Dr. Smith</p>
                        <p><span className="font-medium">Report ID:</span> {reportId}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="font-semibold mb-4">Laboratory Results</h3>
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">Test</th>
                          <th className="border border-gray-300 p-2 text-left">Result</th>
                          <th className="border border-gray-300 p-2 text-left">Reference Range</th>
                          <th className="border border-gray-300 p-2 text-left">Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2">ALT (Alanine Aminotransferase)</td>
                          <td className="border border-gray-300 p-2 font-medium">35</td>
                          <td className="border border-gray-300 p-2">7-56</td>
                          <td className="border border-gray-300 p-2">U/L</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">AST (Aspartate Aminotransferase)</td>
                          <td className="border border-gray-300 p-2 font-medium">28</td>
                          <td className="border border-gray-300 p-2">10-40</td>
                          <td className="border border-gray-300 p-2">U/L</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">Total Bilirubin</td>
                          <td className="border border-gray-300 p-2 font-medium">1.2</td>
                          <td className="border border-gray-300 p-2">0.3-1.2</td>
                          <td className="border border-gray-300 p-2">mg/dL</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">Albumin</td>
                          <td className="border border-gray-300 p-2 font-medium">4.1</td>
                          <td className="border border-gray-300 p-2">3.5-5.0</td>
                          <td className="border border-gray-300 p-2">g/dL</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">Platelet Count</td>
                          <td className="border border-gray-300 p-2 font-medium">285</td>
                          <td className="border border-gray-300 p-2">150-450</td>
                          <td className="border border-gray-300 p-2">K/µL</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-8">
                    <h3 className="font-semibold mb-2">Clinical Notes</h3>
                    <p className="text-sm text-gray-700">
                      All liver function tests are within normal limits. Patient shows stable liver function 
                      with no concerning abnormalities detected. Continue current treatment regimen and 
                      follow up in 3 months.
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t text-xs text-gray-500">
                    <p>Report generated on {new Date().toLocaleString()}</p>
                    <p>This is a mock PDF viewer showing original document format</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-xl">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>📄 {fileName}</span>
            <span>•</span>
            <span>Page {currentPage} of {totalPages}</span>
            <span>•</span>
            <span>{zoomLevel}% zoom</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              📥 Download Original
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
