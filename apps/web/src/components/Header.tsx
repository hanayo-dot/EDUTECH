'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Globe,
  Bell,
  Menu,
  X,
  Smartphone,
  Monitor,
  Check,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  title?: string;
  breadcrumb?: string;
  onOpenMobileMenu?: () => void;
  viewMode?: 'standard' | 'side-by-side';
  onChangeViewMode?: (mode: 'standard' | 'side-by-side') => void;
}

export default function Header({
  title = 'Attendance',
  breadcrumb = 'Dashboard  /  Attendance',
  onOpenMobileMenu,
  viewMode = 'standard',
  onChangeViewMode,
}: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="px-4 sm:px-8 py-5 flex items-center justify-between">
      {/* Left Title & Breadcrumb */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight leading-tight">
          {title}
        </h1>
        <div className="flex items-center space-x-1.5 mt-0.5 text-xs font-medium">
          <Link href="/" className="text-teal-500 hover:text-teal-600 transition">
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400 font-normal">
            {breadcrumb.replace(/^Dashboard\s*\/\s*/, '')}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5">
        {/* View Mode Toggle (Preview Desktop + Mobile side by side as in screenshot) */}
        {onChangeViewMode && (
          <div className="hidden lg:flex items-center bg-white p-1 rounded-xl border border-slate-200/80 shadow-sm text-xs font-medium mr-1">
            <button
              onClick={() => onChangeViewMode('standard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'standard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Full View</span>
            </button>
            <button
              onClick={() => onChangeViewMode('side-by-side')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'side-by-side'
                  ? 'bg-[#f43f85] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mockup (Side-by-Side)</span>
            </button>
          </div>
        )}

        {/* Search button / input */}
        <div className="relative">
          {showSearch ? (
            <div className="flex items-center bg-white border border-teal-300 rounded-xl px-3 py-1.5 shadow-sm">
              <Search className="w-4 h-4 text-teal-500 mr-2" />
              <input
                type="text"
                autoFocus
                placeholder="Search students, staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setShowSearch(false)}
                className="text-xs bg-transparent focus:outline-none w-36 sm:w-48 text-slate-800"
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
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 transition"
              title="Search"
            >
              <Search className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {/* Globe / Campus Switcher */}
        <button
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          title="Multi-Campus Switcher: Main Campus (Metropolis)"
        >
          <Globe className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          title="Institutional Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f43f85]" />
        </button>

        {/* Profile Avatar */}
        <Link
          href="/login"
          className="flex items-center space-x-2 pl-1 group"
          title="Profile & Roles"
        >
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl p-[2px] bg-gradient-to-tr from-pink-500 via-rose-400 to-sky-400 shadow-xs">
            <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
              {/* Profile icon avatar */}
              <div className="w-full h-full bg-gradient-to-br from-pink-100 to-teal-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                JD
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
        </Link>

        {/* Mobile menu hamburger toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
