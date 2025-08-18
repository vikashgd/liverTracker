"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
//


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
interface PdfDocumentLike {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPageLike>;
}
type PdfLoadingTask = { promise: Promise<PdfDocumentLike> };
type PdfJsWithVersion = {
  version?: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(src: { data: ArrayBuffer }): PdfLoadingTask;
};

export function Uploader() {
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
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
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
    // Server-side proxy upload to avoid CORS
    await fetch(`/api/storage/upload?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    setObjectKey(key);
    const { url: readUrl } = await signDownload(key);
    let json: ExtractionResult | null = null;
    if ((file.type || "").includes("pdf")) {
      // Client-side: render PDF pages to images and upload each page
      const arrayBuf = await file.arrayBuffer();
      const pdfjsLib = (await import("pdfjs-dist")) as unknown as PdfJsWithVersion;
      const version = pdfjsLib.version ?? "5.4.54";
      // Serve worker via our API to avoid CORS and version mismatch
      pdfjsLib.GlobalWorkerOptions.workerSrc = `/api/pdfjs/worker?v=${encodeURIComponent(version)}`;
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuf });
      const pdf: PdfDocumentLike = await loadingTask.promise;
      const maxPages = Math.min(pdf.numPages, 10);
      const uploadedUrls: string[] = [];
      for (let i = 1; i <= maxPages; i++) {
        const page: PdfPageLike = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
        if (!blob) continue;
        const pageKey = `tmp/pages/${Date.now()}-${i}.png`;
        await fetch(`/api/storage/upload?key=${encodeURIComponent(pageKey)}`, {
          method: "POST",
          headers: { "Content-Type": "image/png" },
          body: blob,
        });
        const { url } = await signDownload(pageKey);
        uploadedUrls.push(url);
      }
      json = await extractFromImages(uploadedUrls);
    } else {
      json = await extract(readUrl, file.type || undefined);
    }
    setEdited(JSON.parse(JSON.stringify(json)));
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
    setBusy(false);
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input type="file" accept="image/*,application/pdf" capture="environment" onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
        <Button onClick={onUpload} disabled={!file || busy || extracting || !!savedId}>
          {extracting ? "Extracting..." : busy ? "Uploading..." : "Upload & Extract"}
        </Button>
      </div>
      {edited && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Report Type</div>
                <Input
                  value={edited.reportType ?? ""}
                  onChange={(e) => setEdited({ ...edited, reportType: e.target.value })}
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Report Date (YYYY-MM-DD)</div>
                <Input
                  type="date"
                  value={edited.reportDate ?? ""}
                  onChange={(e) => setEdited({ ...edited, reportDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {edited.metrics && (
            <div className="rounded-xl border p-4 space-y-2">
              <div className="font-medium">Key metrics</div>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(edited.metrics).map(([name, mv]) => (
                  <div key={name} className="space-y-1">
                    <div className="text-xs text-muted-foreground">{name}</div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="value"
                        value={mv?.value ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          setEdited({
                            ...edited,
                            metrics: { ...edited.metrics!, [name]: { value: Number.isFinite(v as number) ? (v as number) : null, unit: mv?.unit ?? null } },
                          });
                        }}
                      />
                      <Input
                        placeholder="unit"
                        value={mv?.unit ?? ""}
                        onChange={(e) => {
                          setEdited({
                            ...edited,
                            metrics: { ...edited.metrics!, [name]: { value: mv?.value ?? null, unit: e.target.value || null } },
                          });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {edited.metricsAll && edited.metricsAll.length > 0 && (
            <div className="rounded-xl border p-4 space-y-2">
              <div className="font-medium">All lab analytes</div>
              <div className="grid grid-cols-2 gap-3">
                {edited.metricsAll.map((m, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        placeholder="name"
                        value={m.name}
                        onChange={(e) => {
                          const arr = [...(edited.metricsAll ?? [])];
                          arr[idx] = { ...arr[idx], name: e.target.value };
                          setEdited({ ...edited, metricsAll: arr });
                        }}
                      />
                      <Input
                        placeholder="value"
                        value={m.value ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          const arr = [...(edited.metricsAll ?? [])];
                          arr[idx] = { ...arr[idx], value: Number.isFinite(v as number) ? (v as number) : null };
                          setEdited({ ...edited, metricsAll: arr });
                        }}
                      />
                      <Input
                        placeholder="unit"
                        value={m.unit ?? ""}
                        onChange={(e) => {
                          const arr = [...(edited.metricsAll ?? [])];
                          arr[idx] = { ...arr[idx], unit: e.target.value || null };
                          setEdited({ ...edited, metricsAll: arr });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {edited.imaging?.organs && edited.imaging.organs.length > 0 && (
            <div className="rounded-xl border p-4 space-y-2">
              <div className="font-medium">Imaging organs</div>
              <div className="space-y-3">
                {edited.imaging.organs.map((o, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2">
                    <Input
                      value={o.name}
                      onChange={(e) => {
                        const arr = [...(edited.imaging?.organs ?? [])];
                        arr[idx] = { ...arr[idx], name: e.target.value };
                        setEdited({ ...edited, imaging: { ...edited.imaging!, organs: arr } });
                      }}
                    />
                    <Input
                      placeholder="size value"
                      value={o.size?.value ?? ""}
                      onChange={(e) => {
                        const v = e.target.value === "" ? null : Number(e.target.value);
                        const arr = [...(edited.imaging?.organs ?? [])];
                        const size = { value: Number.isFinite(v as number) ? (v as number) : null, unit: o.size?.unit ?? null };
                        arr[idx] = { ...arr[idx], size };
                        setEdited({ ...edited, imaging: { ...edited.imaging!, organs: arr } });
                      }}
                    />
                    <Input
                      placeholder="size unit"
                      value={o.size?.unit ?? ""}
                      onChange={(e) => {
                        const arr = [...(edited.imaging?.organs ?? [])];
                        const size = { value: o.size?.value ?? null, unit: e.target.value || null };
                        arr[idx] = { ...arr[idx], size };
                        setEdited({ ...edited, imaging: { ...edited.imaging!, organs: arr } });
                      }}
                    />
                    <div className="col-span-3">
                      <Input
                        placeholder="notes"
                        value={o.notes ?? ""}
                        onChange={(e) => {
                          const arr = [...(edited.imaging?.organs ?? [])];
                          arr[idx] = { ...arr[idx], notes: e.target.value || null };
                          setEdited({ ...edited, imaging: { ...edited.imaging!, organs: arr } });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {edited.imaging?.findings && edited.imaging.findings.length > 0 && (
            <div className="rounded-xl border p-4 space-y-2">
              <div className="font-medium">Imaging findings</div>
              <div className="space-y-2">
                {edited.imaging.findings.map((f, idx) => (
                  <Input
                    key={idx}
                    value={f}
                    onChange={(e) => {
                      const arr = [...(edited.imaging?.findings ?? [])];
                      arr[idx] = e.target.value;
                      setEdited({ ...edited, imaging: { ...edited.imaging!, findings: arr } });
                    }}
                  />)
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
          {/* Only show save button if we have data to save and haven't saved yet */}
          {!savedId && edited && (
          <Button
            variant="default"
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
                const r = await fetch("/api/reports", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    objectKey: key,
                    contentType: file?.type ?? "application/octet-stream",
                    extracted: edited,
                  }),
                });
                if (!r.ok) {
                  const txt = await r.text();
                  setError(`Save failed (${r.status}): ${txt.slice(0, 200)}`);
                } else {
                  const j = await r.json();
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
            >
              {saving ? "Saving..." : "Save extracted data"}
            </Button>
          )}

          {/* Show success message when saved */}
          {savedId && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <span>✅ Report saved successfully!</span>
                <a href={`/reports/${savedId}`} className="underline text-blue-600">View report</a>
              </div>
              <Button 
                variant="outline" 
                onClick={resetUploader}
                className="w-full"
              >
                Upload New Report
          </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


