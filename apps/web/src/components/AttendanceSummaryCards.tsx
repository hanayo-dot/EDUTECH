'use client';

import React, { useState } from 'react';
import { ChevronDown, ArrowUpRight, GraduationCap, BookOpen, Users } from 'lucide-react';

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
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Institutional Attendance Summary
          </h2>
          <p className="text-xs text-slate-500">
            Real-time daily roster aggregation across students, faculty, and administrative staff
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-elevated border border-slate-200 py-1 z-20 text-xs">
              {dateOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChangeDateRange?.(opt);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 transition ${
                    opt === dateRange
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

      {/* 3 Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* 1. Students Card - Collegiate Royal & Indigo */}
        <div className="rounded-3xl bg-white p-2.5 shadow-card border border-slate-200/80 flex flex-col justify-between">
          <div className="relative rounded-2xl p-5 text-white overflow-hidden bg-gradient-to-br from-royal-900 via-royal-700 to-indigo-700 shadow-sm">
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-royal-100 text-sm font-semibold tracking-wide flex items-center">
                  <GraduationCap className="w-4 h-4 mr-1.5 text-royal-200" />
                  Students
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-royal-100 border border-white/15">
                  Enrolled
                </span>
              </div>

              <div className="mt-3 flex items-baseline space-x-3">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-tabular">
                  1,180
                </span>
                <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/25 border border-emerald-300/30 text-emerald-100">
                  <ArrowUpRight className="w-3 h-3 text-emerald-200" />
                  <span>14.5%</span>
                </span>
              </div>

              <p className="mt-1 text-xs text-royal-100 font-medium">
                Total Verified Present
              </p>
            </div>
          </div>

          {/* Breakdown Stats Panel */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 px-3 py-3 mt-1 text-center">
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">On-Time</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block font-tabular">1,090</span>
              <span className="text-[10px] text-emerald-600 font-semibold block">87.5%</span>
            </div>
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">Late</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block font-tabular">90</span>
              <span className="text-[10px] text-amber-600 font-semibold block">7.2%</span>
            </div>
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">Absent</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block font-tabular">65</span>
              <span className="text-[10px] text-rose-600 font-semibold block">5.2%</span>
            </div>
          </div>
        </div>

        {/* 2. Teachers / Faculty Card - Crisp Academic Emerald / Slate */}
        <div className="rounded-3xl bg-white p-2.5 shadow-card border border-slate-200/80 flex flex-col justify-between">
          <div className="relative rounded-2xl p-5 text-white overflow-hidden bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-600 shadow-sm">
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/15 blur-xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-emerald-100 text-sm font-semibold tracking-wide flex items-center">
                  <BookOpen className="w-4 h-4 mr-1.5 text-emerald-200" />
                  Academic Faculty
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-emerald-100 border border-white/15">
                  Lecturers
                </span>
              </div>

              <div className="mt-3 flex items-baseline space-x-3">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-tabular">
                  80
                </span>
                <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/20 border border-white/30 text-white">
                  <ArrowUpRight className="w-3 h-3 text-white" />
                  <span>11.2%</span>
                </span>
              </div>

              <p className="mt-1 text-xs text-emerald-100 font-medium">
                Total Teaching On-Duty
              </p>
            </div>
          </div>

          {/* Breakdown Stats Panel */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 px-3 py-3 mt-1 text-center">
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">On-Time</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block font-tabular">75</span>
              <span className="text-[10px] text-emerald-600 font-semibold block">87.2%</span>
            </div>
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">Late</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block font-tabular">5</span>
              <span className="text-[10px] text-amber-600 font-semibold block">5.8%</span>
            </div>
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">Absent</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block font-tabular">6</span>
              <span className="text-[10px] text-rose-600 font-semibold block">7.0%</span>
            </div>
          </div>
        </div>

        {/* 3. Staff Card - Deep Academic Navy & Azure */}
        <div className="rounded-3xl bg-white p-2.5 shadow-card border border-slate-200/80 flex flex-col justify-between">
          <div className="relative rounded-2xl p-5 text-white overflow-hidden bg-gradient-to-br from-slate-900 via-navy-800 to-azure-900 shadow-sm">
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-azure-500/20 blur-xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 text-sm font-semibold tracking-wide flex items-center">
                  <Users className="w-4 h-4 mr-1.5 text-slate-300" />
                  Staff & Operations
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/15">
                  Administrative
                </span>
              </div>

              <div className="mt-3 flex items-baseline space-x-3">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-tabular">
                  32
                </span>
                <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/20 border border-white/30 text-white">
                  <ArrowUpRight className="w-3 h-3 text-white" />
                  <span>10.4%</span>
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-300 font-medium">
                Total Staff Present
              </p>
            </div>
          </div>

          {/* Breakdown Stats Panel */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 px-3 py-3 mt-1 text-center">
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">On-Time</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block font-tabular">29</span>
              <span className="text-[10px] text-emerald-600 font-semibold block">87.9%</span>
            </div>
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">Late</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block font-tabular">3</span>
              <span className="text-[10px] text-amber-600 font-semibold block">9.1%</span>
            </div>
            <div className="px-1">
              <span className="text-[11px] font-medium text-slate-400 block">Absent</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block font-tabular">2</span>
              <span className="text-[10px] text-rose-600 font-semibold block">6.1%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
