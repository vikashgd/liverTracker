"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
interface PdfPageLike {
  getViewport(params: { scale: number }): PdfPageViewport;
  render(params: { canvasContext: CanvasRenderingContext2D; viewport: PdfPageViewport }): { promise: Promise<void> };
}

async function getPdfJsModule() {

  const pdfjs = await import("pdfjs-dist");
  const pdfjsWorkerSrc = `/api/pdfjs/worker?v=${pdfjs.version}`;
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
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState<ExtractionResult>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [objectKey, setObjectKey] = useState<string | null>(null);

  // Reset all states when a new file is selected
  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
    setEdited(null);
    setSavedId(null);
    setError(null);
    setObjectKey(null);
    setBusy(false);
    setExtracting(false);
    setSaving(false);
  };

  // Reset everything including clearing the file input
  const resetUploader = () => {
    const fileInput = document.querySelector('#medical-file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    handleFileChange(null);
  };

  const onUpload = async () => {
    if (!file || extracting || saving || savedId) return;
    setExtracting(true);
    setBusy(true);
    setError(null);

    try {
      const key = `reports/${Date.now()}-${file.name}`;
      const uploadRes = await fetch(`/api/storage/upload?key=${encodeURIComponent(key)}`, {
        method: "POST",
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      const { key: uploadedKey } = await uploadRes.json();
      setObjectKey(uploadedKey);

      let extractionResult;
      if (file.type === "application/pdf") {
        const imageUrls = await convertPdfToImages(file);
        extractionResult = await extractFromImages(imageUrls);
      } else {
        const downloadRes = await signDownload(uploadedKey);
        extractionResult = await extract(downloadRes.url, file.type);
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
      {/* File Upload Section */}
      <div className="medical-card p-6 border-2 border-dashed border-medical-neutral-300 hover:border-medical-primary-400 transition-colors">
        <div className="text-center">
          <div className="w-12 h-12 bg-medical-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📄</span>
          </div>
          
          <div className="space-y-3">
            <label htmlFor="medical-file-upload" className="block">
              <span className="text-lg font-medium text-medical-neutral-900 mb-2 block">
                Select Medical Report
              </span>
              <Input 
                id="medical-file-upload"
                type="file" 
                accept="image/*,application/pdf" 
                capture="environment"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="file:btn-secondary file:border-0 file:text-medical-neutral-700"
                aria-describedby="file-help"
              />
            </label>
            
            <p id="file-help" className="text-sm text-medical-neutral-600">
              Supports PDF files and images (JPG, PNG). Maximum size: 10MB
            </p>
            
            {file && (
              <div className="bg-medical-primary-50 border border-medical-primary-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-medical-primary-600">📋</span>
                  <span className="text-sm font-medium text-medical-primary-800">
                    {file.name}
                  </span>
                  <span className="text-xs text-medical-primary-600">
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            onClick={onUpload} 
            disabled={!file || busy || extracting || !!savedId}
            className="btn-primary mt-4 px-8"
            aria-describedby={extracting ? "extraction-status" : undefined}
          >
            {extracting ? (
              <div className="flex items-center space-x-2">
                <div className="loading-spinner"></div>
                <span>Extracting Data...</span>
              </div>
            ) : busy ? (
              <div className="flex items-center space-x-2">
                <div className="loading-spinner"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>🔬</span>
                <span>Upload & Extract</span>
              </div>
            )}
          </Button>
          
          {(extracting || busy) && (
            <p id="extraction-status" className="text-sm text-medical-neutral-600 mt-2">
              Processing your medical report with AI...
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
                  const key = objectKey ?? `reports/${Date.now()}-${file?.name ?? "report"}`;
                  try {
                    const res = await fetch("/api/reports", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        objectKey: key,
                        contentType: file?.type ?? "application/octet-stream",
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
