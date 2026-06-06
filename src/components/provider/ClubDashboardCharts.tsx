"use client";

import { useState } from "react";
import { Ticket, DollarSign } from "lucide-react";

interface ChartPoint {
  date: string;
  fullDate: string;
  covers: number;
  revenue: number;
}

interface ClubDashboardChartsProps {
  data: ChartPoint[];
}

export function ClubDashboardCharts({ data }: ClubDashboardChartsProps) {
  const [activeTab, setActiveTab] = useState<"covers" | "revenue">("covers");
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6 h-72 flex flex-col items-center justify-center text-center">
        <p className="text-zinc-500 text-xs">Sin actividad registrada aún</p>
      </div>
    );
  }

  // Choose values based on active tab
  const values = data.map((d) => (activeTab === "covers" ? d.covers : d.revenue));
  const maxVal = Math.max(...values, 10); // Guarantee min height

  // Chart size configuration
  const width = 600;
  const height = 200;
  const paddingX = 40;
  const paddingY = 25;

  // Compute SVG coordinates
  const points = data.map((d, index) => {
    const val = activeTab === "covers" ? d.covers : d.revenue;
    const x = paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (val / maxVal) * (height - paddingY * 2);
    return { x, y, val, date: d.date, fullDate: d.fullDate };
  });

  // Draw path for line
  const linePath = points.reduce((path, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
  }, "");

  // Draw path for filled gradient area
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : "";

  return (
    <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-bold text-white text-sm font-outfit">Histórico de Actividad</h4>
          <p className="text-xs text-zinc-500">Últimos 30 días de la discoteca</p>
        </div>

        <div className="flex bg-black/40 border border-white/5 rounded-xl p-0.5 self-stretch sm:self-auto">
          <button
            onClick={() => {
              setActiveTab("covers");
              setHoveredPoint(null);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "covers"
                ? "bg-primary-600 text-white shadow-md"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            Covers
          </button>
          <button
            onClick={() => {
              setActiveTab("revenue");
              setHoveredPoint(null);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "revenue"
                ? "bg-primary-600 text-white shadow-md"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Ingresos
          </button>
        </div>
      </div>

      {/* SVG Rendering */}
      <div className="relative w-full aspect-[3/1] min-h-[220px]">
        {/* Hover Point details overlay */}
        <div className="absolute top-0 right-0 text-right min-h-[30px] pr-2">
          {hoveredPoint ? (
            <div className="text-xs font-semibold font-outfit animate-fade-in">
              <span className="text-zinc-400 mr-2">{hoveredPoint.fullDate}:</span>
              <span className={activeTab === "covers" ? "text-primary-400" : "text-emerald-400"}>
                {activeTab === "covers"
                  ? `${hoveredPoint.val} covers`
                  : `$${hoveredPoint.val.toLocaleString("es-CO")} COP`}
              </span>
            </div>
          ) : (
            <div className="text-xs text-zinc-600">Pasa el cursor para ver detalles</div>
          )}
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible select-none"
        >
          <defs>
            {/* Color Gradient for Fill */}
            <linearGradient id="chart-fill-grad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={activeTab === "covers" ? "rgb(236,72,153)" : "rgb(16,185,129)"}
                stopOpacity="0.25"
              />
              <stop
                offset="100%"
                stopColor={activeTab === "covers" ? "rgb(236,72,153)" : "rgb(16,185,129)"}
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={(height - paddingY) / 2}
            x2={width - paddingX}
            y2={(height - paddingY) / 2}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />

          {/* Fill under the path */}
          {areaPath && (
            <path d={areaPath} fill="url(#chart-fill-grad)" className="transition-all duration-300" />
          )}

          {/* Main Line path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={activeTab === "covers" ? "#ec4899" : "#10b981"}
              strokeWidth="2"
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          )}

          {/* Render labels under bottom line (X axis) */}
          {points
            .filter((_, idx) => idx % 5 === 0 || idx === points.length - 1)
            .map((p, idx) => (
              <text
                key={idx}
                x={p.x}
                y={height - 8}
                fill="rgb(113, 113, 122)"
                fontSize="9"
                textAnchor="middle"
                className="font-medium tracking-tight"
              >
                {p.date}
              </text>
            ))}

          {/* Render interactive dots & hover triggers */}
          {points.map((p, idx) => (
            <g key={idx}>
              {/* Highlight point on hover */}
              {hoveredPoint && hoveredPoint.idx === idx && (
                <>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="6"
                    fill={activeTab === "covers" ? "#ec4899" : "#10b981"}
                    opacity="0.3"
                    className="pointer-events-none"
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="3.5"
                    fill={activeTab === "covers" ? "#ec4899" : "#10b981"}
                    className="pointer-events-none"
                  />
                </>
              )}

              {/* Invisible interactive zone */}
              <circle
                cx={p.x}
                cy={p.y}
                r="10"
                fill="transparent"
                onMouseEnter={() => setHoveredPoint({ ...p, idx })}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
