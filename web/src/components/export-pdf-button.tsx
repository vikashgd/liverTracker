"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ExportPdfButton({ reportId }: { reportId: string }) {
  const [busy, setBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  const getUrl = async (): Promise<string> => {
    const res = await fetch(`/api/export/pdf?reportId=${encodeURIComponent(reportId)}`);
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    const { url } = await res.json();
    setLastUrl(url);
    return url as string;
  };

  const onExport = async () => {
    setBusy(true);
    try {
      const url = await getUrl();
      window.open(url, "_blank");
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setBusy(false);
    }
  };

  type WebShareNavigator = Navigator & {
    share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
  };

  const onShare = async () => {
    setShareBusy(true);
    try {
      const url = lastUrl ?? (await getUrl());
      const nav = navigator as WebShareNavigator;
      if (nav.share) {
        await nav.share({ title: "LiverTrack Report", url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert("Share link copied to clipboard");
      } else {
        window.open(url, "_blank");
      }
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setShareBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={onExport} disabled={busy}>{busy ? "Generating..." : "Generate PDF"}</Button>
      <Button onClick={onShare} disabled={shareBusy}>{shareBusy ? "Sharing..." : "Share"}</Button>
    </div>
  );
}


