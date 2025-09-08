"use client";

import React from "react";
import { FileText, Download, Eye, Calendar, FileImage } from "lucide-react";

interface OriginalDocumentsTabProps {
  files: any;
  shareToken: string;
}

export function OriginalDocumentsTab({ files, shareToken }: OriginalDocumentsTabProps) {
  // Debug logging
  console.log('📄 OriginalDocumentsTab received files:', files);

  const handleFilePreview = (fileId: string) => {
    window.open(`/api/share/${shareToken}/files/${fileId}`, '_blank');
  };

  const handleFileDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/share/${shareToken}/files/${fileId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Check if we have any real file data
  const hasOriginalDocs = files?.originalDocuments && files.originalDocuments.length > 0;
  const hasProcessedImages = files?.processedImages && files.processedImages.length > 0;

  // If no files, show a clean empty state
  if (!hasOriginalDocs && !hasProcessedImages) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-medical-neutral-900 mb-2">
            Original Documents
          </h3>
          <p className="text-medical-neutral-600">
            Source documents and processed images from medical reports
          </p>
        </div>

        <div className="text-center py-12">
          <div className="text-medical-neutral-400 mb-4">
            <FileText className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-medical-neutral-900 mb-2">
            No Documents Included
          </h3>
          <p className="text-medical-neutral-600 max-w-md mx-auto">
            This medical share focuses on processed data and insights. Original document files 
            were not included in this particular share for privacy or file size considerations.
          </p>
        </div>

        {/* Information about what's available instead */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Available Data</h4>
              <div className="text-blue-800 text-sm space-y-2">
                <p>
                  While original documents aren't included, this share contains:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Extracted and validated lab results</li>
                  <li>Clinical scoring calculations (MELD, Child-Pugh)</li>
                  <li>Trend analysis and data visualizations</li>
                  <li>AI-powered clinical insights and recommendations</li>
                </ul>
                <p className="mt-3">
                  <strong>Note:</strong> Original documents may be available through separate secure channels 
                  or can be requested from the healthcare provider if needed for clinical review.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security and Privacy Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">Privacy & Security</h4>
              <div className="text-amber-800 text-sm">
                <p>
                  Original medical documents often contain sensitive information beyond what's needed 
                  for clinical review. This share provides the essential medical data in a structured, 
                  secure format while maintaining patient privacy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-medical-neutral-900 mb-2">
          Original Documents
        </h3>
        <p className="text-medical-neutral-600">
          Source documents and processed images from medical reports
        </p>
      </div>

      {/* Original Documents */}
      {files.originalDocuments && files.originalDocuments.length > 0 && (
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <h4 className="text-lg font-semibold text-medical-neutral-900 mb-4">
            Source Documents
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.originalDocuments.map((doc: any, index: number) => (
              <div
                key={doc.id || index}
                className="border border-medical-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-medical-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-medical-primary-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-medical-neutral-900 truncate">
                      {doc.reportType || doc.fileName || `Medical Report ${index + 1}`}
                    </h5>
                    <div className="text-sm text-medical-neutral-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(doc.reportDate || doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      <div>{doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'PDF Document'}</div>
                      <div className="text-xs text-medical-neutral-500">
                        {doc.contentType || 'application/pdf'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleFilePreview(doc.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-medical-primary-600 text-white text-sm rounded-lg hover:bg-medical-primary-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleFileDownload(doc.id, doc.fileName)}
                    className="flex items-center justify-center gap-1 px-3 py-2 border border-medical-neutral-300 text-medical-neutral-700 text-sm rounded-lg hover:bg-medical-neutral-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Images */}
      {files.processedImages && files.processedImages.length > 0 && (
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <h4 className="text-lg font-semibold text-medical-neutral-900 mb-4">
            Processed Images
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.processedImages.map((image: any, index: number) => (
              <div
                key={image.id || index}
                className="border border-medical-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileImage className="w-5 h-5 text-green-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-medical-neutral-900 truncate">
                      {image.originalFile?.reportType || image.fileName || `Lab Report Image ${index + 1}`}
                    </h5>
                    <div className="text-sm text-medical-neutral-600 space-y-1">
                      <div>Quality: {image.quality || 'Good'}</div>
                      <div>Extracted: {image.extractedData?.length || 0} values</div>
                      {image.processingNotes && image.processingNotes.length > 0 && (
                        <div className="text-xs text-medical-neutral-500">
                          {image.processingNotes[0]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleFilePreview(image.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleFileDownload(image.id, image.fileName)}
                    className="flex items-center justify-center gap-1 px-3 py-2 border border-medical-neutral-300 text-medical-neutral-700 text-sm rounded-lg hover:bg-medical-neutral-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extraction Summary */}
      {files.extractionSummary && (
        <div className="bg-medical-neutral-50 rounded-lg border border-medical-neutral-200 p-4">
          <h4 className="font-semibold text-medical-neutral-900 mb-3">
            Data Extraction Summary
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-medical-primary-600">
                {files.extractionSummary.totalFiles || 0}
              </div>
              <div className="text-sm text-medical-neutral-600">Files Processed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {files.extractionSummary.successfulExtractions || 0}
              </div>
              <div className="text-sm text-medical-neutral-600">Successful</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {files.extractionSummary.totalDataPoints || 0}
              </div>
              <div className="text-sm text-medical-neutral-600">Data Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(files.extractionSummary.averageConfidence * 100) || 0}%
              </div>
              <div className="text-sm text-medical-neutral-600">Avg Confidence</div>
            </div>
          </div>
        </div>
      )}

      {/* File Access Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">File Access Information</h4>
            <div className="text-blue-800 text-sm space-y-1">
              <p>
                All document access is logged for security purposes. Files are served through 
                secure, time-limited links that expire with this share.
              </p>
              <p>
                <strong>Note:</strong> Downloaded files may contain watermarks with patient 
                information and access details for compliance purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}