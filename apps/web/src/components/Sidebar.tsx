'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  BookOpen,
  Clock,
  UserCheck,
  BarChart3,
  Settings,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';

interface SidebarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export default function Sidebar({ currentTab = 'attendance', onSelectTab }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { id: 'admissions', label: 'Admissions & Applicants', icon: GraduationCap, href: '/admissions' },
    { id: 'curriculum', label: 'Courses & Curriculum', icon: BookOpen, href: '/curriculum' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/curriculum?tab=calendar' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, href: '#' },
    { id: 'attendance', label: 'Attendance', icon: UserCheck, href: '/' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, href: '#' },
    { id: 'settings', label: 'Institutional Admin & Roles', icon: Settings, href: '/login' },
  ];

  return (
    <aside className="w-16 sm:w-20 bg-white border-r border-slate-100 flex flex-col items-center py-6 justify-between flex-shrink-0 min-h-screen">
      {/* Top Brand Logo */}
      <div className="flex flex-col items-center space-y-8">
        <Link href="/" className="group relative flex items-center justify-center" title="ChuoMS Portal">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ec4899] via-[#f43f85] to-[#38bdf8] p-[2px] shadow-sm transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-[#f43f85]">
                <path
                  d="M17 8C17 5.79086 15.2091 4 13 4H9C6.79086 4 5 5.79086 5 8C5 10.2091 6.79086 12 9 12H15C17.2091 12 19 13.7909 19 16C19 18.2091 17.2091 20 15 20H11C8.79086 20 7 18.2091 7 16"
                  stroke="url(#brandGrad)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="brandGrad" x1="5" y1="4" x2="19" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f43f85" />
                    <stop offset="0.6" stopColor="#ec4899" />
                    <stop offset="1" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </Link>

        {/* Navigation Icon List */}
        <nav className="flex flex-col items-center space-y-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isAttendance = item.id === 'attendance' && (pathname === '/' || pathname === '/attendance');
            const isCurriculum = item.id === 'curriculum' && pathname === '/curriculum';
            const isAdmissions = item.id === 'admissions' && pathname?.startsWith('/admissions');
            const isActive = isAttendance || isCurriculum || isAdmissions || (item.id === currentTab);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  if (onSelectTab && (item.id === 'attendance' || item.id === 'dashboard')) {
                    onSelectTab(item.id);
                  }
                }}
                className={`group relative p-3 rounded-2xl transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? 'bg-pink-100/90 text-[#f43f85] shadow-sm ring-1 ring-pink-200/60'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                {/* Subtle active indicator dot */}
                {isActive && (
                  <span className="absolute -right-1 w-1.5 h-1.5 rounded-full bg-[#f43f85]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile / Quick Switch */}
      <div className="flex flex-col items-center space-y-4">
        <Link
          href="/login"
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 p-0.5 border border-slate-200 flex items-center justify-center transition"
          title="User Account & Roles"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-pink-400 to-sky-400 flex items-center justify-center text-white font-bold text-xs">
            A
          </div>
        </Link>
      </div>
    </aside>
  );
}
