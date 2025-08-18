"use client";
import { useMemo, useState } from "react";

export type DateRange = { from: string | null; to: string | null };

export function useDateFiltered<T extends { date: string }>(data: T[]) {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const filtered = useMemo(() => {
    return data.filter((d) => {
      const t = d.date;
      if (range.from && t < range.from) return false;
      if (range.to && t > range.to) return false;
      return true;
    });
  }, [data, range]);
  return { range, setRange, filtered };
}

export function DateRangeControls({ range, onChange }: { range: DateRange; onChange: (r: DateRange) => void }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <input type="date" value={range.from ?? ""} onChange={(e) => onChange({ ...range, from: e.target.value || null })} className="border rounded px-2 py-1" />
      <span>to</span>
      <input type="date" value={range.to ?? ""} onChange={(e) => onChange({ ...range, to: e.target.value || null })} className="border rounded px-2 py-1" />
    </div>
  );
}


