'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  SlidersHorizontal,
  Search,
  Filter,
} from 'lucide-react';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'off';

export interface RosterMember {
  id: string;
  code: string;
  name: string;
  roleType: 'student' | 'teacher' | 'staff';
  department?: string;
  attendance: Record<string, AttendanceStatus>;
}

export default function AttendanceRosterTable() {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'staff'>('students');
  const [selectedClass, setSelectedClass] = useState('Class 9A (BCS - Computer Science)');
  const [selectedMonth, setSelectedMonth] = useState('Mar 2026');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const [classDropdown, setClassDropdown] = useState(false);
  const [monthDropdown, setMonthDropdown] = useState(false);

  // Dates for columns
  const dates = [
    { key: 'mar1', label: 'Thu, Mar 1', isWeekend: false },
    { key: 'mar2', label: 'Fri, Mar 2', isWeekend: false },
    { key: 'mar3', label: 'Sat, Mar 3', isWeekend: true },
    { key: 'mar4', label: 'Sun, Mar 4', isWeekend: true },
    { key: 'mar5', label: 'Mon, Mar 5', isWeekend: false },
    { key: 'mar6', label: 'Tue, Mar 6', isWeekend: false },
    { key: 'mar7', label: 'Wed, Mar 7', isWeekend: false },
  ];

  // Initial Roster Data
  const [roster, setRoster] = useState<RosterMember[]>([
    {
      id: '1',
      code: 'S-2102',
      name: 'Emma Williams',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    {
      id: '2',
      code: 'S-2103',
      name: 'Thomas Green',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    {
      id: '3',
      code: 'S-2105',
      name: 'Sophia Martin',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    {
      id: '4',
      code: 'S-2109',
      name: 'Lucas Müller',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'absent', mar6: 'present', mar7: 'present' },
    },
    {
      id: '5',
      code: 'S-2101',
      name: 'Hannah Lee',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    {
      id: '6',
      code: 'S-2102',
      name: 'Daniel Park',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'late', mar7: 'present' },
    },
    {
      id: '7',
      code: 'S-2111',
      name: 'Aisha Khan',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    {
      id: '8',
      code: 'S-2112',
      name: 'Liam Davies',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    {
      id: '9',
      code: 'S-2115',
      name: 'Maya Patel',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'absent' },
    },
    {
      id: '10',
      code: 'S-2118',
      name: 'Gabriel Santos',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    // Faculty
    {
      id: '11',
      code: 'T-104',
      name: 'Dr. Sarah Jenkins',
      roleType: 'teacher',
      department: 'Computer Science',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    {
      id: '12',
      code: 'T-108',
      name: 'Prof. Marcus Vance',
      roleType: 'teacher',
      department: 'Mathematics',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'late', mar7: 'present' },
    },
    // Staff
    {
      id: '13',
      code: 'ST-01',
      name: 'Eleanor Vance',
      roleType: 'staff',
      department: 'Registrar Office',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
  ]);

  const toggleStatus = (memberId: string, dayKey: string) => {
    const cycle: Record<AttendanceStatus, AttendanceStatus> = {
      present: 'late',
      late: 'absent',
      absent: 'present',
      off: 'off',
    };

    setRoster((prev) =>
      prev.map((item) => {
        if (item.id !== memberId) return item;
        const current = item.attendance[dayKey] || 'present';
        return {
          ...item,
          attendance: {
            ...item.attendance,
            [dayKey]: cycle[current],
          },
        };
      })
    );
  };

  const filteredMembers = roster.filter((m) => {
    if (m.roleType !== activeTab.slice(0, -1) && (activeTab !== 'students' || m.roleType !== 'student')) {
      if (activeTab === 'teachers' && m.roleType !== 'teacher') return false;
      if (activeTab === 'staff' && m.roleType !== 'staff') return false;
      if (activeTab === 'students' && m.roleType !== 'student') return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q);
    }
    return true;
  });

  const totalResults = filteredMembers.length;
  const totalPages = Math.ceil(totalResults / pageSize) || 1;
  const paginatedMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize);

  const renderStatusBadge = (status: AttendanceStatus, isWeekend?: boolean) => {
    if (isWeekend || status === 'off') {
      return (
        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">
          &minus;
        </span>
      );
    }

    if (status === 'present') {
      return (
        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110">
          <Check className="w-3 h-3 stroke-[3]" />
        </span>
      );
    }

    if (status === 'absent') {
      return (
        <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110">
          <X className="w-3 h-3 stroke-[3]" />
        </span>
      );
    }

    if (status === 'late') {
      return (
        <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
        </span>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-slate-200/80 space-y-4">
      {/* Top Bar: Heading + Tabs + Filter Dropdowns */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Academic Roster & Daily Attendance Grid
          </h3>
          <p className="text-xs text-slate-500">
            Interactive attendance register with click-to-toggle status updates
          </p>
        </div>

        {/* Center / Right Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Role Tabs Switcher Pill */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            <button
              onClick={() => {
                setActiveTab('students');
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'students'
                  ? 'bg-royal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => {
                setActiveTab('teachers');
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'teachers'
                  ? 'bg-royal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty
            </button>
            <button
              onClick={() => {
                setActiveTab('staff');
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'staff'
                  ? 'bg-royal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff
            </button>
          </div>

          {/* Class Dropdown */}
          <div className="relative">
            <button
              onClick={() => setClassDropdown(!classDropdown)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-semibold shadow-xs transition"
            >
              <span>{selectedClass.split(' ')[0]} {selectedClass.split(' ')[1]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {classDropdown && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-elevated border border-slate-200 py-1.5 z-30 text-xs">
                {['Class 9A (BCS - Computer Science)', 'Class 10B (BSE - Software Eng)', 'Department of CS - All Cohorts'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedClass(c);
                      setClassDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 transition ${
                      c === selectedClass ? 'bg-royal-50 text-royal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Month Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMonthDropdown(!monthDropdown)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-semibold shadow-xs transition"
            >
              <span>{selectedMonth}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {monthDropdown && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-elevated border border-slate-200 py-1.5 z-30 text-xs">
                {['Mar 2026', 'Feb 2026', 'Jan 2026', 'Apr 2026'].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setSelectedMonth(m);
                      setMonthDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 transition ${
                      m === selectedMonth ? 'bg-royal-50 text-royal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Roster Table (Horizontally scrollable with sticky Student column) */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
              <th className="py-3 px-4 sm:px-5 sticky left-0 bg-slate-50 backdrop-blur z-10 min-w-[200px]">
                <div className="flex items-center space-x-1 text-slate-700">
                  <span>Name & Admission ID</span>
                  <span className="text-[10px] text-slate-400">↕</span>
                </div>
              </th>
              {dates.map((d) => (
                <th key={d.key} className="py-3 px-3 text-center font-medium min-w-[80px] text-slate-600">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedMembers.map((member) => (
              <tr
                key={member.id}
                className="hover:bg-royal-50/30 transition-colors group"
              >
                {/* Member Identifier & Name (Sticky on horizontal mobile scroll) */}
                <td className="py-3 px-4 sm:px-5 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10">
                  <div className="font-medium text-slate-800 flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-royal-700 font-bold bg-royal-50 px-1.5 py-0.5 rounded border border-royal-200/60">
                      {member.code}
                    </span>
                    <span className="font-semibold text-slate-900 truncate">
                      {member.name}
                    </span>
                  </div>
                </td>

                {/* Day Attendance Status Icons */}
                {dates.map((d) => {
                  const status = member.attendance[d.key] || (d.isWeekend ? 'off' : 'present');
                  return (
                    <td
                      key={d.key}
                      onClick={() => !d.isWeekend && toggleStatus(member.id, d.key)}
                      className={`py-3 px-3 text-center ${
                        !d.isWeekend ? 'cursor-pointer hover:bg-slate-100/60' : ''
                      }`}
                      title={!d.isWeekend ? 'Click to cycle status' : 'Weekend'}
                    >
                      <div className="flex items-center justify-center">
                        {renderStatusBadge(status, d.isWeekend)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            {paginatedMembers.length === 0 && (
              <tr>
                <td colSpan={dates.length + 1} className="py-8 text-center text-slate-400">
                  No records found for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer: Result Count & Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-royal-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>of {totalResults} results</span>
        </div>

        {/* Pagination Pills */}
        <div className="inline-flex items-center space-x-1.5">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center text-slate-600 transition"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-7 h-7 rounded-lg font-semibold text-xs transition ${
                page === p
                  ? 'bg-royal-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center text-slate-600 transition"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
