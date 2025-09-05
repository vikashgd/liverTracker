'use client';

import React, { useState, useEffect } from 'react';
import { PDFViewer } from './pdf-viewer';

// Full-screen image viewer component
function ImageZoomViewer({ imageUrl, fileName, onClose }: { imageUrl: string; fileName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🖼️</div>
            <div>
              <h3 className="font-semibold text-white">{fileName}</h3>
              <p className="text-sm text-gray-300">Full Screen View</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:text-gray-300 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center p-4">
          <img
            src={imageUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center p-4 bg-black/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface FileDisplayProps {
  objectKey: string;
  fileName: string;
  contentType?: string;
}

// Component for displaying images
export function FileImageDisplay({ objectKey, fileName }: FileDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showZoom, setShowZoom] = useState(false);
  const [fileExists, setFileExists] = useState<boolean | null>(null);

  const imageUrl = `/api/files/${encodeURIComponent(objectKey)}`;

  // Check if file exists before trying to display it
  useEffect(() => {
    const checkFileExists = async () => {
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (response.ok) {
          setFileExists(true);
        } else if (response.status === 404) {
          setFileExists(false);
          setImageError(true);
          setIsLoading(false);
        } else {
          // Other errors, try to load anyway
          setFileExists(true);
        }
      } catch (error) {
        console.error('Error checking file existence:', error);
        setFileExists(false);
        setImageError(true);
        setIsLoading(false);
      }
    };

    checkFileExists();
  }, [imageUrl]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (imageError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-4xl mb-2">🖼️</div>
        <p className="text-gray-600 font-medium">{fileName}</p>
        <p className="text-sm text-gray-500 mt-1">Image could not be loaded</p>
        <button
          onClick={handleDownload}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          📥 Download Image
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🖼️</span>
            <span className="font-medium text-gray-900">{fileName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowZoom(true)}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              🔍 Zoom
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              📥 Download
            </button>
          </div>
        </div>
        
        <div className="relative bg-gray-50 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          )}
          {fileExists && (
            <img
              src={imageUrl}
              alt={fileName}
              className="w-full h-auto max-h-96 object-contain cursor-pointer"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setImageError(true);
                setIsLoading(false);
              }}
              onClick={() => setShowZoom(true)}
            />
          )}
        </div>
      </div>

      {showZoom && (
        <ImageZoomViewer
          imageUrl={imageUrl}
          fileName={fileName}
          onClose={() => setShowZoom(false)}
        />
      )}
    </>
  );
}

// Component for displaying PDFs
export function FilePdfDisplay({ objectKey, fileName }: FileDisplayProps) {
  const [showZoomViewer, setShowZoomViewer] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fileExists, setFileExists] = useState<boolean | null>(null);
  
  const pdfUrl = `/api/files/${encodeURIComponent(objectKey)}`;
  const reportId = objectKey.split('/').pop() || 'unknown';

  // Check if file exists before trying to display it
  React.useEffect(() => {
    const checkFileExists = async () => {
      try {
        console.log('🔍 Checking PDF file existence:', pdfUrl);
        const response = await fetch(pdfUrl, { method: 'HEAD' });
        console.log('📄 PDF file check response:', response.status, response.statusText);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          console.log('📄 PDF content type:', contentType);
          setFileExists(true);
        } else if (response.status === 404) {
          console.log('❌ PDF file not found (404)');
          setFileExists(false);
          setPdfError(true);
          setIsLoading(false);
        } else {
          console.log('⚠️ PDF file check returned non-200 status, trying to load anyway');
          // Other errors, try to load anyway
          setFileExists(true);
        }
      } catch (error) {
        console.error('❌ Error checking PDF file existence:', error);
        setFileExists(false);
        setPdfError(true);
        setIsLoading(false);
      }
    };

    checkFileExists();
  }, [pdfUrl]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (pdfError) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📄</span>
            <span className="font-medium text-gray-900">{fileName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowZoomViewer(true)}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              🔍 Zoom
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              📥 Download
            </button>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-gray-600 font-medium">{fileName}</p>
          <p className="text-sm text-gray-500 mt-1">PDF could not be loaded for preview</p>
          <p className="text-xs text-gray-400 mt-1">Use Zoom or Download buttons above</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📄</span>
            <span className="font-medium text-gray-900">{fileName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowZoomViewer(true)}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              🔍 Zoom
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              📥 Download
            </button>
          </div>
        </div>
        
        <div className="relative bg-gray-50 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading PDF preview...</p>
              </div>
            </div>
          )}
          
          {/* Inline PDF Preview using iframe - only render if file exists */}
          {fileExists && (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-96 border-0 cursor-pointer"
              onLoad={() => {
                console.log('✅ PDF iframe loaded successfully');
                setIsLoading(false);
              }}
              onError={(e) => {
                console.error('❌ PDF iframe failed to load:', e);
                setPdfError(true);
                setIsLoading(false);
              }}
              onClick={() => setShowZoomViewer(true)}
              title={`PDF Preview: ${fileName}`}
              allow="same-origin"
            />
          )}
        </div>
      </div>

      {showZoomViewer && (
        <PDFViewer
          reportId={reportId}
          fileName={fileName}
          onClose={() => setShowZoomViewer(false)}
          onDownload={handleDownload}
        />
      )}
    </>
  );
}

// Component for downloading other file types
export function FileDownloadDisplay({ objectKey, fileName, contentType }: FileDisplayProps) {
  const fileUrl = `/api/files/${encodeURIComponent(objectKey)}`;
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = () => {
    if (contentType?.includes('text')) return '📝';
    if (contentType?.includes('word')) return '📄';
    if (contentType?.includes('excel') || contentType?.includes('spreadsheet')) return '📊';
    if (contentType?.includes('zip') || contentType?.includes('archive')) return '🗜️';
    return '📎';
  };

  const getFileTypeLabel = () => {
    if (contentType?.includes('text')) return 'Text Document';
    if (contentType?.includes('word')) return 'Word Document';
    if (contentType?.includes('excel') || contentType?.includes('spreadsheet')) return 'Spreadsheet';
    if (contentType?.includes('zip') || contentType?.includes('archive')) return 'Archive';
    return 'Document';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getFileIcon()}</span>
          <span className="font-medium text-gray-900">{fileName}</span>
        </div>
        <button
          onClick={handleDownload}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
        >
          📥 Download
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-4xl mb-3">{getFileIcon()}</div>
          <p className="text-gray-700 font-medium">{getFileTypeLabel()}</p>
          <p className="text-sm text-gray-500 mt-1">Click download to save this file</p>
          
          <button
            onClick={handleDownload}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📥 Download File
          </button>
        </div>
      </div>
    </div>
  );
}