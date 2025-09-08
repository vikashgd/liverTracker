"use client";

import React, { useCallback, useState } from "react";
import { UploadFlowTabs } from "./upload-flow-tabs";
// import { ErrorBoundary } from "./error-boundary";
import { UploadFlowState } from "@/lib/upload-flow-state";
import { generateFileKey, generateBatchKey, generateTempPageKey, generateReportKey } from "@/lib/unique-id";

// Import existing medical uploader functions
async function signDownload(key: string) {
  const res = await fetch(`/api/storage/sign-download?key=${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error("sign-download failed");
  return res.json() as Promise<{ url: string }>;
}

async function extract(imageUrl: string, contentType?: string) {
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl, contentType }),
  });
  return res.json();
}

async function extractFromImages(imageUrls: string[]) {
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrls }),
  });
  return res.json();
}

async function convertPdfToImages(file: File): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  const pdfjsWorkerSrc = `/api/pdfjs/worker?v=${pdfjs.version}`;
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const imageUrls: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas 2d context");

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport, canvas }).promise;

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), "image/png", 0.95);
    });

    const res = await fetch(`/api/storage/upload?key=${encodeURIComponent(generateTempPageKey(pageNum))}`, {
      method: "POST",
      body: blob,
    });
    if (!res.ok) throw new Error(`Failed to upload page ${pageNum}`);
    const { key } = await res.json();
    const downloadRes = await signDownload(key);
    imageUrls.push(downloadRes.url);
  }

  return imageUrls;
}

export function EnhancedMedicalUploader() {
  const [flowState, setFlowState] = useState<UploadFlowState>({
    currentTab: 1,
    uploadedFiles: [],
    filePreviewUrls: [],
    isProcessing: false,
    processingProgress: 0,
    extractedData: null,
    editedData: null,
    isSaving: false,
    savedId: null,
    error: null,
    showProcessingOverlay: false,
    autoAdvanceEnabled: true,
    objectKey: null,
    allUploadedKeys: null
  });

  const updateFlowState = useCallback((updates: Partial<UploadFlowState>) => {
    setFlowState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFlow = useCallback(() => {
    setFlowState({
      currentTab: 1,
      uploadedFiles: [],
      filePreviewUrls: [],
      isProcessing: false,
      processingProgress: 0,
      extractedData: null,
      editedData: null,
      isSaving: false,
      savedId: null,
      error: null,
      showProcessingOverlay: false,
      autoAdvanceEnabled: true,
      objectKey: null,
      allUploadedKeys: null
    });
  }, []);

  const addFiles = useCallback((files: File[]) => {
    setFlowState(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...files],
      filePreviewUrls: [...prev.filePreviewUrls, ...files.map(file => URL.createObjectURL(file))]
    }));
  }, []);

  const removeFile = useCallback((index: number) => {
    setFlowState(prev => {
      const newFiles = prev.uploadedFiles.filter((_, i) => i !== index);
      const newUrls = prev.filePreviewUrls.filter((_, i) => i !== index);
      // Revoke the removed URL to prevent memory leaks
      if (prev.filePreviewUrls[index]) {
        URL.revokeObjectURL(prev.filePreviewUrls[index]);
      }
      return {
        ...prev,
        uploadedFiles: newFiles,
        filePreviewUrls: newUrls
      };
    });
  }, []);

  const clearAllFiles = useCallback(() => {
    setFlowState(prev => {
      // Revoke all URLs to prevent memory leaks
      prev.filePreviewUrls.forEach(url => URL.revokeObjectURL(url));
      return {
        ...prev,
        uploadedFiles: [],
        filePreviewUrls: []
      };
    });
  }, []);

  const handleFilesSelected = useCallback((files: File[]) => {
    addFiles(files);
    updateFlowState({ error: null });
  }, [addFiles, updateFlowState]);

  const handleFileRemoved = useCallback((index: number) => {
    removeFile(index);
  }, [removeFile]);

  const handleClearAllFiles = useCallback(() => {
    clearAllFiles();
    updateFlowState({ error: null });
  }, [clearAllFiles, updateFlowState]);

  const handleProcessFiles = useCallback(async () => {
    if (flowState.uploadedFiles.length === 0) {
      updateFlowState({ error: "No files selected for processing" });
      return;
    }

    updateFlowState({ isProcessing: true, error: null });

    try {
      // Validate files before processing
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      const invalidFiles = flowState.uploadedFiles.filter(file => {
        return !validTypes.includes(file.type) || file.size > maxSize;
      });
      
      if (invalidFiles.length > 0) {
        throw new Error(`Invalid files detected. Please ensure all files are images or PDFs under 10MB.`);
      }

      let extractionResult;
      const files = flowState.uploadedFiles;

      if (files.length === 1) {
        // Single file processing
        const file = files[0];
        const key = generateFileKey(file.name);
        
        const uploadRes = await fetch(`/api/storage/upload?key=${encodeURIComponent(key)}`, {
          method: "POST",
          body: file,
        });
        
        if (!uploadRes.ok) {
          const errorText = await uploadRes.text();
          throw new Error(`Upload failed: ${errorText || 'Unknown error'}`);
        }

        const { key: uploadedKey } = await uploadRes.json();

        // Store the actual uploaded key for later use
        updateFlowState({ objectKey: uploadedKey });

        if (file.type === "application/pdf") {
          const imageUrls = await convertPdfToImages(file);
          extractionResult = await extractFromImages(imageUrls);
        } else {
          const downloadRes = await signDownload(uploadedKey);
          extractionResult = await extract(downloadRes.url, file.type);
        }
      } else {
        // Multiple files processing
        console.log(`🔄 Processing ${files.length} files for batch upload...`);
        const imageUrls: string[] = [];
        const uploadedKeys: string[] = [];
        
        // Generate shared timestamp for all files in this batch
        const batchTimestamp = Date.now();
        const batchRandom = Math.floor(Math.random() * 1000);
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          // Use shared timestamp for all files in batch
          const key = `reports/${batchTimestamp}-batch-${i}-${batchRandom}-${file.name}`;
          
          console.log(`📤 Uploading file ${i + 1}/${files.length}: ${file.name} (${file.size} bytes)`);
          console.log(`🔑 Generated key: ${key}`);
          
          try {
            const uploadRes = await fetch(`/api/storage/upload?key=${encodeURIComponent(key)}`, {
              method: "POST",
              body: file,
            });
            
            if (!uploadRes.ok) {
              const errorText = await uploadRes.text();
              console.error(`❌ Upload failed for file ${i + 1}:`, errorText);
              throw new Error(`Failed to upload file ${i + 1} (${file.name}): ${errorText || 'Unknown error'}`);
            }

            const { key: uploadedKey } = await uploadRes.json();
            console.log(`✅ File ${i + 1} uploaded successfully: ${uploadedKey}`);
            uploadedKeys.push(uploadedKey);
            
            const downloadRes = await signDownload(uploadedKey);
            imageUrls.push(downloadRes.url);
          } catch (error) {
            console.error(`❌ Error uploading file ${i + 1}:`, error);
            throw error;
          }
        }

        console.log(`✅ All ${uploadedKeys.length} files uploaded successfully`);
        console.log(`📋 Uploaded keys:`, uploadedKeys);

        // Store all uploaded keys and the primary key for database
        updateFlowState({ 
          objectKey: uploadedKeys[0], // Primary key for database
          allUploadedKeys: uploadedKeys // All keys for multi-file display
        });
        extractionResult = await extractFromImages(imageUrls);
      }

      if (extractionResult?.error) {
        throw new Error(`AI extraction failed: ${extractionResult.error}`);
      }

      if (!extractionResult || Object.keys(extractionResult).length === 0) {
        throw new Error('No data could be extracted from the uploaded files');
      }

      updateFlowState({
        extractedData: extractionResult,
        isProcessing: false,
        currentTab: 2
      });
    } catch (err) {
      let errorMessage = "Processing failed";
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Categorize errors for better user experience
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = "Network error occurred. Please check your connection and try again.";
        } else if (err.message.includes('upload')) {
          errorMessage = "File upload failed. Please try again.";
        } else if (err.message.includes('Invalid files')) {
          errorMessage = err.message; // Keep validation messages as-is
        }
      }
      
      updateFlowState({
        error: errorMessage,
        isProcessing: false
      });
    }
  }, [flowState.uploadedFiles, updateFlowState]);

  const handleSaveReport = useCallback(async (editedData?: any) => {
    // Use edited data if provided, otherwise fall back to flow state
    const dataToSave = editedData || flowState.extractedData;
    
    if (!dataToSave) {
      updateFlowState({ error: "No data to save. Please process files first." });
      return;
    }

    updateFlowState({ isSaving: true, error: null });

    try {
      // Validate extracted data before saving
      if (typeof dataToSave !== 'object' || Object.keys(dataToSave).length === 0) {
        throw new Error('Invalid extracted data. Please process files again.');
      }

      // Use the stored objectKey from the upload process
      const key = flowState.objectKey || generateReportKey(flowState.uploadedFiles, flowState.uploadedFiles.length > 1);
      
      console.log('🔍 Enhanced Uploader - Saving with data:', {
        reportDate: dataToSave?.reportDate,
        dataKeys: Object.keys(dataToSave)
      });
      
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectKey: key,
          contentType: flowState.uploadedFiles.length > 1 ? "image/batch" : (flowState.uploadedFiles[0]?.type ?? "application/octet-stream"),
          reportDate: dataToSave?.reportDate, // Send manual date at top level for priority
          extracted: dataToSave,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        let errorMessage = `Save failed (${res.status})`;
        
        // Parse error response for better user messages
        try {
          const errorData = JSON.parse(txt);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If not JSON, use the raw text (truncated)
          errorMessage = `Save failed: ${txt.slice(0, 100)}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await res.json();
      
      if (!result.id) {
        throw new Error('Save completed but no report ID was returned');
      }

      updateFlowState({
        savedId: result.id,
        isSaving: false,
        currentTab: 3
      });
    } catch (err) {
      let errorMessage = "Save failed";
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Categorize errors for better user experience
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = "Network error occurred while saving. Please try again.";
        } else if (err.message.includes('500')) {
          errorMessage = "Server error occurred. Please try again in a moment.";
        } else if (err.message.includes('401') || err.message.includes('403')) {
          errorMessage = "Authentication error. Please refresh the page and try again.";
        }
      }
      
      updateFlowState({
        error: errorMessage,
        isSaving: false
      });
    }
  }, [flowState.extractedData, flowState.uploadedFiles, updateFlowState]);

  const handleResetFlow = useCallback(() => {
    resetFlow();
  }, [resetFlow]);

  return (
    <div className="enhanced-medical-uploader">
      <UploadFlowTabs
        flowState={flowState}
        onFlowStateChange={updateFlowState}
        onFilesSelected={handleFilesSelected}
        onFileRemoved={handleFileRemoved}
        onClearAllFiles={handleClearAllFiles}
        onProcessFiles={handleProcessFiles}
        onSaveReport={handleSaveReport}
        onResetFlow={handleResetFlow}
      />
    </div>
  );
}

// Backward compatibility - export as MedicalUploader
export { EnhancedMedicalUploader as MedicalUploader };