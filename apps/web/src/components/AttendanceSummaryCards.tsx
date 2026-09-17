'use client';

import React, { useState } from 'react';
import { ChevronDown, ArrowUpRight } from 'lucide-react';

interface AttendanceSummaryCardsProps {
  dateRange?: string;
  onChangeDateRange?: (range: string) => void;
}

export default function AttendanceSummaryCards({
  dateRange = 'Today',
  onChangeDateRange,
}: AttendanceSummaryCardsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dateOptions = ['Today', 'Yesterday', 'This Week', 'This Month'];

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
          Attendance Summary
        </h2>

        {/* Date Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200/80 text-teal-700 text-xs font-semibold shadow-xs transition"
          >
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-teal-600" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 text-xs">
              {dateOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChangeDateRange?.(opt);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 transition ${
                    opt === dateRange
                      ? 'bg-teal-50 text-teal-700 font-semibold'
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

      {/* 3 Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* 1. Students Card */}
        <div className="rounded-3xl bg-white p-2 sm:p-2.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] border border-slate-100/80 flex flex-col justify-between">
          {/* Vibrant Pink Gradient Top Block */}
          <div className="relative rounded-[22px] p-5 text-white overflow-hidden bg-gradient-to-br from-[#ff5e97] via-[#f43f85] to-[#f472b6] shadow-sm">
            {/* Subtle frosted glow blobs */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/15 blur-xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-pink-400/20 blur-lg pointer-events-none" />

            <div className="relative z-10">
              <span className="text-white/90 text-sm font-semibold tracking-wide">
                Students
              </span>

              <div className="mt-2.5 flex items-baseline space-x-3">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  1,180
                </span>
                <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/25 border border-emerald-300/30 text-emerald-100">
                  <ArrowUpRight className="w-3 h-3 text-emerald-200" />
                  <span>14.5%</span>
                </span>
              </div>

              <p className="mt-1 text-xs text-white/80 font-medium">
                Total Present
              </p>
            </div>
          </div>

          {/* Breakdown Stats Panel */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 px-3 py-3 mt-1 text-center">
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">On-Time</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">1,090</span>
              <span className="text-[10px] text-slate-400 font-medium block">87.5%</span>
            </div>
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">Late</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">90</span>
              <span className="text-[10px] text-slate-400 font-medium block">7.2%</span>
            </div>
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">Absent</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">65</span>
              <span className="text-[10px] text-slate-400 font-medium block">5.2%</span>
            </div>
          </div>
        </div>

        {/* 2. Teachers / Faculty Card */}
        <div className="rounded-3xl bg-white p-2 sm:p-2.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] border border-slate-100/80 flex flex-col justify-between">
          {/* Fresh Mint / Soft Teal Gradient Top Block */}
          <div className="relative rounded-[22px] p-5 text-slate-900 overflow-hidden bg-gradient-to-br from-[#d1fae5] via-[#a7f3d0] to-[#5eead4] shadow-sm">
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/30 blur-xl pointer-events-none" />

            <div className="relative z-10">
              <span className="text-teal-900 text-sm font-semibold tracking-wide">
                Teachers
              </span>

              <div className="mt-2.5 flex items-baseline space-x-3">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-teal-950">
                  80
                </span>
                <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-800/10 border border-teal-700/20 text-teal-900">
                  <ArrowUpRight className="w-3 h-3 text-teal-900" />
                  <span>11.2%</span>
                </span>
              </div>

              <p className="mt-1 text-xs text-teal-800/80 font-medium">
                Total Present
              </p>
            </div>
          </div>

          {/* Breakdown Stats Panel */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 px-3 py-3 mt-1 text-center">
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">On-Time</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">75</span>
              <span className="text-[10px] text-slate-400 font-medium block">87.2%</span>
            </div>
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">Late</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">5</span>
              <span className="text-[10px] text-slate-400 font-medium block">5.8%</span>
            </div>
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">Absent</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">6</span>
              <span className="text-[10px] text-slate-400 font-medium block">7.0%</span>
            </div>
          </div>
        </div>

        {/* 3. Staff Card */}
        <div className="rounded-3xl bg-white p-2 sm:p-2.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] border border-slate-100/80 flex flex-col justify-between">
          {/* Deep Navy Gradient Top Block */}
          <div className="relative rounded-[22px] p-5 text-white overflow-hidden bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e3a8a] shadow-sm">
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-sky-500/10 blur-xl pointer-events-none" />

            <div className="relative z-10">
              <span className="text-slate-200 text-sm font-semibold tracking-wide">
                Staff
              </span>

              <div className="mt-2.5 flex items-baseline space-x-3">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  32
                </span>
                <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-400/20 border border-teal-300/30 text-teal-300">
                  <ArrowUpRight className="w-3 h-3 text-teal-300" />
                  <span>10.4%</span>
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-300 font-medium">
                Total Present
              </p>
            </div>
          </div>

          {/* Breakdown Stats Panel */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 px-3 py-3 mt-1 text-center">
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">On-Time</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">29</span>
              <span className="text-[10px] text-slate-400 font-medium block">87.9%</span>
            </div>
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">Late</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">3</span>
              <span className="text-[10px] text-slate-400 font-medium block">9.1%</span>
            </div>
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">Absent</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">2</span>
              <span className="text-[10px] text-slate-400 font-medium block">6.1%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
