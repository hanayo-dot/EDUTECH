'use client';

import React from 'react';
import {
  Menu,
  ChevronDown,
  ArrowUpRight,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

export default function MobileDevicePreview() {
  const students = [
    { code: 'S-2102', name: 'Emma Williams', d1: 'present', d2: 'present', d3: 'off', d4: 'off' },
    { code: 'S-2103', name: 'Thomas Green', d1: 'present', d2: 'present', d3: 'off', d4: 'off' },
    { code: 'S-2105', name: 'Sophia Martin', d1: 'present', d2: 'present', d3: 'off', d4: 'off' },
    { code: 'S-2109', name: 'Lucas Müller', d1: 'present', d2: 'present', d3: 'off', d4: 'off' },
    { code: 'S-2101', name: 'Hannah Lee', d1: 'present', d2: 'present', d3: 'off', d4: 'off' },
    { code: 'S-2102', name: 'Daniel Park', d1: 'present', d2: 'present', d3: 'off', d4: 'off' },
    { code: 'S-2111', name: 'Aisha Khan', d1: 'present', d2: 'present', d3: 'off', d4: 'off' },
    { code: 'S-2112', name: 'Matteo Ricci', d1: 'present', d2: 'present', d3: 'off', d4: 'off' },
    { code: 'S-2113', name: 'Grace Johnson', d1: 'present', d2: 'present', d3: 'off', d4: 'off' },
    { code: 'S-2114', name: 'Omar Hassan', d1: 'present', d2: 'present', d3: 'off', d4: 'off' },
  ];

  return (
    <div className="w-[340px] sm:w-[370px] bg-white rounded-[38px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] border-[7px] border-slate-900 p-4 flex-shrink-0 text-slate-900 flex flex-col space-y-4 overflow-hidden select-none">
      {/* Phone Speaker Notch & Top Status Bar */}
      <div className="flex justify-between items-center px-3 pt-1 text-[11px] font-semibold text-slate-500">
        <span>9:41</span>
        <div className="w-16 h-3.5 bg-slate-900 rounded-full" />
        <div className="flex items-center space-x-1 text-[10px]">
          <span>5G</span>
          <div className="w-3.5 h-2 bg-slate-700 rounded-xs" />
        </div>
      </div>

      {/* Mobile App Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#ec4899] to-[#06b6d4] p-[1.5px]">
          <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#f43f85]">S</span>
          </div>
        </div>
        <h2 className="text-sm font-bold text-slate-800">Attendance</h2>
        <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-600">
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Attendance Summary Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-800">Attendance Summary</span>
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-semibold">
          <span>Today</span>
          <ChevronDown className="w-2.5 h-2.5" />
        </span>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="space-y-3">
        {/* Students Mobile Card */}
        <div className="p-1 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="w-[52%] rounded-xl p-3 bg-gradient-to-br from-[#ff5e97] via-[#f43f85] to-[#f472b6] text-white">
            <span className="text-[10px] font-semibold text-white/90">Students</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-extrabold text-white">1,180</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-400/30 font-bold">14.5%</span>
            </div>
            <span className="text-[9px] text-white/80 block mt-0.5">Total Present</span>
          </div>
          <div className="w-[45%] text-[10px] space-y-1 pr-2">
            <div className="flex justify-between text-slate-500">
              <span>On-Time</span>
              <span className="font-bold text-slate-800">1,090 (87.5%)</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Late</span>
              <span className="font-bold text-slate-800">90 (7.2%)</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Absent</span>
              <span className="font-bold text-slate-800">65 (5.2%)</span>
            </div>
          </div>
        </div>

        {/* Teachers Mobile Card */}
        <div className="p-1 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="w-[52%] rounded-xl p-3 bg-gradient-to-br from-[#d1fae5] via-[#a7f3d0] to-[#5eead4] text-teal-950">
            <span className="text-[10px] font-semibold text-teal-900">Teachers</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-extrabold text-teal-950">80</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-800/10 font-bold">11.2%</span>
            </div>
            <span className="text-[9px] text-teal-800/80 block mt-0.5">Total Present</span>
          </div>
          <div className="w-[45%] text-[10px] space-y-1 pr-2">
            <div className="flex justify-between text-slate-500">
              <span>On-Time</span>
              <span className="font-bold text-slate-800">75 (87.2%)</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Late</span>
              <span className="font-bold text-slate-800">5 (5.8%)</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Absent</span>
              <span className="font-bold text-slate-800">6 (7.0%)</span>
            </div>
          </div>
        </div>

        {/* Staff Mobile Card */}
        <div className="p-1 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="w-[52%] rounded-xl p-3 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e3a8a] text-white">
            <span className="text-[10px] font-semibold text-slate-200">Staff</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-extrabold text-white">32</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-400/20 text-teal-300 font-bold">10.4%</span>
            </div>
            <span className="text-[9px] text-slate-300 block mt-0.5">Total Present</span>
          </div>
          <div className="w-[45%] text-[10px] space-y-1 pr-2">
            <div className="flex justify-between text-slate-500">
              <span>On-Time</span>
              <span className="font-bold text-slate-800">29 (87.9%)</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Late</span>
              <span className="font-bold text-slate-800">3 (9.1%)</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Absent</span>
              <span className="font-bold text-slate-800">2 (6.1%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Overview Card */}
      <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">Attendance Overview</span>
          <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-medium flex items-center space-x-0.5">
            <span>Last Semester</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </span>
        </div>

        <div className="flex space-x-3 text-[10px] text-slate-500">
          <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-[#f43f85]" /><span>Students</span></span>
          <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]" /><span>Teachers</span></span>
          <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-[#1e293b]" /><span>Staff</span></span>
        </div>

        {/* Mini Chart */}
        <div className="h-16 w-full pt-1">
          <svg viewBox="0 0 300 80" className="w-full h-full overflow-visible">
            <path
              d="M 10 50 C 50 30, 80 20, 120 40 C 160 55, 200 15, 240 25 C 270 30, 290 20, 290 20"
              fill="none"
              stroke="#f43f85"
              strokeWidth="2"
            />
            <path
              d="M 10 60 C 50 45, 80 35, 120 48 C 160 60, 200 30, 240 38 C 270 42, 290 35, 290 35"
              fill="none"
              stroke="#14b8a6"
              strokeWidth="2"
            />
            <path
              d="M 10 68 C 50 58, 80 50, 120 58 C 160 68, 200 48, 240 52 C 270 55, 290 50, 290 50"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.5"
            />
          </svg>
          <div className="flex justify-between text-[8px] text-slate-400 mt-1">
            <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
          </div>
        </div>
      </div>

      {/* Mini Roster Table */}
      <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">Attendance</span>
          <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {students.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-50 last:border-none">
              <div>
                <div className="font-semibold text-slate-800 text-[11px] leading-tight">{s.name}</div>
                <div className="text-[9px] text-slate-400 font-mono">{s.code}</div>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-[#10b981] text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span className="w-4 h-4 rounded-full bg-[#10b981] text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span className="text-slate-300 font-bold text-xs select-none px-1">&mdash;</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mini Pagination */}
        <div className="flex items-center justify-center space-x-1 pt-2">
          <span className="px-2 py-0.5 rounded bg-[#f43f85] text-white font-bold text-[10px]">1</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">2</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">3</span>
          <span className="text-[10px] text-slate-400">&hellip;</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">15</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[9px] text-slate-400 py-1 border-t border-slate-100">
        Copyright &copy; 2026 Patentrixx / ChuoMS
      </div>
    </div>
  );
}
