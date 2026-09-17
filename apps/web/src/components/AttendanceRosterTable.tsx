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

  // Initial Roster Data matching the exact screenshot
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
      name: 'Matteo Ricci',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    {
      id: '9',
      code: 'S-2113',
      name: 'Grace Johnson',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'absent', mar6: 'present', mar7: 'present' },
    },
    {
      id: '10',
      code: 'S-2114',
      name: 'Omar Hassan',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    // Seeded database records (Page 2)
    {
      id: '11',
      code: 'ADM-2026-0001',
      name: 'Alice Johnson',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    {
      id: '12',
      code: 'ADM-2026-0002',
      name: 'Bob Miller',
      roleType: 'student',
      attendance: { mar1: 'late', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'late' },
    },
    {
      id: '13',
      code: 'ADM-2022-0042',
      name: 'Clara Oswald',
      roleType: 'student',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    // Teachers
    {
      id: 't1',
      code: 'STF-CS-001',
      name: 'Dr. Alan Smith',
      roleType: 'teacher',
      department: 'Computer Science',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    {
      id: 't2',
      code: 'STF-SE-001',
      name: 'Dr. Grace Hopper',
      roleType: 'teacher',
      department: 'Software Engineering',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    // Staff
    {
      id: 's1',
      code: 'STF-REG-001',
      name: 'Margaret Hamilton',
      roleType: 'staff',
      department: 'Academic Registry',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
    {
      id: 's2',
      code: 'STF-FIN-001',
      name: 'Marcus Sterling',
      roleType: 'staff',
      department: 'Finance Division',
      attendance: { mar1: 'present', mar2: 'present', mar3: 'off', mar4: 'off', mar5: 'present', mar6: 'present', mar7: 'present' },
    },
  ]);

  // Toggle status on cell click (Interactive)
  const toggleStatus = (memberId: string, dateKey: string) => {
    setRoster((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const current = m.attendance[dateKey] || 'present';
        const nextMap: Record<AttendanceStatus, AttendanceStatus> = {
          present: 'late',
          late: 'absent',
          absent: 'off',
          off: 'present',
        };
        return {
          ...m,
          attendance: {
            ...m.attendance,
            [dateKey]: nextMap[current],
          },
        };
      }),
    );
  };

  const filteredMembers = roster.filter((m) => {
    if (activeTab === 'students' && m.roleType !== 'student') return false;
    if (activeTab === 'teachers' && m.roleType !== 'teacher') return false;
    if (activeTab === 'staff' && m.roleType !== 'staff') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q);
    }
    return true;
  });

  const totalResults = filteredMembers.length;
  const totalPages = Math.ceil(totalResults / pageSize) || 1;
  const paginatedMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize);

  const renderStatusBadge = (status: AttendanceStatus, isWeekend: boolean) => {
    if (isWeekend || status === 'off') {
      return (
        <span className="text-slate-300 font-bold text-xs select-none">
          &mdash;
        </span>
      );
    }

    if (status === 'present') {
      return (
        <span className="w-5 h-5 rounded-full bg-[#10b981] text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110">
          <Check className="w-3 h-3 stroke-[3]" />
        </span>
      );
    }

    if (status === 'absent') {
      return (
        <span className="w-5 h-5 rounded-full bg-[#f43f5e] text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110">
          <X className="w-3 h-3 stroke-[3]" />
        </span>
      );
    }

    if (status === 'late') {
      return (
        <span className="w-5 h-5 rounded-full bg-[#f59e0b] text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
        </span>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] border border-slate-100/80 space-y-4">
      {/* Top Bar: Heading + Tabs + Filter Dropdowns */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
          Attendance
        </h3>

        {/* Center / Right Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Role Tabs Switcher Pill */}
          <div className="inline-flex p-1 bg-slate-100/80 rounded-2xl">
            <button
              onClick={() => {
                setActiveTab('students');
                setPage(1);
              }}
              className={`px-3.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'students'
                  ? 'bg-[#f43f85] text-white shadow-sm'
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
              className={`px-3.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'teachers'
                  ? 'bg-[#f43f85] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Teachers
            </button>
            <button
              onClick={() => {
                setActiveTab('staff');
                setPage(1);
              }}
              className={`px-3.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'staff'
                  ? 'bg-[#f43f85] text-white shadow-sm'
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
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200/80 text-teal-700 text-xs font-semibold shadow-xs transition"
            >
              <span>{selectedClass.split(' ')[0]} {selectedClass.split(' ')[1]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-teal-600" />
            </button>

            {classDropdown && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 text-xs">
                {['Class 9A (BCS - Computer Science)', 'Class 10B (BSE - Software Eng)', 'Department of CS - All Cohorts'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedClass(c);
                      setClassDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 transition ${
                      c === selectedClass ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
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
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200/80 text-teal-700 text-xs font-semibold shadow-xs transition"
            >
              <span>{selectedMonth}</span>
              <ChevronDown className="w-3.5 h-3.5 text-teal-600" />
            </button>

            {monthDropdown && (
              <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 text-xs">
                {['Mar 2026', 'Feb 2026', 'Jan 2026', 'Apr 2026'].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setSelectedMonth(m);
                      setMonthDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 transition ${
                      m === selectedMonth ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
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
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
              <th className="py-3 px-4 sm:px-5 sticky left-0 bg-slate-50/90 backdrop-blur z-10 min-w-[190px]">
                <div className="flex items-center space-x-1 text-slate-600">
                  <span>Student</span>
                  <span className="text-[10px] text-slate-400">↕</span>
                </div>
              </th>
              {dates.map((d) => (
                <th key={d.key} className="py-3 px-3 text-center font-medium min-w-[75px] text-slate-500">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100/80">
            {paginatedMembers.map((member) => (
              <tr
                key={member.id}
                className="hover:bg-teal-50/20 transition-colors group"
              >
                {/* Member Identifier & Name (Sticky on horizontal mobile scroll) */}
                <td className="py-3 px-4 sm:px-5 sticky left-0 bg-white group-hover:bg-slate-50/90 transition-colors z-10">
                  <div className="font-medium text-slate-800 flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">
                      {member.code}
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="font-semibold text-slate-800 truncate">
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

      {/* Table Footer: Result Count & Pagination matching screenshot */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                  ? 'bg-[#f43f85] text-white shadow-xs'
                  : 'bg-slate-100/70 hover:bg-slate-200 text-slate-600'
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
