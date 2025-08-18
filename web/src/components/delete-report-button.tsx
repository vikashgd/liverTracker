"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const onDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
      router.push("/reports");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" onClick={onDelete} disabled={busy} className="text-sm underline text-red-600">
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}


