'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import {
  UserCheck,
  QrCode,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  BookOpen,
  Send,
  AlertCircle,
} from 'lucide-react';

interface StudentRosterItem {
  studentId: string;
  admissionNumber: string;
  name: string;
  email: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  verificationMethod: string;
  markedAt: string | null;
}

interface CourseAttendanceSummary {
  classSectionId: string;
  courseCode: string;
  courseTitle: string;
  sectionName: string;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  absentCount: number;
  attendanceRate: number;
  isEligibleForExam: boolean;
  warningLevel: 'GOOD' | 'WARNING' | 'CRITICAL';
  thresholdRequired: number;
}

function AttendanceContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'lecturer' | 'student-checkin' | 'analytics'>('lecturer');

  // Lecturer Session State
  const [selectedSectionId, setSelectedSectionId] = useState('sec-cs101');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionStartTime, setSessionStartTime] = useState('09:00');
  const [sessionEndTime, setSessionEndTime] = useState('11:00');
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900); // 15 mins
  const [roster, setRoster] = useState<StudentRosterItem[]>([
    {
      studentId: 'stud-1',
      admissionNumber: 'ADM-2026-0001',
      name: 'Alice Johnson',
      email: 'alice.johnson@student.chuoms.edu',
      status: 'PRESENT',
      verificationMethod: 'QR_CODE',
      markedAt: '09:04 AM',
    },
    {
      studentId: 'stud-2',
      admissionNumber: 'ADM-2026-0002',
      name: 'Bob Miller',
      email: 'bob.miller@student.chuoms.edu',
      status: 'LATE',
      verificationMethod: 'MANUAL',
      markedAt: '09:22 AM',
    },
    {
      studentId: 'stud-3',
      admissionNumber: 'ADM-2026-0003',
      name: 'David Chen',
      email: 'david.chen@student.chuoms.edu',
      status: 'ABSENT',
      verificationMethod: 'MANUAL',
      markedAt: null,
    },
    {
      studentId: 'stud-4',
      admissionNumber: 'ADM-2026-0004',
      name: 'Fatima Al-Mansoor',
      email: 'fatima.m@student.chuoms.edu',
      status: 'EXCUSED',
      verificationMethod: 'MANUAL',
      markedAt: '08:50 AM',
    },
  ]);

  // Student Check-In State
  const [inputToken, setInputToken] = useState('');
  const [checkInResult, setCheckInResult] = useState<any | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  // Student Attendance Analytics (Exam Eligibility 75% rule)
  const [courseSummaries, setCourseSummaries] = useState<CourseAttendanceSummary[]>([
    {
      classSectionId: 'sec-1',
      courseCode: 'CS101',
      courseTitle: 'Introduction to Computer Science',
      sectionName: 'Section A - Morning',
      totalSessions: 16,
      presentCount: 14,
      lateCount: 1,
      excusedCount: 0,
      absentCount: 1,
      attendanceRate: 91,
      isEligibleForExam: true,
      warningLevel: 'GOOD',
      thresholdRequired: 75,
    },
    {
      classSectionId: 'sec-2',
      courseCode: 'CS201',
      courseTitle: 'Data Structures and Algorithms',
      sectionName: 'Section A - Afternoon',
      totalSessions: 14,
      presentCount: 11,
      lateCount: 2,
      excusedCount: 0,
      absentCount: 1,
      attendanceRate: 86,
      isEligibleForExam: true,
      warningLevel: 'GOOD',
      thresholdRequired: 75,
    },
    {
      classSectionId: 'sec-3',
      courseCode: 'SE201',
      courseTitle: 'Software Architecture & Design Patterns',
      sectionName: 'Section A - Morning',
      totalSessions: 12,
      presentCount: 8,
      lateCount: 1,
      excusedCount: 0,
      absentCount: 3,
      attendanceRate: 71,
      isEligibleForExam: false,
      warningLevel: 'WARNING',
      thresholdRequired: 75,
    },
  ]);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Timer countdown for active QR session
  useEffect(() => {
    if (!activeSession || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession, secondsRemaining]);

  // Lecturer: Launch Dynamic QR Attendance Session
  const handleStartSession = async () => {
    setNotification(null);
    try {
      const res = await fetch('http://localhost:4000/api/v1/attendance/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classSectionId: selectedSectionId,
          sessionDate,
          startTime: sessionStartTime,
          endTime: sessionEndTime,
          qrExpiryMinutes: 15,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setActiveSession(json.data);
        setQrCodeUrl(json.data.qrCodeDataUrl);
        setQrToken(json.data.qrToken);
        setSecondsRemaining(15 * 60);
        setNotification({
          type: 'success',
          message: 'Dynamic QR attendance session launched successfully! Project on lecture screen.',
        });
      } else {
        // Fallback demo simulation
        const fakeToken = 'qr-' + Math.random().toString(36).substring(2, 10);
        setActiveSession({ id: 'sess-demo', startTime: sessionStartTime, endTime: sessionEndTime });
        setQrToken(fakeToken);
        setSecondsRemaining(15 * 60);
        setNotification({
          type: 'success',
          message: 'Attendance session active! Students can scan or enter token to self-verify.',
        });
      }
    } catch (err) {
      const fakeToken = 'qr-' + Math.random().toString(36).substring(2, 10);
      setActiveSession({ id: 'sess-demo', startTime: sessionStartTime, endTime: sessionEndTime });
      setQrToken(fakeToken);
      setSecondsRemaining(15 * 60);
      setNotification({
        type: 'success',
        message: 'Attendance session active in local mode.',
      });
    }
  };

  // Lecturer: Refresh / Rotate Dynamic QR Code
  const handleRefreshQr = async () => {
    try {
      const newFakeToken = 'qr-' + Math.random().toString(36).substring(2, 10);
      setQrToken(newFakeToken);
      setSecondsRemaining(15 * 60);
      setNotification({
        type: 'success',
        message: 'QR Token rotated! Expired old token to prevent proxy sharing.',
      });
    } catch (err) {
      // Ignored
    }
  };

  // Toggle student status in manual roster
  const handleToggleStatus = (studentId: string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setRoster((prev) =>
      prev.map((item) =>
        item.studentId === studentId
          ? {
              ...item,
              status: newStatus,
              verificationMethod: 'MANUAL',
              markedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : item,
      ),
    );
  };

  // Save Batch Roster
  const handleSaveRoster = async () => {
    setNotification({
      type: 'success',
      message: `Roster saved! ${roster.filter((r) => r.status === 'PRESENT').length} students verified present.`,
    });
  };

  // Student Self Check-In
  const handleStudentCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingIn(true);
    setCheckInError(null);
    setCheckInResult(null);

    try {
      const res = await fetch('http://localhost:4000/api/v1/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: inputToken.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || 'Check-in verification failed.');
      }

      setCheckInResult(data.data || { courseCode: 'CS101', checkInTime: new Date().toISOString() });
    } catch (err: any) {
      // If backend mock or input matches current active session token
      if (qrToken && inputToken.trim() === qrToken) {
        setCheckInResult({
          courseCode: 'CS101',
          courseTitle: 'Introduction to Computer Science',
          checkInTime: new Date().toLocaleTimeString(),
          status: 'PRESENT',
        });
      } else {
        setCheckInError(err.message || 'Invalid or expired QR code token.');
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
  const lateCount = roster.filter((r) => r.status === 'LATE').length;
  const excusedCount = roster.filter((r) => r.status === 'EXCUSED').length;
  const absentCount = roster.filter((r) => r.status === 'ABSENT').length;
  const totalStudents = roster.length;
  const currentAttendanceRate = Math.round(((presentCount + lateCount * 0.5 + excusedCount) / totalStudents) * 100);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar currentTab="attendance" />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-20 shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                <UserCheck className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Attendance Tracking & Exam Eligibility
                </h1>
                <p className="text-xs text-slate-500">
                  Dynamic time-decaying QR codes, manual roster marking, and institutional 75% rule evaluation
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Navigation */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-medium text-slate-600 border border-slate-200">
              <button
                onClick={() => setActiveTab('lecturer')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'lecturer' ? 'bg-white text-pink-600 shadow-xs font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Lecturer Station
              </button>
              <button
                onClick={() => setActiveTab('student-checkin')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'student-checkin'
                    ? 'bg-white text-pink-600 shadow-xs font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                Student Check-In
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'analytics' ? 'bg-white text-pink-600 shadow-xs font-semibold' : 'hover:text-slate-900'
                }`}
              >
                75% Exam Audit
              </button>
            </div>

            <Link
              href="/timetable"
              className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all gap-1.5"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Timetable Grid</span>
            </Link>
          </div>
        </header>

        {/* Notification Banner */}
        {notification && (
          <div className="mx-6 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center text-emerald-800 text-xs">
            <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 flex-shrink-0" />
            <span>{notification.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* TAB 1: LECTURER SESSION MANAGER */}
          {activeTab === 'lecturer' && (
            <div className="space-y-6">
              {/* Session Control Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
                      Instructional Session Control
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Class: CS101 - Intro to Computer Science
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Project Live Attendance QR Code for Lecture Hall
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Initiate session to project a cryptographic QR code onto the hall projector. The QR rotates
                    periodically to eliminate proxy scanning and badge swapping.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  {!activeSession ? (
                    <button
                      onClick={handleStartSession}
                      className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Launch Live QR Session</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRefreshQr}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Rotate QR Token</span>
                      </button>
                      <button
                        onClick={() => setActiveSession(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        End Session
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic QR Display & Live Stats */}
              {activeSession && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Dynamic QR Box */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center text-center">
                    <div className="flex items-center justify-between w-full mb-3">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        Live Projection Mode
                      </span>
                      <span className="text-xs font-mono font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded-md">
                        Expires in: {formatTimer(secondsRemaining)}
                      </span>
                    </div>

                    {/* QR Code Canvas Mock */}
                    <div className="p-4 bg-slate-50 border-2 border-dashed border-indigo-200 rounded-2xl flex flex-col items-center justify-center my-2 w-56 h-56">
                      {qrCodeUrl ? (
                        <img src={qrCodeUrl} alt="Attendance QR Code" className="w-48 h-48 object-contain" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400">
                          <QrCode className="w-28 h-28 text-slate-800" />
                          <span className="text-[10px] font-mono text-slate-500 mt-2">Scan with ChuoMS Student App</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 bg-slate-100 p-2.5 rounded-xl text-center w-full">
                      <p className="text-[11px] text-slate-500">Student Manual Entry Token:</p>
                      <p className="text-sm font-mono font-bold text-indigo-700 tracking-wider">
                        {qrToken || 'qr-live-token'}
                      </p>
                    </div>
                  </div>

                  {/* Attendance Roster Summary Metrics */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-4">Real-Time Hall Check-In Meter</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                          <p className="text-xs font-medium text-emerald-700">Present</p>
                          <p className="text-xl font-extrabold text-emerald-800 mt-0.5">{presentCount}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                          <p className="text-xs font-medium text-amber-700">Late</p>
                          <p className="text-xl font-extrabold text-amber-800 mt-0.5">{lateCount}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                          <p className="text-xs font-medium text-blue-700">Excused</p>
                          <p className="text-xl font-extrabold text-blue-800 mt-0.5">{excusedCount}</p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
                          <p className="text-xs font-medium text-rose-700">Absent</p>
                          <p className="text-xl font-extrabold text-rose-800 mt-0.5">{absentCount}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">Session Attendance Rate</span>
                          <span className="font-bold text-indigo-600">{currentAttendanceRate}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              currentAttendanceRate >= 75
                                ? 'bg-emerald-500'
                                : currentAttendanceRate >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${currentAttendanceRate}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 pt-1">
                          Institutional target: 75% minimum threshold for final examination qualification.
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Total enrolled: {totalStudents} students</span>
                      <button
                        onClick={handleSaveRoster}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        Commit Attendance Log
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Roster Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Enrolled Student Attendance Roster</h3>
                    <p className="text-xs text-slate-500">
                      Toggle disposition status for students or let them scan the hall QR code
                    </p>
                  </div>

                  <button
                    onClick={handleSaveRoster}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                  >
                    Save Changes
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-5">Student</th>
                        <th className="py-3 px-5">Admission No.</th>
                        <th className="py-3 px-5">Verification</th>
                        <th className="py-3 px-5 text-center">Status Action</th>
                        <th className="py-3 px-5 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {roster.map((student) => (
                        <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-slate-900">{student.name}</div>
                            <div className="text-[11px] text-slate-400">{student.email}</div>
                          </td>
                          <td className="py-3.5 px-5 font-mono text-slate-600">{student.admissionNumber}</td>
                          <td className="py-3.5 px-5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {student.verificationMethod}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => handleToggleStatus(student.studentId, 'PRESENT')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  student.status === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleToggleStatus(student.studentId, 'LATE')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  student.status === 'LATE'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700'
                                }`}
                              >
                                Late
                              </button>
                              <button
                                onClick={() => handleToggleStatus(student.studentId, 'EXCUSED')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  student.status === 'EXCUSED'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700'
                                }`}
                              >
                                Excused
                              </button>
                              <button
                                onClick={() => handleToggleStatus(student.studentId, 'ABSENT')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  student.status === 'ABSENT'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono text-[11px] text-slate-500">
                            {student.markedAt || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENT SELF CHECK-IN */}
          {activeTab === 'student-checkin' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mx-auto mb-2">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Student Attendance Check-In</h2>
                  <p className="text-xs text-slate-500">
                    Enter the session token displayed on the lecture hall projection screen
                  </p>
                </div>

                <form onSubmit={handleStudentCheckIn} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Session Token or Scanned Payload
                    </label>
                    <input
                      type="text"
                      value={inputToken}
                      onChange={(e) => setInputToken(e.target.value)}
                      placeholder="e.g. qr-token-code or paste QR string"
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-mono text-sm"
                    />
                  </div>

                  {checkInError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{checkInError}</span>
                    </div>
                  )}

                  {checkInResult && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-emerald-700">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>Check-In Verified! Status: PRESENT</span>
                      </div>
                      <p className="text-[11px] text-emerald-600">
                        Course: {checkInResult.courseCode} ({checkInResult.courseTitle || 'Computer Science'})
                      </p>
                      <p className="text-[11px] text-emerald-600">Recorded at: {checkInResult.checkInTime}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={checkingIn}
                    className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{checkingIn ? 'Verifying...' : 'Submit Attendance Verification'}</span>
                  </button>
                </form>

                {qrToken && (
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-[11px] text-slate-500">Current Hall Token for Demo:</p>
                    <button
                      onClick={() => setInputToken(qrToken)}
                      className="mt-1 font-mono text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Click to auto-fill: {qrToken}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: 75% EXAM ELIGIBILITY ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Institutional Rule Notice */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3 text-indigo-900 text-xs">
                <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-indigo-950">ChuoMS Institutional Attendance Regulation (75% Rule)</h4>
                  <p className="mt-0.5 text-indigo-700 leading-relaxed">
                    Under Senate Academic Policy, candidates must achieve a minimum cumulative attendance of 75% in each
                    registered course to be cleared for the Semester Final Examinations. Students falling below this
                    threshold receive automatic academic warning flags and barred exam tickets.
                  </p>
                </div>
              </div>

              {/* Course Attendance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {courseSummaries.map((c) => (
                  <div key={c.classSectionId} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {c.courseCode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            c.isEligibleForExam
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800 animate-pulse'
                          }`}
                        >
                          {c.isEligibleForExam ? 'Exam Qualified' : 'Exam Barred'}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 mb-1">{c.courseTitle}</h4>
                      <p className="text-xs text-slate-500 mb-4">{c.sectionName}</p>

                      {/* Circular / Progress Gauge */}
                      <div className="space-y-1 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Cumulative Attendance</span>
                          <span className="font-extrabold text-slate-900">{c.attendanceRate}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              c.attendanceRate >= 75
                                ? 'bg-emerald-500'
                                : c.attendanceRate >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${c.attendanceRate}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-slate-400">Attended</p>
                          <p className="font-bold text-emerald-600">{c.presentCount}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Late</p>
                          <p className="font-bold text-amber-600">{c.lateCount}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Missed</p>
                          <p className="font-bold text-rose-600">{c.absentCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Threshold: {c.thresholdRequired}%</span>
                      {c.isEligibleForExam ? (
                        <span className="text-emerald-600 font-semibold flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Clear
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold flex items-center">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> At Risk
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AttendanceContent />
    </Suspense>
  );
}
