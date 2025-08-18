"use client";
import React, { useMemo, useRef, useState } from "react";

export type SeriesPoint = { date: string; value: number | null };

export function TrendChart({
  title,
  color,
  data,
  unit,
  range,
  lastUpdated,
  enableExport,
}: {
  title: string;
  color: string;
  data: SeriesPoint[];
  unit?: string;
  range?: { low: number; high: number };
  lastUpdated?: string | null;
  enableExport?: boolean;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { points, min, max, numericCount, minIdx, maxIdx, minVal, maxVal } = useMemo(() => {
    // Filter data by date range if specified
    let filteredData = data;
    if (dateStart || dateEnd) {
      filteredData = data.filter((d) => {
        if (!dateStart && !dateEnd) return true;
        if (dateStart && d.date < dateStart) return false;
        if (dateEnd && d.date > dateEnd) return false;
        return true;
      });
    }
    
    const numeric = filteredData.map((d) => d.value).filter((v): v is number => v != null);
    const minVal = numeric.length ? Math.min(...numeric) : 0;
    const maxVal = numeric.length ? Math.max(...numeric) : 1;
    const pad = (maxVal - minVal) * 0.1 || 1;
    const min = minVal - pad;
    const max = maxVal + pad;
    const pts = filteredData.map((d, i) => ({
      x: i,
      y: d.value,
      label: d.date,
    }));
    // downsample for performance if many points
    const MAX_POINTS = 300;
    let ds = pts;
    if (pts.length > MAX_POINTS) {
      const step = Math.ceil(pts.length / MAX_POINTS);
      ds = pts.filter((_, idx) => idx % step === 0);
      if (ds[ds.length - 1]?.x !== pts[pts.length - 1]?.x) ds.push(pts[pts.length - 1]);
    }
    // find min/max indices based on original data indices (not downsample), then map to ds index if present
    let minIndex = -1;
    let maxIndex = -1;
    if (numeric.length > 0) {
      let curMin = Number.POSITIVE_INFINITY;
      let curMax = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < pts.length; i++) {
        const v = pts[i].y;
        if (v == null) continue;
        if (v < curMin) {
          curMin = v;
          minIndex = i;
        }
        if (v > curMax) {
          curMax = v;
          maxIndex = i;
        }
      }
    }
    return { points: ds, min, max, numericCount: numeric.length, minIdx: minIndex, maxIdx: maxIndex, minVal, maxVal };
  }, [data, dateStart, dateEnd]);

  const width = 340;
  const height = 140;
  const margin = { top: 12, right: 12, bottom: 26, left: 36 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const xScale = (i: number) => (points.length <= 1 ? 0 : (i / (points.length - 1)) * innerW);
  const yScale = (v: number) => innerH - ((v - min) / (max - min || 1)) * innerH;

  const linePoints = points
    .map((p) => (p.y == null ? null : `${margin.left + xScale(p.x)},${margin.top + yScale(p.y)}`))
    .filter((s): s is string => !!s)
    .join(" ");

  const xTicksIdx = useMemo(() => {
    if (points.length <= 1) return [0];
    const mid = Math.floor(points.length / 2);
    return Array.from(new Set([0, mid, points.length - 1]));
  }, [points.length]);

  const yTicks = useMemo(() => {
    const ticks = 4;
    return new Array(ticks + 1).fill(0).map((_, i) => min + ((max - min) * i) / ticks);
  }, [min, max]);

  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    if (points.length === 0) return;
    const rect = (e.target as SVGRectElement).getBoundingClientRect();
    const relX = e.clientX - rect.left - margin.left;
    const pos = Math.max(0, Math.min(innerW, relX));
    const idx = Math.round((pos / innerW) * (points.length - 1));
    setHoverIdx(idx);
  };

  const hover = hoverIdx != null ? points[hoverIdx] : null;

  const handleExport = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const src = serializer.serializeToString(svg);
    const svgBlob = new Blob([src], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    const scale = 2;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = (svg.viewBox.baseVal?.width || svg.width.baseVal.value || 340) * scale;
    canvas.height = (svg.viewBox.baseVal?.height || svg.height.baseVal.value || 140) * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `${title.toLowerCase()}-trend.png`;
    a.click();
  };

  const clearFilters = () => {
    setDateStart("");
    setDateEnd("");
  };

  const hasFilters = dateStart || dateEnd;

  return (
    <div className="chart-container">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-lg font-semibold text-medical-neutral-900">
            {title}
            {unit ? <span className="text-sm font-normal text-medical-neutral-500 ml-1">({unit})</span> : ""}
          </h3>
        </div>
        <div className="flex items-center space-x-4 text-sm text-medical-neutral-500">
          {lastUpdated && (
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-medical-success-500 rounded-full"></span>
              <span>Updated {lastUpdated}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <span>{points.length}/{data.length} data points</span>
          </div>
          <button 
            className="btn-secondary text-xs px-2 py-1" 
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Hide Filters" : "Filter Data"}
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="mb-4 p-4 bg-medical-neutral-50 rounded-lg border border-medical-neutral-200">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <label className="font-medium text-medical-neutral-700">From:</label>
              <input 
                type="date" 
                value={dateStart} 
                onChange={(e) => setDateStart(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="font-medium text-medical-neutral-700">To:</label>
              <input 
                type="date" 
                value={dateEnd} 
                onChange={(e) => setDateEnd(e.target.value)}
                className="text-sm"
              />
            </div>
            {hasFilters && (
              <button 
                className="btn-secondary text-xs px-3 py-1" 
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
      <svg ref={svgRef} width={width} height={height} className="w-full h-40">
        {/* axes */}
        <line x1={margin.left} y1={margin.top + innerH} x2={margin.left + innerW} y2={margin.top + innerH} stroke="#e5e7eb" />
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + innerH} stroke="#e5e7eb" />
        {/* reference band */}
        {range && (
          <g>
            <rect
              x={margin.left}
              y={margin.top + yScale(Math.min(range.high, max))}
              width={innerW}
              height={Math.max(0, yScale(Math.max(range.low, min)) - yScale(Math.min(range.high, max)))}
              fill="#d1fae5"
              opacity={0.35}
            />
            {/* Range labels */}
            <text 
              x={margin.left + innerW - 4} 
              y={margin.top + yScale(Math.min(range.high, max)) - 2} 
              textAnchor="end" 
              fontSize={9} 
              fill="#059669"
              fontWeight="500"
            >
              {range.high}{unit ? ` ${unit}` : ""}
            </text>
            <text 
              x={margin.left + innerW - 4} 
              y={margin.top + yScale(Math.max(range.low, min)) + 12} 
              textAnchor="end" 
              fontSize={9} 
              fill="#059669"
              fontWeight="500"
            >
              {range.low}{unit ? ` ${unit}` : ""}
            </text>
            {/* Normal range label */}
            <text 
              x={margin.left + 4} 
              y={margin.top + yScale((range.high + range.low) / 2)} 
              textAnchor="start" 
              fontSize={8} 
              fill="#065f46"
              fontWeight="500"
              opacity={0.8}
            >
              Normal
            </text>
          </g>
        )}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={margin.left}
              y1={margin.top + yScale(t)}
              x2={margin.left + innerW}
              y2={margin.top + yScale(t)}
              stroke="#f3f4f6"
            />
            <text x={margin.left - 6} y={margin.top + yScale(t)} textAnchor="end" alignmentBaseline="middle" fontSize={10} fill="#6b7280">
              {t.toFixed(0)}
            </text>
          </g>
        ))}
        {xTicksIdx.map((i) => (
          <text key={i} x={margin.left + xScale(i)} y={margin.top + innerH + 16} textAnchor="middle" fontSize={10} fill="#6b7280">
            {points[i]?.label ?? ""}
          </text>
        ))}

        {/* line */}
        {linePoints && numericCount >= 2 && <polyline fill="none" stroke={color} strokeWidth={2} points={linePoints} />}
        {numericCount === 1 && points.find((p) => p.y != null) && (
          <g>
            {points.filter((p) => p.y != null).map((p, i) => (
              <circle key={i} cx={margin.left + xScale(p.x)} cy={margin.top + yScale(p.y as number)} r={3} fill={color} />
            ))}
          </g>
        )}

        {/* min/max markers */}
        {numericCount >= 1 && minIdx >= 0 && (
          <g>
            <rect
              x={margin.left + xScale(minIdx) - 3}
              y={margin.top + yScale(minVal)}
              width={6}
              height={6}
              transform={`rotate(45 ${margin.left + xScale(minIdx)} ${margin.top + yScale(minVal)})`}
              fill="#0ea5e9"
            />
            <text x={margin.left + xScale(minIdx) + 6} y={margin.top + yScale(minVal) - 4} fontSize={10} fill="#0ea5e9">min</text>
          </g>
        )}
        {numericCount >= 1 && maxIdx >= 0 && (
          <g>
            <rect
              x={margin.left + xScale(maxIdx) - 3}
              y={margin.top + yScale(maxVal)}
              width={6}
              height={6}
              transform={`rotate(45 ${margin.left + xScale(maxIdx)} ${margin.top + yScale(maxVal)})`}
              fill="#ef4444"
            />
            <text x={margin.left + xScale(maxIdx) + 6} y={margin.top + yScale(maxVal) - 4} fontSize={10} fill="#ef4444">max</text>
          </g>
        )}

        {/* hover area */}
        <rect
          x={margin.left}
          y={margin.top}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
        />

        {/* hover marker */}
        {hover && hover.y != null && (
          <g>
            <line x1={margin.left + xScale(hover.x)} y1={margin.top} x2={margin.left + xScale(hover.x)} y2={margin.top + innerH} stroke="#e5e7eb" />
            <circle cx={margin.left + xScale(hover.x)} cy={margin.top + yScale(hover.y)} r={3} fill={color} />
          </g>
        )}
      </svg>
      {numericCount === 0 && (
        <div className="mt-1 text-xs text-muted-foreground">No data yet. Upload and save a report to see this trend.</div>
      )}
      {numericCount === 1 && (
        <div className="mt-1 text-xs text-muted-foreground">Need at least 2 data points to show a trend.</div>
      )}
      {hover && (
        <div className="mt-1 text-xs">
          <span className="font-medium">{hover.label}</span> — <span>{hover.y ?? "—"}{unit ? ` ${unit}` : ""}</span>
        </div>
      )}
      {enableExport && (
        <div className="mt-2">
          <button className="text-xs underline text-blue-600" onClick={handleExport}>Export PNG</button>
        </div>
      )}
    </div>
  );
}


