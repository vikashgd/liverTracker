'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { offlineStorage } from '@/lib/offline-storage';

interface OfflineUploaderProps {
  onUploadSuccess?: (fileId: string) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

export function OfflineUploader({ 
  onUploadSuccess, 
  onUploadError, 
  maxFiles = 5,
  acceptedFileTypes = ['application/pdf', 'image/*']
}: OfflineUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<Array<{
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
  }>>([]);

  const processFile = async (file: File): Promise<string> => {
    // Convert file to base64 for offline storage
    const base64Data = await fileToBase64(file);
    
    // Create medical record for offline storage
    const recordId = await offlineStorage.saveMedicalRecord({
      type: 'report',
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileData: base64Data,
        uploadDate: new Date().toISOString(),
        isOfflineUpload: true
      },
      syncStatus: 'pending',
      metadata: {
        source: 'upload',
        category: getFileCategory(file.type),
        reportDate: new Date().toISOString()
      }
    });

    return recordId;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to store only base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getFileCategory = (fileType: string): string => {
    if (fileType.includes('pdf')) return 'lab-report';
    if (fileType.includes('image')) return 'medical-image';
    return 'document';
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsProcessing(true);

    // Add files to upload queue
    const newQueueItems = acceptedFiles.map(file => ({
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'pending' as const,
      progress: 0
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);

    // Process each file
    for (const queueItem of newQueueItems) {
      try {
        // Update status to processing
        setUploadQueue(prev => prev.map(item => 
          item.id === queueItem.id 
            ? { ...item, status: 'processing', progress: 20 }
            : item
        ));

        // Simulate processing progress
        await new Promise(resolve => setTimeout(resolve, 500));
        setUploadQueue(prev => prev.map(item => 
          item.id === queueItem.id 
            ? { ...item, progress: 60 }
            : item
        ));

        // Process the file
        const recordId = await processFile(queueItem.file);

        // Update status to completed
        setUploadQueue(prev => prev.map(item => 
          item.id === queueItem.id 
            ? { ...item, status: 'completed', progress: 100 }
            : item
        ));

        // Notify success
        onUploadSuccess?.(recordId);

      } catch (error) {
        console.error('File processing failed:', error);
        
        // Update status to error
        setUploadQueue(prev => prev.map(item => 
          item.id === queueItem.id 
            ? { 
                ...item, 
                status: 'error', 
                progress: 0,
                error: error instanceof Error ? error.message : 'Processing failed'
              }
            : item
        ));

        // Notify error
        onUploadError?.(error instanceof Error ? error.message : 'Processing failed');
      }
    }

    setIsProcessing(false);

    // Clear completed items after 3 seconds
    setTimeout(() => {
      setUploadQueue(prev => prev.filter(item => item.status === 'error'));
    }, 3000);

  }, [onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isProcessing
  });

  const clearQueue = () => {
    setUploadQueue([]);
  };

  const retryFailedUploads = async () => {
    const failedItems = uploadQueue.filter(item => item.status === 'error');
    
    for (const item of failedItems) {
      try {
        setUploadQueue(prev => prev.map(queueItem => 
          queueItem.id === item.id 
            ? { ...queueItem, status: 'processing', progress: 20, error: undefined }
            : queueItem
        ));

        const recordId = await processFile(item.file);

        setUploadQueue(prev => prev.map(queueItem => 
          queueItem.id === item.id 
            ? { ...queueItem, status: 'completed', progress: 100 }
            : queueItem
        ));

        onUploadSuccess?.(recordId);

      } catch (error) {
        setUploadQueue(prev => prev.map(queueItem => 
          queueItem.id === item.id 
            ? { 
                ...queueItem, 
                status: 'error', 
                progress: 0,
                error: error instanceof Error ? error.message : 'Retry failed'
              }
            : queueItem
        ));
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-50 border-gray-200 text-gray-700';
      case 'processing': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'completed': return 'bg-green-50 border-green-200 text-green-700';
      case 'error': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="text-4xl">
            {isDragActive ? '📤' : '📋'}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {isDragActive ? 'Drop files here!' : 'Upload Medical Reports'}
            </h3>
            <p className="text-gray-600">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports PDF, images • Max {maxFiles} files • Up to 10MB each
            </p>
          </div>

          {/* Offline Notice */}
          {!navigator.onLine && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                🔄 <strong>Offline Mode:</strong> Files will be stored locally and synced when connection is restored.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">Some files were rejected:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                <strong>{file.name}</strong>: {errors.map(e => e.message).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-800">Upload Progress</h4>
            <div className="flex space-x-2">
              {uploadQueue.some(item => item.status === 'error') && (
                <button
                  onClick={retryFailedUploads}
                  className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Retry Failed
                </button>
              )}
              <button
                onClick={clearQueue}
                className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {uploadQueue.map((item) => (
              <div 
                key={item.id}
                className={`
                  border rounded-lg p-3 transition-all duration-200
                  ${getStatusColor(item.status)}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(item.status)}</span>
                    <span className="font-medium text-sm truncate max-w-xs">
                      {item.file.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({(item.file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  <span className="text-xs font-medium">
                    {item.status === 'processing' ? `${item.progress}%` : item.status}
                  </span>
                </div>

                {/* Progress Bar */}
                {item.status === 'processing' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                )}

                {/* Error Message */}
                {item.error && (
                  <p className="text-xs text-red-600 mt-2">
                    Error: {item.error}
                  </p>
                )}

                {/* Success Message */}
                {item.status === 'completed' && (
                  <p className="text-xs text-green-600 mt-2">
                    ✅ Saved offline - will sync when online
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600">
          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-sm font-medium">Processing files...</span>
        </div>
      )}
    </div>
  );
}
