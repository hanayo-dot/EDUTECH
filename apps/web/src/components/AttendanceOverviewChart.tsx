'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AttendanceOverviewChartProps {
  timeframe?: string;
  onChangeTimeframe?: (tf: string) => void;
}

export default function AttendanceOverviewChart({
  timeframe = 'Last Semester',
  onChangeTimeframe,
}: AttendanceOverviewChartProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Monthly attendance % data
  const data = [
    { month: 'Jan', students: 86, teachers: 92, staff: 88 },
    { month: 'Feb', students: 89, teachers: 90, staff: 89 },
    { month: 'Mar', students: 92, teachers: 94, staff: 90 },
    { month: 'Apr', students: 91, teachers: 93, staff: 88 },
    { month: 'May', students: 88, teachers: 89, staff: 87 },
    { month: 'Jun', students: 85, teachers: 87, staff: 85 },
    { month: 'Jul', students: 80, teachers: 84, staff: 83 },
    { month: 'Aug', students: 82, teachers: 86, staff: 85 },
    { month: 'Sep', students: 94, teachers: 95, staff: 91 },
    { month: 'Oct', students: 93, teachers: 94, staff: 90 },
    { month: 'Nov', students: 90, teachers: 91, staff: 89 },
    { month: 'Dec', students: 87, teachers: 88, staff: 88 },
  ];

  // Width / Height for SVG canvas
  const svgWidth = 900;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 20;

  // Helper to map (index, value) to SVG coordinates
  const getX = (idx: number) => paddingX + (idx / (months.length - 1)) * (svgWidth - paddingX * 2);
  const getY = (pct: number) => svgHeight - paddingY - (pct / 100) * (svgHeight - paddingY * 2);

  // Generate smooth cubic bezier SVG path
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      const controlX = (current.x + next.x) / 2;
      path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const studentPts = data.map((d, i) => ({ x: getX(i), y: getY(d.students) }));
  const teacherPts = data.map((d, i) => ({ x: getX(i), y: getY(d.teachers) }));
  const staffPts = data.map((d, i) => ({ x: getX(i), y: getY(d.staff) }));

  const studentLine = generateSmoothPath(studentPts);
  const teacherLine = generateSmoothPath(teacherPts);
  const staffLine = generateSmoothPath(staffPts);

  // Area paths (closing at bottom)
  const bottomY = svgHeight - paddingY;
  const studentArea = `${studentLine} L ${studentPts[studentPts.length - 1].x} ${bottomY} L ${studentPts[0].x} ${bottomY} Z`;
  const teacherArea = `${teacherLine} L ${teacherPts[teacherPts.length - 1].x} ${bottomY} L ${teacherPts[0].x} ${bottomY} Z`;
  const staffArea = `${staffLine} L ${staffPts[staffPts.length - 1].x} ${bottomY} L ${staffPts[0].x} ${bottomY} Z`;

  const timeOptions = ['Last Semester', 'Current Semester', 'Past Academic Year'];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-slate-200/80 space-y-4">
      {/* Header with Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Institutional Attendance Overview
          </h3>
          <p className="text-xs text-slate-500">
            Longitudinal trend analysis tracking 75% examination compliance threshold
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Legend */}
          <div className="hidden md:flex items-center space-x-3 text-xs">
            <span className="inline-flex items-center text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-royal-600 mr-1.5" />
              Students
            </span>
            <span className="inline-flex items-center text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
              Faculty
            </span>
            <span className="inline-flex items-center text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 mr-1.5" />
              Staff
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-semibold shadow-xs transition"
            >
              <span>{timeframe}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-elevated border border-slate-200 py-1 z-20 text-xs">
                {timeOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      onChangeTimeframe?.(opt);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 transition ${
                      opt === timeframe
                        ? 'bg-royal-50 text-royal-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full overflow-x-auto pt-2">
        <div className="min-w-[620px]">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-44 sm:h-52 overflow-visible"
          >
            <defs>
              {/* Students Royal Blue Gradient Fill */}
              <linearGradient id="royalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
              </linearGradient>

              {/* Teachers Emerald Gradient Fill */}
              <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              {/* Staff Slate Gradient Fill */}
              <linearGradient id="slateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#475569" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#475569" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-axis labels */}
            {[100, 80, 60, 40, 20, 0].map((level) => {
              const y = getY(level);
              return (
                <g key={level}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={level === 0 ? 'none' : '3 3'}
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-sans select-none font-tabular"
                  >
                    {level}%
                  </text>
                </g>
              );
            })}

            {/* 75% Exam Threshold Guideline */}
            <line
              x1={paddingX}
              y1={getY(75)}
              x2={svgWidth - paddingX}
              y2={getY(75)}
              stroke="#f59e0b"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.6"
            />

            {/* Layer 1: Royal Area & Line (Students) */}
            <path d={studentArea} fill="url(#royalGradient)" />
            <path
              d={studentLine}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Layer 2: Emerald Area & Line (Faculty) */}
            <path d={teacherArea} fill="url(#emeraldGradient)" />
            <path
              d={teacherLine}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Layer 3: Staff Line & Area */}
            <path d={staffArea} fill="url(#slateGradient)" />
            <path
              d={staffLine}
              fill="none"
              stroke="#475569"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Data point markers and hover vertical guide */}
            {data.map((d, i) => {
              const x = getX(i);
              const isHovered = hoveredIndex === i;

              return (
                <g
                  key={d.month}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Invisible wide hit area */}
                  <rect
                    x={x - 25}
                    y={0}
                    width={50}
                    height={svgHeight}
                    fill="transparent"
                  />

                  {/* Vertical hover guide */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={svgHeight - paddingY}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Dots */}
                  <circle
                    cx={x}
                    cy={getY(d.students)}
                    r={isHovered ? 4.5 : 2.5}
                    className="fill-royal-600 transition-all"
                  />
                  <circle
                    cx={x}
                    cy={getY(d.teachers)}
                    r={isHovered ? 4.5 : 2.5}
                    className="fill-emerald-500 transition-all"
                  />

                  {/* X-axis Month Label */}
                  <text
                    x={x}
                    y={svgHeight - 2}
                    textAnchor="middle"
                    className={`text-[11px] select-none transition-colors ${
                      isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-400 font-medium'
                    }`}
                  >
                    {d.month}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredIndex !== null && (
            <div
              className="absolute pointer-events-none -top-1 bg-slate-900 text-white px-3 py-2 rounded-xl shadow-elevated text-[11px] transform -translate-x-1/2 transition-all border border-slate-800"
              style={{
                left: `${(getX(hoveredIndex) / svgWidth) * 100}%`,
              }}
            >
              <div className="font-bold text-center border-b border-slate-800 pb-1 mb-1 text-royal-300">
                {data[hoveredIndex].month} Attendance
              </div>
              <div className="flex items-center justify-between space-x-3">
                <span className="text-royal-300">Students:</span>
                <span className="font-bold font-tabular">{data[hoveredIndex].students}%</span>
              </div>
              <div className="flex items-center justify-between space-x-3">
                <span className="text-emerald-300">Faculty:</span>
                <span className="font-bold font-tabular">{data[hoveredIndex].teachers}%</span>
              </div>
              <div className="flex items-center justify-between space-x-3">
                <span className="text-slate-400">Staff:</span>
                <span className="font-bold font-tabular">{data[hoveredIndex].staff}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
