'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AttendanceSummaryCards from '../components/AttendanceSummaryCards';
import AttendanceOverviewChart from '../components/AttendanceOverviewChart';
import AttendanceRosterTable from '../components/AttendanceRosterTable';
import MobileDevicePreview from '../components/MobileDevicePreview';
import {
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  BookOpen,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const [viewMode, setViewMode] = useState<'standard' | 'side-by-side'>('side-by-side');
  const [dateRange, setDateRange] = useState('Today');
  const [timeframe, setTimeframe] = useState('Last Semester');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#e2e8f0]/40 flex flex-col justify-between">
      {/* Top Banner Notice for quick navigation to Curriculum & Login */}
      <div className="bg-white/90 backdrop-blur border-b border-slate-200/80 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-800">ChuoMS Enterprise Platform</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 hidden sm:inline">Designed to serve 10,000+ to 50,000+ concurrent students & faculty</span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admissions"
            className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center"
          >
            <GraduationCap className="w-3.5 h-3.5 mr-1" />
            Admissions Pipeline
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            href="/curriculum"
            className="text-teal-600 hover:text-teal-700 font-medium inline-flex items-center"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1" />
            Curriculum & Campuses
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            href="/login"
            className="text-[#f43f85] hover:text-pink-600 font-medium inline-flex items-center"
          >
            Role Switcher / Sign In &rarr;
          </Link>
        </div>
      </div>

      {/* Main App Container */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-6 lg:p-8">
        {viewMode === 'side-by-side' ? (
          /* ==================================================================== */
          /* SIDE-BY-SIDE MOCKUP VIEW (EXACTLY MATCHING USER SCREENSHOT)          */
          /* ==================================================================== */
          <div className="w-full max-w-[1400px] flex flex-col xl:flex-row items-center justify-center gap-8 py-4">
            {/* 1. Desktop / Tablet Card Mockup (Left Side of Screenshot) */}
            <div className="w-full xl:w-[860px] bg-white rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] border border-slate-200/90 overflow-hidden flex flex-row min-h-[920px]">
              {/* Left Vertical Sidebar */}
              <Sidebar currentTab="attendance" />

              {/* Main Content Area */}
              <div className="flex-1 bg-[#f8fafc] flex flex-col justify-between overflow-y-auto max-h-[920px]">
                <div>
                  <Header
                    title="Attendance"
                    breadcrumb="Dashboard  /  Attendance"
                    viewMode={viewMode}
                    onChangeViewMode={setViewMode}
                    onOpenMobileMenu={() => setMobileMenuOpen(true)}
                  />

                  <div className="px-4 sm:px-8 space-y-6 pb-6">
                    {/* Attendance Summary */}
                    <AttendanceSummaryCards
                      dateRange={dateRange}
                      onChangeDateRange={setDateRange}
                    />

                    {/* Attendance Overview Chart */}
                    <AttendanceOverviewChart
                      timeframe={timeframe}
                      onChangeTimeframe={setTimeframe}
                    />

                    {/* Attendance Roster Table */}
                    <AttendanceRosterTable />
                  </div>
                </div>

                {/* Footer matching screenshot */}
                <footer className="px-8 py-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
                  <div>
                    Copyright &copy; 2026 Patentrixx &bull; ChuoMS Enterprise
                  </div>
                  <div className="flex items-center space-x-4 text-[11px]">
                    <a href="#" className="hover:text-slate-600 transition">Privacy Policy</a>
                    <a href="#" className="hover:text-slate-600 transition">Terms and conditions</a>
                    <a href="#" className="hover:text-slate-600 transition">Contact</a>
                  </div>
                </footer>
              </div>
            </div>

            {/* 2. Mobile Phone Mockup (Right Side of Screenshot) */}
            <div className="hidden lg:flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Mobile Viewport Preview
              </span>
              <MobileDevicePreview />
            </div>
          </div>
        ) : (
          /* ==================================================================== */
          /* STANDARD FULL RESPONSIVE VIEW                                        */
          /* ==================================================================== */
          <div className="w-full max-w-7xl bg-white rounded-3xl shadow-[0_15px_45px_-10px_rgba(0,0,0,0.08)] border border-slate-200/80 overflow-hidden flex flex-row min-h-[900px]">
            {/* Sidebar */}
            <Sidebar currentTab="attendance" />

            {/* Main Content */}
            <div className="flex-1 bg-[#f8fafc] flex flex-col justify-between overflow-y-auto">
              <div>
                <Header
                  title="Attendance"
                  breadcrumb="Dashboard  /  Attendance"
                  viewMode={viewMode}
                  onChangeViewMode={setViewMode}
                  onOpenMobileMenu={() => setMobileMenuOpen(true)}
                />

                <div className="px-4 sm:px-8 space-y-6 pb-8">
                  {/* Attendance Summary */}
                  <AttendanceSummaryCards
                    dateRange={dateRange}
                    onChangeDateRange={setDateRange}
                  />

                  {/* Attendance Overview Chart */}
                  <AttendanceOverviewChart
                    timeframe={timeframe}
                    onChangeTimeframe={setTimeframe}
                  />

                  {/* Attendance Roster Table */}
                  <AttendanceRosterTable />
                </div>
              </div>

              {/* Footer */}
              <footer className="px-8 py-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
                <div>
                  Copyright &copy; 2026 Patentrixx &bull; ChuoMS Enterprise
                </div>
                <div className="flex items-center space-x-4 text-[11px]">
                  <a href="#" className="hover:text-slate-600 transition">Privacy Policy</a>
                  <a href="#" className="hover:text-slate-600 transition">Terms and conditions</a>
                  <a href="#" className="hover:text-slate-600 transition">Contact</a>
                </div>
              </footer>
            </div>
          </div>
        )}
      </main>

      {/* Global Bottom Status Bar */}
      <div className="bg-white border-t border-slate-200/80 px-6 py-3 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div>
          ChuoMS Enterprise CMS &bull; Clean Architecture &bull; Next.js 14 App Router &bull; PostgreSQL 16 &bull; NestJS 10
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/curriculum" className="text-teal-600 hover:underline">Curriculum Builder</Link>
          <Link href="/login" className="text-[#f43f85] hover:underline">Institutional Login</Link>
          <a href="http://localhost:4000/api/docs" target="_blank" rel="noreferrer" className="text-slate-600 hover:underline">API Docs</a>
        </div>
      </div>
    </div>
  );
}
