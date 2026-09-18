'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Globe,
  Bell,
  Menu,
  X,
  ChevronDown,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
} from 'lucide-react';

interface HeaderProps {
  title?: string;
  breadcrumb?: string;
  onOpenMobileMenu?: () => void;
  viewMode?: 'standard' | 'side-by-side';
  onChangeViewMode?: (mode: 'standard' | 'side-by-side') => void;
  badge?: string;
}

export default function Header({
  title = 'Executive Dashboard',
  breadcrumb = 'Overview  /  Dashboard',
  onOpenMobileMenu,
  viewMode,
  onChangeViewMode,
  badge,
}: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState('Metropolis Main Campus');
  const [showCampusDropdown, setShowCampusDropdown] = useState(false);

  const campuses = [
    { id: 'main', name: 'Metropolis Main Campus', code: 'MET-01', active: true },
    { id: 'downtown', name: 'Downtown Medical Campus', code: 'MED-02', active: false },
    { id: 'tech', name: 'Westfield Tech Park', code: 'TECH-03', active: false },
  ];

  const notifications = [
    {
      id: 1,
      title: 'HOD Grade Moderation Pending',
      detail: 'CS201 Data Structures has 85 marks awaiting department sign-off.',
      time: '12m ago',
      type: 'warning',
    },
    {
      id: 2,
      title: '75% Attendance Warning Triggered',
      detail: '14 students in ENG102 Section B dropped below threshold.',
      time: '45m ago',
      type: 'alert',
    },
    {
      id: 3,
      title: 'Course Registration Window Active',
      detail: '86% of sophomore cohort have completed section enrollment.',
      time: '2h ago',
      type: 'info',
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Title & Breadcrumbs */}
      <div className="flex items-center space-x-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none">
              {title}
            </h1>
            {badge && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-royal-50 text-royal-700 border border-royal-200/60">
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1.5 mt-1 text-xs font-medium">
            <Link href="/" className="text-slate-400 hover:text-royal-600 transition">
              Portal
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-normal">
              {breadcrumb.replace(/^Overview\s*\/\s*/, '').replace(/^Dashboard\s*\/\s*/, '')}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5">
        {/* Campus Switcher Dropdown */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowCampusDropdown(!showCampusDropdown)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-xs font-medium text-slate-700 transition"
            title="Switch Active Campus"
          >
            <Building2 className="w-3.5 h-3.5 text-royal-600" />
            <span className="truncate max-w-[160px]">{selectedCampus}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showCampusDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-elevated border border-slate-200 p-2 z-50">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Institutional Campus
              </div>
              <div className="space-y-1">
                {campuses.map((camp) => (
                  <button
                    key={camp.id}
                    onClick={() => {
                      setSelectedCampus(camp.name);
                      setShowCampusDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition ${
                      selectedCampus === camp.name
                        ? 'bg-royal-50 text-royal-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{camp.name}</div>
                      <div className="text-[10px] text-slate-400">{camp.code}</div>
                    </div>
                    {selectedCampus === camp.name && (
                      <CheckCircle2 className="w-4 h-4 text-royal-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search button / input with shortcut */}
        <div className="relative">
          {showSearch ? (
            <div className="flex items-center bg-white border border-royal-500 rounded-xl px-3 py-1.5 shadow-sm ring-2 ring-royal-100">
              <Search className="w-4 h-4 text-royal-600 mr-2" />
              <input
                type="text"
                autoFocus
                placeholder="Search students, courses, staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setShowSearch(false)}
                className="text-xs bg-transparent focus:outline-none w-44 sm:w-60 text-slate-800"
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearch(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-xs text-slate-500 hover:text-slate-800 transition"
              title="Search Portal (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden lg:inline text-[11px]">Quick Search...</span>
              <kbd className="hidden lg:inline-flex text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 shadow-xs flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
            title="Institutional Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-royal-600 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900">Notifications</span>
                  <span className="text-[10px] font-semibold bg-royal-100 text-royal-700 px-1.5 py-0.5 rounded-full">
                    3 New
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Mark read
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((item) => (
                  <div key={item.id} className="py-2.5 px-1 hover:bg-slate-50 rounded-lg transition">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{item.title}</span>
                      <span className="text-[10px] text-slate-400">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2.5 mt-2 border-t border-slate-100 text-center">
                <Link
                  href="/grades"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-royal-600 hover:text-royal-700 inline-flex items-center"
                >
                  View all system logs &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Account / Role Quick Trigger */}
        <Link
          href="/login"
          className="flex items-center space-x-2.5 pl-1.5 group"
          title="Account Settings & SSO Roles"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-royal-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            AD
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 group-hover:text-royal-600 transition leading-tight">
              Dr. Jenkins
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Registrar / Admin</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
