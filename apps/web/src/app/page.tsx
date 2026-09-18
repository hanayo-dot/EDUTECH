'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
  Users,
  Calendar,
  Award,
  BookOpen,
  UserCheck,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ChevronRight,
  Building2,
  FileSpreadsheet,
  QrCode,
  MapPin,
  Activity,
  ExternalLink,
} from 'lucide-react';

export default function HomePage() {
  const [selectedFaculty, setSelectedFaculty] = useState('ALL');

  // Key Institutional KPIs
  const kpiStats = [
    {
      label: 'Total Active Students',
      value: '14,850',
      change: '+6.2%',
      trend: 'up',
      detail: 'Across 6 Faculties & 3 Campuses',
      icon: Users,
      color: 'royal',
    },
    {
      label: 'Active Course Sections',
      value: '418',
      change: '98.2%',
      trend: 'up',
      detail: 'Room Capacity Utilization Rate',
      icon: Layers,
      color: 'indigo',
    },
    {
      label: 'Campus Attendance Rate',
      value: '89.4%',
      change: '94.1%',
      trend: 'up',
      detail: 'Above 75% Exam Eligibility Cutoff',
      icon: UserCheck,
      color: 'emerald',
    },
    {
      label: 'Mean Academic CGPA',
      value: '3.34',
      change: '1,240',
      trend: 'up',
      detail: 'Students on Dean’s Honors List',
      icon: Award,
      color: 'amber',
    },
  ];

  // Core Subsystem Modules
  const subsystemCards = [
    {
      id: 'grades',
      title: 'Assessments & Gradebook',
      badge: 'Phase 10 Certified',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      description:
        'Continuous assessment weightings, secure exam marks entry, HoD moderation workflow, and automated GPA progression.',
      statusText: '8 Sections Pending HoD Sign-off',
      statusType: 'warning',
      icon: Award,
      href: '/grades',
      cta: 'Manage Gradebook',
      highlights: ['4-Stage Moderation', 'CGPA Engine', 'Dean’s Honors List'],
    },
    {
      id: 'timetable',
      title: 'Timetable & Space Allocation',
      badge: 'Conflict-Free',
      badgeColor: 'bg-royal-50 text-royal-700 border-royal-200/60',
      description:
        'Algorithmic conflict detection across lecturers, cohorts, and rooms. Automated schedule publishing and room utilization.',
      statusText: '142 Daily Sessions Active',
      statusType: 'success',
      icon: Calendar,
      href: '/timetable',
      cta: 'View Timetable',
      highlights: ['Zero Clashes', 'Room Allocation', 'Lecturer Roster'],
    },
    {
      id: 'attendance',
      title: 'Attendance & QR Engine',
      badge: '75% Exam Rule',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/60',
      description:
        'Dynamic time-decaying QR codes, lecturer manual rosters, and automated alerts for students risking exam debarment.',
      statusText: 'Live Dynamic Token Active',
      statusType: 'success',
      icon: QrCode,
      href: '/attendance',
      cta: 'Launch Attendance',
      highlights: ['Dynamic QR Code', 'Exam Barring Rule', 'Live Attendance Stream'],
    },
    {
      id: 'registration',
      title: 'High-Concurrency Registration',
      badge: 'Round 1 Active',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
      description:
        'Pessimistic row locking on section capacities, prerequisite validation, and automated financial/academic hold checks.',
      statusText: '86% Enrolled • 14% Seats Left',
      statusType: 'info',
      icon: Layers,
      href: '/registration',
      cta: 'Registration Window',
      highlights: ['Pessimistic Locks', 'Prerequisite Tree', 'Hold Checks'],
    },
    {
      id: 'admissions',
      title: 'Admissions & Matriculation',
      badge: 'Intake 2026/27',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/60',
      description:
        'Public applicant intake, document scoring, automated offer letters with cryptographic verification QR, and matriculation.',
      statusText: '3,420 Total Applicants',
      statusType: 'info',
      icon: GraduationCap,
      href: '/admissions',
      cta: 'Admissions Pipeline',
      highlights: ['Offer Letter QR', 'Scoring Rubric', 'Batch Matriculation'],
    },
    {
      id: 'curriculum',
      title: 'Curriculum & Hierarchy',
      badge: '64 Programs',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      description:
        'Multi-campus structure (Institution &rarr; Campus &rarr; Faculty &rarr; Dept &rarr; Program), course graph, and versioned curricula.',
      statusText: '6 Faculties • 28 Departments',
      statusType: 'neutral',
      icon: BookOpen,
      href: '/curriculum',
      cta: 'Curriculum Graph',
      highlights: ['Degree Audits', 'Prerequisite DAG', 'Multi-Campus'],
    },
  ];

  // Today's Live Academic Schedule
  const liveSessions = [
    {
      code: 'CS101',
      title: 'Introduction to Computer Science',
      time: '09:00 - 11:00 AM',
      room: 'Lecture Hall 101 (Main Campus)',
      lecturer: 'Dr. Sarah Jenkins',
      studentsEnrolled: 120,
      studentsPresent: 112,
      status: 'IN_SESSION',
    },
    {
      code: 'MATH201',
      title: 'Multivariable Calculus & Linear Algebra',
      time: '11:15 - 01:15 PM',
      room: 'Science Complex B-204',
      lecturer: 'Prof. Marcus Vance',
      studentsEnrolled: 85,
      studentsPresent: 79,
      status: 'UPCOMING',
    },
    {
      code: 'ENG102',
      title: 'Engineering Mechanics & Dynamics',
      time: '02:00 - 04:00 PM',
      room: 'Engineering Lab 3',
      lecturer: 'Dr. Elena Rostova',
      studentsEnrolled: 64,
      studentsPresent: 0,
      status: 'SCHEDULED',
    },
  ];

  // Immutable Audit Feed
  const recentAudits = [
    {
      id: 'aud-1',
      event: 'GRADEBOOK_MODERATED',
      actor: 'Prof. A. Thorne (HoD Computing)',
      target: 'CS101 Intro to Computer Science (Sec A)',
      timestamp: '14 minutes ago',
      details: '85 student scores approved and forwarded to Dean.',
    },
    {
      id: 'aud-2',
      event: 'TIMETABLE_RESOLVED',
      actor: 'System Scheduling Engine',
      target: 'Room Science B-204 Conflict Auto-Resolved',
      timestamp: '38 minutes ago',
      details: 'Shifted Section B to 11:15 AM to eliminate lecturer collision.',
    },
    {
      id: 'aud-3',
      event: 'MATRICULATION_COMMITTED',
      actor: 'Registrar Admissions Office',
      target: 'Cohort 2026/2027 Freshman Intake',
      timestamp: '1 hour ago',
      details: 'Generated 240 student ID cards and institutional email aliases.',
    },
    {
      id: 'aud-4',
      event: 'EXAM_ELIGIBILITY_ALERT',
      actor: 'Automated 75% Attendance Guard',
      target: 'ENG102 Engineering Mechanics',
      timestamp: '2 hours ago',
      details: 'Notified 3 students with <75% attendance of pending exam debarment.',
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar currentTab="dashboard" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Executive Institutional Overview"
          breadcrumb="Overview  /  Dashboard"
          badge="Fall 2026 Active"
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Banner with Quick Actions */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-royal-900 via-royal-800 to-indigo-900 text-white p-6 sm:p-8 shadow-card border border-royal-700/50">
            {/* Subtle background ornamentation */}
            <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-royal-600/20 blur-3xl pointer-events-none" />
            <div className="absolute right-32 -bottom-16 w-48 h-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold text-royal-200 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Metropolis University • Main Campus</span>
                  <span>•</span>
                  <span>Fall Term 2026/2027 (Week 6)</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  College Operations & Governance Command Center
                </h2>
                <p className="text-royal-100 text-sm mt-1.5 max-w-2xl leading-relaxed">
                  Enterprise higher-education management system orchestrating course registration, 
                  conflict-free scheduling, dynamic QR attendance, and secure gradebook moderation.
                </p>
              </div>

              {/* Fast Action Shortcuts */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/grades"
                  className="px-4 py-2.5 rounded-xl bg-white text-royal-900 hover:bg-royal-50 font-semibold text-xs shadow-sm transition flex items-center space-x-1.5"
                >
                  <Award className="w-4 h-4 text-royal-600" />
                  <span>Gradebook Moderation</span>
                </Link>
                <Link
                  href="/timetable"
                  className="px-4 py-2.5 rounded-xl bg-royal-700/80 hover:bg-royal-700 text-white font-semibold text-xs border border-royal-600/60 shadow-sm transition flex items-center space-x-1.5"
                >
                  <Calendar className="w-4 h-4 text-royal-200" />
                  <span>Timetable & Rooms</span>
                </Link>
                <Link
                  href="/attendance"
                  className="px-4 py-2.5 rounded-xl bg-royal-700/80 hover:bg-royal-700 text-white font-semibold text-xs border border-royal-600/60 shadow-sm transition flex items-center space-x-1.5"
                >
                  <QrCode className="w-4 h-4 text-royal-200" />
                  <span>Live QR Check-In</span>
                </Link>
              </div>
            </div>
          </div>

          {/* KPI Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiStats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all group"
                >
                  <div className="flex items-center justify-between text-slate-500 mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {stat.label}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-royal-50 text-royal-700 flex items-center justify-center group-hover:bg-royal-600 group-hover:text-white transition">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-tabular tracking-tight">
                      {stat.value}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{stat.detail}</p>
                </div>
              );
            })}
          </div>

          {/* Academic Subsystems Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Academic Subsystems & Workflows
                </h3>
                <p className="text-xs text-slate-500">
                  Select a domain module to access real-time operational workflows
                </p>
              </div>
              <span className="text-xs text-royal-700 font-medium">All 6 Systems Operational</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {subsystemCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-royal-700 group-hover:bg-royal-50 transition">
                          <Icon className="w-5 h-5 stroke-[2]" />
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${card.badgeColor}`}
                        >
                          {card.badge}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 group-hover:text-royal-600 transition">
                        {card.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {card.description}
                      </p>

                      {/* Feature Highlights Pills */}
                      <div className="flex flex-wrap gap-1.5 mt-3.5">
                        {card.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-100/80 text-slate-600 px-2 py-0.5 rounded font-medium"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-600 truncate max-w-[170px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="truncate">{card.statusText}</span>
                      </div>
                      <Link
                        href={card.href}
                        className="text-xs font-semibold text-royal-700 hover:text-royal-800 inline-flex items-center space-x-1 group-hover:translate-x-0.5 transition"
                      >
                        <span>{card.cta}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Operations & Immutable Audit Stream Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Today's Class Schedule & Space Allocation */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-royal-50 text-royal-700 rounded-xl">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Today’s Live Academic Sessions</h4>
                      <p className="text-[11px] text-slate-500">Real-time lecture hall monitoring & rosters</p>
                    </div>
                  </div>
                  <Link
                    href="/timetable"
                    className="text-xs font-semibold text-royal-700 hover:text-royal-800"
                  >
                    View All &rarr;
                  </Link>
                </div>

                <div className="space-y-3">
                  {liveSessions.map((session, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded bg-royal-100 text-royal-800 text-xs font-bold font-mono">
                            {session.code}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{session.title}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-slate-400" />
                            {session.time}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                            {session.room}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium">
                          Lecturer: {session.lecturer}
                        </div>
                      </div>

                      <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 flex-shrink-0">
                        {session.status === 'IN_SESSION' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse mr-1" />
                            Live In Session
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                            {session.status}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 font-tabular">
                          {session.studentsPresent}/{session.studentsEnrolled} Present
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 text-center">
                <Link
                  href="/attendance"
                  className="text-xs font-semibold text-royal-700 hover:text-royal-800 inline-flex items-center"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1" />
                  Launch Class Check-In Token Generator &rarr;
                </Link>
              </div>
            </div>

            {/* Right: Immutable Security & Audit Log Stream */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Tamper-Evident Audit Trail</h4>
                      <p className="text-[11px] text-slate-500">Live immutable logs with actor attribution</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                    Audit Guard Active
                  </span>
                </div>

                <div className="space-y-3">
                  {recentAudits.map((aud) => (
                    <div
                      key={aud.id}
                      className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50 transition space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                            {aud.event}
                          </span>
                          <span className="font-semibold text-slate-800">{aud.actor}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{aud.timestamp}</span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-700">{aud.target}</div>
                      <p className="text-[11px] text-slate-500">{aud.details}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 text-center">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-royal-700 hover:text-royal-800 inline-flex items-center"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  View Security Credentials & Roles &rarr;
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Global Footer */}
        <footer className="bg-white border-t border-slate-200/80 px-6 py-4 mt-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-800">ChuoMS</span>
              <span>&bull;</span>
              <span>Enterprise College Management System</span>
              <span>&bull;</span>
              <span className="text-slate-400">PostgreSQL 16 &bull; NestJS 10 &bull; Next.js 14</span>
            </div>
            <div className="flex items-center space-x-4 text-[11px]">
              <Link href="/curriculum" className="hover:text-royal-600 transition">
                Curriculum
              </Link>
              <Link href="/admissions" className="hover:text-royal-600 transition">
                Admissions
              </Link>
              <Link href="/grades" className="hover:text-royal-600 transition">
                Gradebook
              </Link>
              <Link href="/login" className="hover:text-royal-600 transition">
                Admin SSO
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
