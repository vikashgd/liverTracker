"use client";
import { useMemo, useState, useEffect } from "react";
import { TrendChart, type SeriesPoint } from "@/components/trend-chart";
import { MobileTrendChart } from "@/components/mobile-trend-chart";
import { ReportDotsChart } from "@/components/report-dots-chart";
import { referenceRanges, type CanonicalMetric } from "@/lib/metrics";
import { DateRangeControls } from "./client-filters";

type ChartSpec = { title: CanonicalMetric; color: string; data: SeriesPoint[]; range: { low: number; high: number }; unit: string };

export default function DashboardClient({ charts }: { charts: ChartSpec[] }) {
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'trend' | 'mobile' | 'dots'>('dots');

  useEffect(() => {
    setIsClient(true);
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredCharts = useMemo(() => {
    return charts.map((c) => ({
      ...c,
      data: c.data.filter((d) => {
        if (from && d.date < from) return false;
        if (to && d.date > to) return false;
        return true;
      }),
    }));
  }, [charts, from, to]);

  const setRange = (r: { from: string | null; to: string | null }) => {
    setFrom(r.from);
    setTo(r.to);
  };

  const quick = {
    all: () => setRange({ from: null, to: null }),
    y1: () => setRange({ from: isClient ? isoDaysAgo(365) : null, to: null }),
    m6: () => setRange({ from: isClient ? isoDaysAgo(183) : null, to: null }),
    m3: () => setRange({ from: isClient ? isoDaysAgo(92) : null, to: null }),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-medical-neutral-700">View:</span>
          <div className="flex border rounded-lg overflow-hidden">
            <button 
              onClick={() => setViewMode('dots')}
              className={`px-3 py-1 text-xs ${viewMode === 'dots' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              📍 Reports
            </button>
            <button 
              onClick={() => setViewMode('mobile')}
              className={`px-3 py-1 text-xs ${viewMode === 'mobile' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              📱 Mobile
            </button>
            <button 
              onClick={() => setViewMode('trend')}
              className={`px-3 py-1 text-xs ${viewMode === 'trend' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              📊 Trend
            </button>
          </div>
        </div>
        
        {/* Date Controls */}
        <div className="flex items-center gap-2">
          <DateRangeControls range={{ from, to }} onChange={setRange} />
          <div className="text-xs flex items-center gap-1">
            <button onClick={quick.all} className="px-2 py-1 border rounded">All</button>
            <button onClick={quick.y1} className="px-2 py-1 border rounded">1y</button>
            <button onClick={quick.m6} className="px-2 py-1 border rounded">6m</button>
            <button onClick={quick.m3} className="px-2 py-1 border rounded">3m</button>
          </div>
        </div>
      </div>
      <div className={`grid gap-6 ${viewMode === 'dots' ? 'grid-cols-1' : isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {filteredCharts.filter(c => c.data.length > 0).map((c) => {
          const Chart = 
            viewMode === 'dots' ? ReportDotsChart :
            viewMode === 'mobile' ? MobileTrendChart :
            TrendChart;
            
          return (
            <Chart
              key={c.title}
              title={c.title}
              color={c.color}
              data={c.data}
              unit={c.unit}
              range={c.range}
              lastUpdated={c.data.length ? c.data[c.data.length - 1].date : undefined}
              enableExport
            />
          );
        })}
      </div>
    </div>
  );
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}


