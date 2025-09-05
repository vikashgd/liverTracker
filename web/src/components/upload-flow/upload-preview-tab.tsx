"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Camera, FileText, X, Loader2 } from "lucide-react";
import { UploadFlowState } from "@/lib/upload-flow-state";

export interface UploadPreviewTabProps {
  flowState: UploadFlowState;
  onFilesSelected: (files: File[]) => void;
  onFileRemoved: (index: number) => void;
  onUploadAndExtract: () => void;
  onClearAll: () => void;
}

export function UploadPreviewTab({
  flowState,
  onFilesSelected,
  onFileRemoved,
  onUploadAndExtract,
  onClearAll
}: UploadPreviewTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection (single or multiple)
  const handleFilesChange = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const fileArray = Array.from(newFiles);
    onFilesSelected(fileArray);
  };

  // Add more files to existing selection
  const addMoreFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const fileArray = Array.from(newFiles);
    const combinedFiles = [...flowState.uploadedFiles, ...fileArray];
    onFilesSelected(combinedFiles);
  };

  // Clear file inputs when clearing all files
  const handleClearAll = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    onClearAll();
  };

  const hasFiles = flowState.uploadedFiles.length > 0;

  return (
    <div className="upload-preview-tab">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-medical-primary-100 rounded-xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-8 h-8 text-medical-primary-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-medical-neutral-900 mb-2">
          Upload Medical Report
        </h2>
        <p className="text-medical-neutral-600 mb-6">
          Choose how you'd like to upload your medical report
        </p>
      </div>

      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* File Upload Option */}
        <label htmlFor="medical-file-upload" className="upload-option cursor-pointer">
          <div className="flex flex-col items-center p-6 border-2 border-medical-neutral-200 rounded-xl hover:border-medical-primary-400 hover:bg-medical-primary-50 transition-all">
            <div className="w-12 h-12 bg-medical-primary-100 rounded-lg flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-medical-primary-600" />
            </div>
            <h3 className="font-medium text-medical-neutral-900 mb-1">Choose Files</h3>
            <p className="text-sm text-medical-neutral-600 text-center">
              Upload PDF or images from storage
            </p>
          </div>
          <Input 
            ref={fileInputRef}
            id="medical-file-upload"
            type="file" 
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => handleFilesChange(e.target.files)}
            className="hidden"
            aria-describedby="file-help"
          />
        </label>
        
        {/* Camera Option */}
        <label htmlFor="medical-camera-upload" className="upload-option cursor-pointer">
          <div className="flex flex-col items-center p-6 border-2 border-medical-neutral-200 rounded-xl hover:border-medical-success-400 hover:bg-medical-success-50 transition-all">
            <div className="w-12 h-12 bg-medical-success-100 rounded-lg flex items-center justify-center mb-3">
              <Camera className="w-6 h-6 text-medical-success-600" />
            </div>
            <h3 className="font-medium text-medical-neutral-900 mb-1">Take Photos</h3>
            <p className="text-sm text-medical-neutral-600 text-center">
              {hasFiles ? 'Add more photos' : 'Capture photos with camera'}
            </p>
          </div>
          <Input 
            ref={cameraInputRef}
            id="medical-camera-upload"
            type="file" 
            accept="image/*"
            multiple
            capture="environment"
            onChange={(e) => hasFiles ? addMoreFiles(e.target.files) : handleFilesChange(e.target.files)}
            className="hidden"
            aria-describedby="camera-help"
          />
        </label>
      </div>

      {/* File Preview Section */}
      {hasFiles && (
        <div className="file-preview-section bg-medical-neutral-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-medical-neutral-900">
              Selected Files ({flowState.uploadedFiles.length})
            </h4>
            <Button
              onClick={handleClearAll}
              variant="ghost"
              size="sm"
              className="text-medical-neutral-600 hover:text-medical-neutral-900"
            >
              Clear All
            </Button>
          </div>
          
          <div className="file-preview-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {flowState.uploadedFiles.map((file, index) => {
              const imageUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
              
              return (
                <div key={`${file.name}-${index}`} className="file-preview-item relative group">
                  <div className="aspect-square bg-white rounded-lg border-2 border-medical-neutral-200 overflow-hidden relative">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={imageUrl!}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Silently handle image load errors during preview
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-medical-neutral-100">
                        <FileText className="w-8 h-8 text-medical-neutral-600 mb-2" />
                        <span className="text-xs text-medical-neutral-600 text-center px-2">
                          {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                        </span>
                      </div>
                    )}
                    
                    {/* Delete button */}
                    <button
                      onClick={() => onFileRemoved(index)}
                      className="delete-button absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      title="Remove this file"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    
                    {/* File number badge */}
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                    
                    {/* File type badge */}
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      {file.type.includes('pdf') ? 'PDF' : 'IMG'}
                    </div>
                  </div>
                  
                  {/* File info */}
                  <div className="mt-2 text-xs text-medical-neutral-600 text-center truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-medical-neutral-500 text-center">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-3 text-sm text-medical-neutral-600">
            Total size: {(flowState.uploadedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)} MB
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="info-section text-left bg-medical-neutral-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-medical-neutral-900 mb-2">Supported Formats:</h4>
        <ul className="text-sm text-medical-neutral-600 space-y-1">
          <li>• PDF files (multi-page reports)</li>
          <li>• Images: JPG, PNG, HEIC</li>
          <li>• Single or multiple files</li>
          <li>• Maximum size: 10MB per file</li>
          <li>• Multiple files processed together for better accuracy</li>
        </ul>
      </div>

      {/* Upload & Extract Button */}
      {hasFiles && (
        <div className="upload-extract-button-container flex justify-center">
          <Button 
            onClick={onUploadAndExtract}
            className="btn-primary px-8 py-3 text-lg min-w-[200px] h-[52px]"
            disabled={!hasFiles || flowState.isProcessing}
            aria-label="Upload files and extract medical data"
            aria-describedby="upload-extract-help"
          >
            <div className="flex items-center space-x-2">
              {flowState.isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload & Extract</span>
                </>
              )}
            </div>
          </Button>
        </div>
      )}

      {/* Help Text */}
      <div id="upload-extract-help" className="sr-only">
        Upload your selected files and immediately start extracting medical parameters using AI analysis
      </div>

      {/* Error Display */}
      {flowState.error && (
        <div className="error-message mt-4" role="alert" aria-live="polite">
          <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <span>⚠️</span>
            <span>{flowState.error}</span>
          </div>
        </div>
      )}
    </div>
  );
}