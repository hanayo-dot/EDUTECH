'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  UserCheck,
  Award,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  School,
  FileSpreadsheet,
  QrCode,
  Layers,
  Sparkles,
  BarChart3,
  Building2,
  Users,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  collapsed?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ElementType;
  href: string;
  category: 'core' | 'academics' | 'admissions' | 'system';
}

export default function Sidebar({ currentTab, onSelectTab }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems: NavItem[] = [
    // Core Overview
    {
      id: 'dashboard',
      label: 'Executive Overview',
      icon: LayoutDashboard,
      href: '/',
      category: 'core',
    },
    {
      id: 'timetable',
      label: 'Academic Timetable',
      badge: 'Live',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      icon: Calendar,
      href: '/timetable',
      category: 'core',
    },

    // Academics Operations
    {
      id: 'grades',
      label: 'Grades & Progression',
      badge: 'GPA',
      badgeColor: 'bg-royal-100 text-royal-700',
      icon: Award,
      href: '/grades',
      category: 'academics',
    },
    {
      id: 'attendance',
      label: 'Attendance & QR Engine',
      badge: '75% Rule',
      badgeColor: 'bg-amber-100 text-amber-800',
      icon: QrCode,
      href: '/attendance',
      category: 'academics',
    },
    {
      id: 'registration',
      label: 'Course Registration',
      icon: Layers,
      href: '/registration',
      category: 'academics',
    },
    {
      id: 'curriculum',
      label: 'Curriculum & Courses',
      icon: BookOpen,
      href: '/curriculum',
      category: 'academics',
    },

    // Admissions & Enrollment
    {
      id: 'admissions',
      label: 'Admissions Pipeline',
      badge: 'Intake',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      icon: GraduationCap,
      href: '/admissions',
      category: 'admissions',
    },

    // Governance & System
    {
      id: 'settings',
      label: 'Security & Access SSO',
      icon: ShieldCheck,
      href: '/login',
      category: 'system',
    },
  ];

  const categories = [
    { key: 'core', label: 'Overview' },
    { key: 'academics', label: 'Academics & Faculty' },
    { key: 'admissions', label: 'Enrollment' },
    { key: 'system', label: 'Governance' },
  ];

  const checkIsActive = (item: NavItem) => {
    if (item.href === '/' && pathname === '/') return true;
    if (item.href !== '/' && pathname?.startsWith(item.href)) return true;
    if (currentTab && item.id === currentTab) return true;
    return false;
  };

  return (
    <aside
      className={`relative bg-white border-r border-slate-200/80 flex flex-col justify-between flex-shrink-0 transition-all duration-300 z-30 shadow-sidebar ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-3 overflow-hidden group"
            title="ChuoMS Higher Education Platform"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-700 via-royal-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-royal-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <School className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-900 tracking-tight text-base">ChuoMS</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-royal-50 text-royal-700 border border-royal-200/60 uppercase">
                    CMS
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium truncate">
                  Metropolis University
                </span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden xl:flex w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 items-center justify-center transition"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Academic Session Indicator (Expanded view only) */}
        {!isCollapsed && (
          <div className="mx-3 mt-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-800">2026/2027 Fall Term</span>
                <span className="text-[10px] text-slate-500">Week 6 • Regular Session</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
              Active
            </span>
          </div>
        )}

        {/* Navigation Categories */}
        <nav className="p-3 space-y-5 mt-1">
          {categories.map((cat) => {
            const itemsInCat = navItems.filter((i) => i.category === cat.key);
            if (itemsInCat.length === 0) return null;

            return (
              <div key={cat.key} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {cat.label}
                  </div>
                )}
                <div className="space-y-1">
                  {itemsInCat.map((item) => {
                    const Icon = item.icon;
                    const isActive = checkIsActive(item);

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => {
                          if (onSelectTab) onSelectTab(item.id);
                        }}
                        className={`group relative flex items-center rounded-xl transition-all duration-150 ${
                          isCollapsed
                            ? 'w-12 h-12 mx-auto justify-center'
                            : 'px-3 py-2.5 space-x-3 w-full'
                        } ${
                          isActive
                            ? 'bg-royal-50/90 text-royal-700 font-semibold shadow-xs border border-royal-200/60'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                        }`}
                        title={item.label}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-royal-600 rounded-r-full" />
                        )}

                        <Icon
                          className={`w-5 h-5 flex-shrink-0 transition-colors ${
                            isActive
                              ? 'text-royal-600 stroke-[2.2]'
                              : 'text-slate-400 group-hover:text-slate-600 stroke-[1.8]'
                          }`}
                        />

                        {!isCollapsed && (
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="text-xs truncate tracking-tight">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  item.badgeColor || 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile / Quick Role Switcher */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <Link
          href="/login"
          className={`flex items-center rounded-xl transition hover:bg-white hover:shadow-xs p-2 border border-transparent hover:border-slate-200/70 group ${
            isCollapsed ? 'justify-center' : 'space-x-3'
          }`}
          title="Account, Security & Role Switcher"
        >
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-royal-800 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              AD
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">Dr. S. Jenkins</span>
              </div>
              <span className="text-[11px] text-slate-500 truncate block">Dean / Registrar</span>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
