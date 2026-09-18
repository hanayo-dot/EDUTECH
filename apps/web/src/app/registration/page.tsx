'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Search,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  Trash2,
  RefreshCw,
  Plus,
  Check,
  X,
  User,
  Info,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';

interface AvailableSection {
  id: string;
  sectionName: string;
  capacity: number;
  enrolledCount: number;
  seatsAvailable: number;
  isFull: boolean;
  lockVersion: number;
  course: {
    id: string;
    code: string;
    title: string;
    creditHours: number;
    department: string;
    prerequisites: Array<{
      id: string;
      code: string;
      title: string;
      minGrade: string;
    }>;
  };
  campus: {
    id: string;
    name: string;
  };
  lecturer: string;
  schedule: Array<{
    id: string;
    dayOfWeek: number;
    dayName: string;
    startTime: string;
    endTime: string;
    sessionType: string;
    room: string;
  }>;
}

interface EnrolledCourse {
  id: string;
  status: string;
  registeredAt: string;
  classSectionId: string;
  sectionName: string;
  course: {
    id: string;
    code: string;
    title: string;
    creditHours: number;
  };
  lecturer: string;
  schedule: Array<{
    dayOfWeek: number;
    dayName: string;
    startTime: string;
    endTime: string;
    room: string;
  }>;
}

interface RegistrationWindow {
  semesterId: string;
  semesterCode: string;
  semesterName: string;
  academicYear: string;
  registrationStart: string;
  registrationEnd: string;
  isOpen: boolean;
  isClosed: boolean;
  daysRemaining: number;
  message: string;
}

function CourseRegistrationContent() {
  const searchParams = useSearchParams();

  // Active Semester ID (default to the current active seeded semester)
  const [semesterId, setSemesterId] = useState<string>(
    searchParams.get('semester') || 'e688a6b3-ef54-4758-be45-eac159a6209f',
  );

  // Demo Student Selector
  const demoStudents = [
    {
      id: 'student-alice', // Will be resolved dynamically
      email: 'alice.johnson@student.chuoms.edu',
      name: 'Alice Johnson',
      admissionNumber: 'ADM-2026-0001',
      program: 'B.Sc. in Computer Science',
      level: 100,
    },
    {
      id: 'student-bob',
      email: 'bob.miller@student.chuoms.edu',
      name: 'Bob Miller',
      admissionNumber: 'ADM-2026-0002',
      program: 'B.Sc. in Computer Science',
      level: 100,
    },
  ];

  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string>(
    demoStudents[0].email,
  );
  const [currentStudentId, setCurrentStudentId] = useState<string>('');

  // Data State
  const [windowStatus, setWindowStatus] = useState<RegistrationWindow | null>(null);
  const [sections, setSections] = useState<AvailableSection[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [activeHolds, setActiveHolds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Staging Cart (selected section IDs for registration)
  const [stagedSectionIds, setStagedSectionIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Load Data on semester / student change
  useEffect(() => {
    fetchRegistrationData();
  }, [semesterId, selectedStudentEmail]);

  const fetchRegistrationData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Window Status
      try {
        const winRes = await apiClient<RegistrationWindow>(
          `/registration/window/${semesterId}`,
        );
        setWindowStatus(winRes.data);
      } catch (wErr) {
        setWindowStatus({
          semesterId,
          semesterCode: '2026-SEM1',
          semesterName: 'Semester 1 (2026/2027)',
          academicYear: '2026/2027',
          registrationStart: '2026-08-15T00:00:00.000Z',
          registrationEnd: '2026-09-30T23:59:59.000Z',
          isOpen: true,
          isClosed: false,
          daysRemaining: 13,
          message: 'Registration window is currently open.',
        });
      }

      // 2. Fetch Available Sections
      const secRes = await apiClient<AvailableSection[]>(
        `/registration/sections?semesterId=${semesterId}`,
      );
      setSections(secRes.data || []);

      // 3. Resolve student profile & enrolled courses
      try {
        // Try getting student enrollments from API
        const enrollRes = await apiClient<any>(
          `/registration/my-enrollments?semesterId=${semesterId}`,
        );
        setEnrolledCourses(enrollRes.data.enrollments || []);
        if (enrollRes.data.student?.id) {
          setCurrentStudentId(enrollRes.data.student.id);
          // Fetch student holds
          const holdsRes = await apiClient<any>(
            `/registration/holds/${enrollRes.data.student.id}`,
          );
          setActiveHolds((holdsRes.data.holds || []).filter((h: any) => h.isActive));
        }
      } catch (e) {
        // If not logged in as student or testing
        setEnrolledCourses([]);
      }
    } catch (err: any) {
      console.error('Registration data load failed:', err);
      setError(err.message || 'Could not load registration data.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Section in Staging Cart
  const toggleSection = (sectionId: string) => {
    setActionSuccess(null);
    setError(null);
    if (stagedSectionIds.includes(sectionId)) {
      setStagedSectionIds(stagedSectionIds.filter((id) => id !== sectionId));
    } else {
      // Check for duplicate course selection
      const targetSec = sections.find((s) => s.id === sectionId);
      if (!targetSec) return;

      const alreadyStagedSameCourse = sections
        .filter((s) => stagedSectionIds.includes(s.id))
        .some((s) => s.course.id === targetSec.course.id);

      if (alreadyStagedSameCourse) {
        setError(
          `You have already selected a section for ${targetSec.course.code}. You can only enroll in one section per course.`,
        );
        return;
      }

      // Check if already enrolled in this course
      const alreadyEnrolledInCourse = enrolledCourses.some(
        (e) => e.course.id === targetSec.course.id,
      );
      if (alreadyEnrolledInCourse) {
        setError(`You are already enrolled in course ${targetSec.course.code}.`);
        return;
      }

      setStagedSectionIds([...stagedSectionIds, sectionId]);
    }
  };

  // Calculate Credit Hours
  const enrolledCredits = enrolledCourses.reduce(
    (sum, e) => sum + e.course.creditHours,
    0,
  );
  const stagedCredits = sections
    .filter((s) => stagedSectionIds.includes(s.id))
    .reduce((sum, s) => sum + s.course.creditHours, 0);
  const totalProjectedCredits = enrolledCredits + stagedCredits;

  // Submit Course Registration
  const handleRegister = async () => {
    if (stagedSectionIds.length === 0) return;
    setSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await apiClient<any>('/registration/enroll', {
        method: 'POST',
        body: JSON.stringify({
          semesterId,
          classSectionIds: stagedSectionIds,
        }),
      });

      setActionSuccess(
        `Registration Confirmed! Enrolled in ${res.data.registeredSections.length} course(s). Total Semester Credits: ${res.data.totalCreditsEnrolled}.`,
      );
      setStagedSectionIds([]);
      fetchRegistrationData();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Drop an Enrolled Course
  const handleDrop = async (classSectionId: string, courseCode: string) => {
    if (
      !confirm(
        `Are you sure you want to drop course ${courseCode}? Your reserved seat in this section will be released.`,
      )
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      await apiClient('/registration/drop', {
        method: 'POST',
        body: JSON.stringify({
          classSectionId,
          reason: 'Student self-drop via portal',
        }),
      });

      setActionSuccess(`Successfully dropped ${courseCode}. Class seat capacity has been restored.`);
      fetchRegistrationData();
    } catch (err: any) {
      setError(err.message || 'Failed to drop course.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Demo Action: Place or Clear Financial Hold for Testing
  const toggleDemoHold = async () => {
    if (!currentStudentId) return;
    try {
      if (activeHolds.length > 0) {
        // Clear hold
        await apiClient(`/registration/holds/${activeHolds[0].id}/release`, {
          method: 'PATCH',
          body: JSON.stringify({ reason: 'Demo test hold cleared' }),
        });
        setActionSuccess('Financial Hold released! Registration is now unblocked.');
      } else {
        // Place hold
        await apiClient('/registration/holds', {
          method: 'POST',
          body: JSON.stringify({
            studentId: currentStudentId,
            reason: 'Outstanding semester tuition balance of $1,500',
            thresholdAmount: 1500,
          }),
        });
        setActionSuccess('Test Financial Hold placed on student profile.');
      }
      fetchRegistrationData();
    } catch (err: any) {
      setError(err.message || 'Hold toggle failed');
    }
  };

  const filteredSections = sections.filter((s) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      s.course.code.toLowerCase().includes(q) ||
      s.course.title.toLowerCase().includes(q) ||
      s.sectionName.toLowerCase().includes(q) ||
      s.lecturer.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-row">
      <Sidebar currentTab="registration" />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Course Registration & Enrollment Engine"
          breadcrumb="ChuoMS  /  Academics  /  Course Registration"
        />

        <main className="p-4 sm:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
          {/* Top Registration Window Status Banner */}
          {windowStatus && (
            <div
              className={`rounded-2xl p-5 border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition shadow-sm ${
                windowStatus.isOpen
                  ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white border-emerald-200'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    windowStatus.isOpen
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        windowStatus.isOpen
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-200 text-rose-800'
                      }`}
                    >
                      {windowStatus.isOpen ? 'Active Registration Window' : 'Window Closed'}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {windowStatus.semesterName} ({windowStatus.semesterCode})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {windowStatus.message}{' '}
                    {windowStatus.isOpen && (
                      <span className="font-semibold text-emerald-800">
                        Deadline: {new Date(windowStatus.registrationEnd).toLocaleDateString()} (
                        {windowStatus.daysRemaining} days left)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Student Context & Demo Selector */}
              <div className="flex items-center space-x-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-xs self-stretch md:self-auto justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="font-bold text-slate-800">
                      {demoStudents.find((s) => s.email === selectedStudentEmail)?.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {demoStudents.find((s) => s.email === selectedStudentEmail)?.admissionNumber}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pl-2 border-l border-slate-100">
                  <select
                    value={selectedStudentEmail}
                    onChange={(e) => setSelectedStudentEmail(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none"
                  >
                    {demoStudents.map((ds) => (
                      <option key={ds.email} value={ds.email}>
                        Switch: {ds.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Active Hold Alert Banner */}
          {activeHolds.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 text-rose-950 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm text-rose-900">
                    Registration Blocked: Active Institutional Hold Enforced
                  </h3>
                  <p className="text-xs text-rose-800 mt-0.5">
                    <strong>Hold Reason:</strong> {activeHolds.map((h) => h.reason).join('; ')}
                  </p>
                  <p className="text-[11px] text-rose-700 mt-1">
                    Course registration is strictly halted until financial/academic clearances are settled with the Registrar or Bursar&apos;s desk.
                  </p>
                </div>
              </div>

              <button
                onClick={toggleDemoHold}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex-shrink-0"
              >
                Resolve & Clear Hold (Demo)
              </button>
            </div>
          )}

          {/* Success / Error Feedback */}
          {actionSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Credit Limit Progress & Staged Cart Summary */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Credit Progress Meter */}
            <div className="w-full lg:w-1/2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider">
                  Semester Credit Hours Meter
                </span>
                <span className="font-mono font-bold text-slate-900">
                  <span
                    className={
                      totalProjectedCredits > 21
                        ? 'text-rose-600'
                        : totalProjectedCredits >= 18
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }
                  >
                    {totalProjectedCredits}
                  </span>{' '}
                  / 21 Max Credits{' '}
                  <span className="text-slate-400 font-normal">
                    ({enrolledCredits} enrolled + {stagedCredits} staged)
                  </span>
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (enrolledCredits / 21) * 100)}%`,
                  }}
                  title="Enrolled Credits"
                />
                <div
                  className={`h-full transition-all duration-300 ${
                    totalProjectedCredits > 21 ? 'bg-rose-500' : 'bg-royal-600'
                  }`}
                  style={{
                    width: `${Math.min(
                      100 - (enrolledCredits / 21) * 100,
                      (stagedCredits / 21) * 100,
                    )}%`,
                  }}
                  title="Staged Credits"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Min: 3 Credits</span>
                <span>Standard Load: 15–18 Credits</span>
                <span>Max Cap: 21 Credits</span>
              </div>
            </div>

            {/* Staged Cart Action */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
              {currentStudentId && (
                <button
                  onClick={toggleDemoHold}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition"
                  title="Toggle financial hold for testing"
                >
                  {activeHolds.length > 0 ? 'Clear Hold' : 'Place Test Hold'}
                </button>
              )}

              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">
                  {stagedSectionIds.length} Section(s) Staged
                </div>
                <div className="text-[11px] text-slate-400">
                  {stagedCredits} credit hours ready
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={
                  submitting ||
                  stagedSectionIds.length === 0 ||
                  activeHolds.length > 0 ||
                  totalProjectedCredits > 21
                }
                className={`px-6 py-3 rounded-xl font-bold text-xs shadow-xs transition flex items-center space-x-2 ${
                  stagedSectionIds.length === 0 ||
                  activeHolds.length > 0 ||
                  totalProjectedCredits > 21
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-royal-600 hover:bg-royal-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'Locking Seats & Enrolling...'
                    : `Confirm Registration (${stagedSectionIds.length})`}
                </span>
              </button>
            </div>
          </div>

          {/* Currently Enrolled Courses Table */}
          {enrolledCourses.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Currently Registered Courses ({enrolledCourses.length}) &bull; {enrolledCredits}{' '}
                    Credit Hours
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Official Enrolled Roster
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-4">Course Code</th>
                      <th className="py-2.5 px-4">Title & Section</th>
                      <th className="py-2.5 px-4">Credits</th>
                      <th className="py-2.5 px-4">Lecturer</th>
                      <th className="py-2.5 px-4">Weekly Schedule</th>
                      <th className="py-2.5 px-4 text-right">Drop Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {enrolledCourses.map((enc) => (
                      <tr key={enc.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {enc.course.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{enc.course.title}</div>
                          <div className="text-[11px] text-slate-400">{enc.sectionName}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {enc.course.creditHours} CH
                        </td>
                        <td className="py-3 px-4">{enc.lecturer}</td>
                        <td className="py-3 px-4">
                          {enc.schedule.map((sch, i) => (
                            <div key={i} className="text-[11px] text-slate-600">
                              <span className="font-semibold">{sch.dayName}</span> {sch.startTime}–
                              {sch.endTime} ({sch.room})
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDrop(enc.classSectionId, enc.course.code)}
                            disabled={submitting}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-[11px] transition inline-flex items-center space-x-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Drop</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Available Courses & Class Sections Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Available Course Sections Catalogue
                </h3>
                <p className="text-xs text-slate-500">
                  Select your desired class section. Real-time seats are protected with pessimistic row locks to prevent overbooking.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code, title, section..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/30 focus:border-royal-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-400 mb-2" />
                Loading available class sections...
              </div>
            ) : filteredSections.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No class sections available for this semester.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSections.map((sec) => {
                  const isStaged = stagedSectionIds.includes(sec.id);
                  const isAlreadyEnrolled = enrolledCourses.some(
                    (e) => e.classSectionId === sec.id,
                  );
                  const capacityPercent = Math.min(
                    100,
                    Math.round((sec.enrolledCount / sec.capacity) * 100),
                  );

                  return (
                    <div
                      key={sec.id}
                      className={`bg-white rounded-2xl border-2 p-5 flex flex-col justify-between transition-all shadow-sm ${
                        isAlreadyEnrolled
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : isStaged
                          ? 'border-royal-600 ring-2 ring-royal-500/20 bg-royal-50/20'
                          : sec.isFull
                          ? 'border-slate-200 opacity-60'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Card Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800">
                              {sec.course.code}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-1.5">
                              {sec.course.title}
                            </h4>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {sec.sectionName}
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {sec.course.creditHours} CH
                          </span>
                        </div>

                        {/* Prerequisites Tag */}
                        {sec.course.prerequisites && sec.course.prerequisites.length > 0 && (
                          <div className="text-[10px] bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg flex items-center space-x-1 font-medium">
                            <Info className="w-3 h-3 text-amber-600 flex-shrink-0" />
                            <span>
                              Prereq: {sec.course.prerequisites.map((p) => p.code).join(', ')} (Grade: {sec.course.prerequisites[0].minGrade})
                            </span>
                          </div>
                        )}

                        {/* Timetable Schedule */}
                        <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">
                            Class Schedule
                          </div>
                          {sec.schedule.length > 0 ? (
                            sec.schedule.map((sch) => (
                              <div key={sch.id} className="text-[11px] text-slate-700 font-medium">
                                <span className="font-bold text-slate-900">{sch.dayName}</span>{' '}
                                {sch.startTime} – {sch.endTime}
                                <div className="text-[10px] text-slate-400">{sch.room}</div>
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">
                              Schedule TBA
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                            Instructor: <span className="font-semibold text-slate-700">{sec.lecturer}</span>
                          </div>
                        </div>

                        {/* Live Seat Capacity Meter */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-600">Capacity:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {sec.enrolledCount} / {sec.capacity} seats{' '}
                              <span
                                className={
                                  sec.seatsAvailable <= 5 ? 'text-rose-600' : 'text-emerald-600'
                                }
                              >
                                ({sec.seatsAvailable} left)
                              </span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                capacityPercent >= 100
                                  ? 'bg-rose-500'
                                  : capacityPercent >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${capacityPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Button */}
                      <div className="pt-4 mt-2 border-t border-slate-100">
                        {isAlreadyEnrolled ? (
                          <div className="w-full py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1">
                            <Check className="w-4 h-4" />
                            <span>Enrolled in this Course</span>
                          </div>
                        ) : sec.isFull ? (
                          <div className="w-full py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold text-center">
                            Section Full (Waitlist Only)
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleSection(sec.id)}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-sm ${
                              isStaged
                                ? 'bg-royal-600 text-white hover:bg-royal-700'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {isStaged ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Section Selected</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span>Select Section</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function CourseRegistrationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
          Loading course registration portal...
        </div>
      }
    >
      <CourseRegistrationContent />
    </React.Suspense>
  );
}
