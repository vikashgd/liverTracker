"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Camera, FileText, X, Plus, Trash2, Eye } from "lucide-react";

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

type MetricKV = { value: number | null; unit: string | null };
type ImagingOrgan = { name: string; size?: { value: number | null; unit: string | null } | null; notes?: string | null };
type ExtractionResult = {
  reportType?: string | null;
  reportDate?: string | null;
  metrics?: Record<string, MetricKV | null>;
  metricsAll?: { name: string; value: number | null; unit: string | null; category?: string | null }[] | null;
  imaging?: {
    modality?: string | null;
    organs?: ImagingOrgan[] | null;
    findings?: string[] | null;
  } | null;
} | null;

type PdfPageViewport = { width: number; height: number };

async function getPdfJsModule() {
  const pdfjs = await import("pdfjs-dist");
  // Force fresh worker load with timestamp to avoid caching issues
  const timestamp = Date.now();
  const pdfjsWorkerSrc = `/api/pdfjs/worker?v=${pdfjs.version}&t=${timestamp}`;
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
  return pdfjs;
}

async function convertPdfToImages(file: File): Promise<string[]> {
  const pdfjs = await getPdfJsModule();
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

    const res = await fetch(`/api/storage/upload?key=${encodeURIComponent(`tmp/pages/${Date.now()}-${pageNum}.png`)}`, {
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

export function MedicalUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState<ExtractionResult>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [objectKey, setObjectKey] = useState<string | null>(null);

  // Handle file selection (single or multiple)
  const handleFilesChange = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const fileArray = Array.from(newFiles);
    setFiles(fileArray);
    setEdited(null);
    setSavedId(null);
    setError(null);
    setObjectKey(null);
    setBusy(false);
    setExtracting(false);
    setSaving(false);
  };

  // Add more files to existing selection
  const addMoreFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const fileArray = Array.from(newFiles);
    setFiles(prev => [...prev, ...fileArray]);
    setEdited(null);
    setSavedId(null);
    setError(null);
    setBusy(false);
    setExtracting(false);
    setSaving(false);
  };

  // Remove file from selection
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Reset everything including clearing the file inputs
  const resetUploader = () => {
    const fileInput = document.querySelector('#medical-file-upload') as HTMLInputElement;
    const cameraInput = document.querySelector('#medical-camera-upload') as HTMLInputElement;
    
    if (fileInput) fileInput.value = '';
    if (cameraInput) cameraInput.value = '';
    
    setFiles([]);
    setEdited(null);
    setSavedId(null);
    setError(null);
    setObjectKey(null);
    setBusy(false);
    setExtracting(false);
    setSaving(false);
  };

  const onUpload = async () => {
    if (files.length === 0 || extracting || saving || savedId) return;
    setExtracting(true);
    setBusy(true);
    setError(null);

    try {
      let extractionResult;

      if (files.length === 1) {
        // Single file upload
        const file = files[0];
        const key = `reports/${Date.now()}-${file.name}`;
        const uploadRes = await fetch(`/api/storage/upload?key=${encodeURIComponent(key)}`, {
          method: "POST",
          body: file,
        });
        if (!uploadRes.ok) throw new Error("Upload failed");

        const { key: uploadedKey } = await uploadRes.json();
        setObjectKey(uploadedKey);

        if (file.type === "application/pdf") {
          const imageUrls = await convertPdfToImages(file);
          extractionResult = await extractFromImages(imageUrls);
        } else {
          const downloadRes = await signDownload(uploadedKey);
          extractionResult = await extract(downloadRes.url, file.type);
        }
      } else {
        // Multiple files upload
        const imageUrls: string[] = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const key = `reports/${Date.now()}-batch-${i}-${file.name}`;
          const uploadRes = await fetch(`/api/storage/upload?key=${encodeURIComponent(key)}`, {
            method: "POST",
            body: file,
          });
          if (!uploadRes.ok) throw new Error(`Failed to upload file ${i + 1}`);

          const { key: uploadedKey } = await uploadRes.json();
          const downloadRes = await signDownload(uploadedKey);
          imageUrls.push(downloadRes.url);
        }

        // Set the main object key with proper extension
        const firstFile = files[0];
        const extension = firstFile?.name ? firstFile.name.split('.').pop() : 'jpg';
        const mainKey = `reports/${Date.now()}-batch-report.${extension}`;
        setObjectKey(mainKey);

        // Extract from all images at once
        extractionResult = await extractFromImages(imageUrls);
      }

      if (extractionResult?.error) {
        throw new Error(extractionResult.error);
      }

      setEdited(extractionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Modern Upload Options Section */}
      <div className="modern-upload-card">
        <div className="text-center">
          <div className="w-16 h-16 bg-medical-primary-100 rounded-xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-medical-primary-600" />
          </div>
          
          <h2 className="text-xl font-semibold text-medical-neutral-900 mb-2">
            Upload Medical Report
          </h2>
          <p className="text-medical-neutral-600 mb-6">
            Choose how you'd like to upload your medical report
          </p>
          
          {/* Upload Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* File Upload Option */}
            <label htmlFor="medical-file-upload" className="modern-upload-option cursor-pointer">
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
                id="medical-file-upload"
                type="file" 
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => handleFilesChange(e.target.files)}
                className="hidden"
                aria-describedby="file-help"
              />
            </label>
            
            {/* Camera Option - Works for both taking photos and uploading */}
            <label htmlFor="medical-camera-upload" className="modern-upload-option cursor-pointer">
              <div className="flex flex-col items-center p-6 border-2 border-medical-neutral-200 rounded-xl hover:border-medical-success-400 hover:bg-medical-success-50 transition-all">
                <div className="w-12 h-12 bg-medical-success-100 rounded-lg flex items-center justify-center mb-3">
                  <Camera className="w-6 h-6 text-medical-success-600" />
                </div>
                <h3 className="font-medium text-medical-neutral-900 mb-1">Take Photos</h3>
                <p className="text-sm text-medical-neutral-600 text-center">
                  {files.length > 0 ? 'Add more photos' : 'Capture photos with camera'}
                </p>
              </div>
              <Input 
                id="medical-camera-upload"
                type="file" 
                accept="image/*"
                multiple
                capture="environment"
                onChange={(e) => files.length > 0 ? addMoreFiles(e.target.files) : handleFilesChange(e.target.files)}
                className="hidden"
                aria-describedby="camera-help"
              />
            </label>
          </div>

          {/* File Preview Section */}
          {files.length > 0 && (
            <div className="bg-medical-neutral-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-medical-neutral-900">
                  Selected Files ({files.length})
                </h4>
                <Button
                  onClick={() => setFiles([])}
                  variant="ghost"
                  size="sm"
                  className="text-medical-neutral-600 hover:text-medical-neutral-900"
                >
                  Clear All
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {files.map((file, index) => {
                  const imageUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
                  
                  return (
                    <div key={`${file.name}-${index}`} className="relative group">
                      <div className="aspect-square bg-white rounded-lg border-2 border-medical-neutral-200 overflow-hidden relative">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={imageUrl!}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image load error:', e);
                              // Fallback to file icon if image fails to load
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
                        
                        {/* Always visible delete button */}
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                          title="Remove this file"
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
                      
                      {/* File name below preview */}
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
                Total size: {(files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          )}
          
          <div className="text-left bg-medical-neutral-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-medical-neutral-900 mb-2">Supported Formats:</h4>
            <ul className="text-sm text-medical-neutral-600 space-y-1">
              <li>• PDF files (multi-page reports)</li>
              <li>• Images: JPG, PNG, HEIC</li>
              <li>• Single or multiple files</li>
              <li>• Maximum size: 10MB per file</li>
              <li>• Multiple files processed together for better accuracy</li>
            </ul>
          </div>
          

          
          <Button 
            onClick={onUpload} 
            disabled={files.length === 0 || busy || extracting || !!savedId}
            className="btn-primary mt-4 px-8"
            aria-describedby={extracting ? "extraction-status" : undefined}
          >
            {extracting ? (
              <div className="flex items-center space-x-2">
                <div className="loading-spinner"></div>
                <span>
                  {files.length > 1 ? `Processing ${files.length} Files...` : 'Extracting Data...'}
                </span>
              </div>
            ) : busy ? (
              <div className="flex items-center space-x-2">
                <div className="loading-spinner"></div>
                <span>
                  {files.length > 1 ? `Uploading ${files.length} Files...` : 'Uploading...'}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>🔬</span>
                <span>
                  {files.length > 1 ? `Process ${files.length} Files` : 'Upload & Extract'}
                </span>
              </div>
            )}
          </Button>
          
          {(extracting || busy) && (
            <p id="extraction-status" className="text-sm text-medical-neutral-600 mt-2">
              {files.length > 1 
                ? `Processing ${files.length} medical files with AI...` 
                : 'Processing your medical report with AI...'}
            </p>
          )}
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="error-message" role="alert" aria-live="polite">
          <div className="flex items-center space-x-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Extracted Data Review Section */}
      {edited && (
        <div className="medical-card-primary">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-medical-success-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">✓</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-medical-neutral-900">
                Extracted Medical Data
              </h3>
              <p className="text-sm text-medical-neutral-600">
                Review and verify the extracted information before saving
              </p>
            </div>
          </div>
          
          {/* Report Metadata */}
          <div className="bg-medical-neutral-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-medical-neutral-900 mb-3">Report Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="report-type" className="block text-sm font-medium text-medical-neutral-700 mb-1">
                  Report Type
                </label>
                <Input 
                  id="report-type"
                  value={edited.reportType || ""} 
                  onChange={(e) => setEdited({...edited, reportType: e.target.value})}
                  placeholder="e.g., Blood Test, Liver Function Test"
                  className="text-sm"
                />
              </div>
              <div>
                <label htmlFor="report-date" className="block text-sm font-medium text-medical-neutral-700 mb-1">
                  Report Date
                </label>
                <Input 
                  id="report-date"
                  type="date"
                  value={edited.reportDate || ""} 
                  onChange={(e) => setEdited({...edited, reportDate: e.target.value})}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Lab Values */}
          {edited.metricsAll && edited.metricsAll.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-medical-neutral-900 mb-3 flex items-center space-x-2">
                <span>🧪</span>
                <span>Laboratory Values</span>
              </h4>
              <div className="space-y-3">
                {edited.metricsAll.map((metric, i) => (
                  <div key={i} className="bg-white border border-medical-neutral-200 rounded-lg p-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor={`metric-name-${i}`} className="block text-xs font-medium text-medical-neutral-600 mb-1">
                          Test Name
                        </label>
                        <Input 
                          id={`metric-name-${i}`}
                          value={metric.name || ""} 
                          onChange={(e) => {
                            const newMetrics = [...edited.metricsAll!];
                            newMetrics[i] = {...newMetrics[i], name: e.target.value};
                            setEdited({...edited, metricsAll: newMetrics});
                          }}
                          placeholder="Metric name"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor={`metric-value-${i}`} className="block text-xs font-medium text-medical-neutral-600 mb-1">
                          Value
                        </label>
                        <Input 
                          id={`metric-value-${i}`}
                          type="number" 
                          step="any"
                          value={metric.value ?? ""} 
                          onChange={(e) => {
                            const newMetrics = [...edited.metricsAll!];
                            const val = e.target.value ? parseFloat(e.target.value) : null;
                            newMetrics[i] = {...newMetrics[i], value: val};
                            setEdited({...edited, metricsAll: newMetrics});
                          }}
                          placeholder="Value"
                          className="text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor={`metric-unit-${i}`} className="block text-xs font-medium text-medical-neutral-600 mb-1">
                          Unit
                        </label>
                        <Input 
                          id={`metric-unit-${i}`}
                          value={metric.unit || ""} 
                          onChange={(e) => {
                            const newMetrics = [...edited.metricsAll!];
                            newMetrics[i] = {...newMetrics[i], unit: e.target.value};
                            setEdited({...edited, metricsAll: newMetrics});
                          }}
                          placeholder="Unit"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const newMetrics = [...(edited.metricsAll || []), { name: "", value: null, unit: "" }];
                  setEdited({...edited, metricsAll: newMetrics});
                }}
                className="btn-secondary mt-3"
              >
                <span className="mr-2">+</span>
                Add Lab Value
              </Button>
            </div>
          )}

          {/* Imaging Findings */}
          {edited.imaging && edited.imaging.findings && edited.imaging.findings.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-medical-neutral-900 mb-3 flex items-center space-x-2">
                <span>🔍</span>
                <span>Imaging Findings</span>
              </h4>
              <div className="space-y-3">
                {edited.imaging.findings.map((finding, i) => (
                  <div key={i} className="bg-white border border-medical-neutral-200 rounded-lg p-3">
                    <label htmlFor={`finding-${i}`} className="block text-xs font-medium text-medical-neutral-600 mb-1">
                      Finding {i + 1}
                    </label>
                    <Input 
                      id={`finding-${i}`}
                      value={finding || ""} 
                      onChange={(e) => {
                        const newFindings = [...edited.imaging!.findings!];
                        newFindings[i] = e.target.value;
                        setEdited({
                          ...edited, 
                          imaging: {
                            ...edited.imaging!,
                            findings: newFindings
                          }
                        });
                      }}
                      placeholder="Finding description"
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-medical-neutral-200 pt-6">
            {!savedId && edited && (
              <Button
                onClick={async () => {
                  if (!edited || saving || savedId) return;
                  if (!edited.reportDate || edited.reportDate.trim() === "") {
                    setError("Please enter the report date (YYYY-MM-DD)");
                    return;
                  }
                  setSaving(true);
                  setBusy(true);
                  setError(null);
                  const key = objectKey ?? (() => {
                    if (files.length > 1) {
                      const firstFile = files[0];
                      const extension = firstFile?.name ? firstFile.name.split('.').pop() : 'jpg';
                      return `reports/${Date.now()}-batch-report.${extension}`;
                    } else {
                      return `reports/${Date.now()}-${files[0]?.name ?? "report.pdf"}`;
                    }
                  })();
                  try {
                    const res = await fetch("/api/reports", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        objectKey: key,
                        contentType: files.length > 1 ? "image/batch" : (files[0]?.type ?? "application/octet-stream"),
                        reportDate: edited.reportDate, // Send manual date at top level for priority
                        extracted: edited,
                      }),
                    });
                    if (!res.ok) {
                      const txt = await res.text();
                      setError(`Save failed (${res.status}): ${txt.slice(0, 200)}`);
                    } else {
                      const j = await res.json();
                      setSavedId(j.id);
                    }
                  } catch (e) {
                    setError(String(e));
                  } finally {
                    setBusy(false);
                    setSaving(false);
                  }
                }}
                disabled={saving || busy || !edited}
                className="btn-success w-full md:w-auto"
                aria-describedby={saving ? "save-status" : undefined}
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="loading-spinner"></div>
                    <span>Saving Report...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>💾</span>
                    <span>Save Medical Report</span>
                  </div>
                )}
              </Button>
            )}
            
            {saving && (
              <p id="save-status" className="text-sm text-medical-neutral-600 mt-2">
                Securely saving your medical data...
              </p>
            )}

            {/* Success State */}
            {savedId && (
              <div className="space-y-4">
                <div className="success-message">
                  <div className="flex items-center space-x-2">
                    <span>✅</span>
                    <span className="font-medium">Report saved successfully!</span>
                  </div>
                  <p className="text-sm mt-1">
                    Your medical data has been securely processed and saved.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <a 
                    href={`/reports/${savedId}`} 
                    className="btn-primary text-center"
                  >
                    <span className="mr-2">👁️</span>
                    View Report Details
                  </a>
                  <Button
                    onClick={resetUploader}
                    className="btn-secondary"
                  >
                    <span className="mr-2">📄</span>
                    Upload New Report
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
