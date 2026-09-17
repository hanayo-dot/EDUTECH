'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import {
  Building2,
  Calendar,
  BookOpen,
  GitBranch,
  ShieldCheck,
  Search,
  CheckCircle,
  AlertTriangle,
  Layers,
  GraduationCap,
  ChevronRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';

export default function CurriculumPage() {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'calendar' | 'courses' | 'audit'>('hierarchy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hierarchy Data
  const [hierarchy, setHierarchy] = useState<any>(null);

  // Academic Calendar Data
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  // Courses Data
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [courseGraph, setCourseGraph] = useState<any | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);

  // Curriculum & Audit Data
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [versionDetail, setVersionDetail] = useState<any | null>(null);
  const [auditReport, setAuditReport] = useState<any | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Fetch initial data based on active tab
  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const fetchTabData = async (tab: string) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'hierarchy') {
        const res = await apiClient<any>('/organization/hierarchy');
        setHierarchy(res.data);
      } else if (tab === 'calendar') {
        const [yearsRes, semRes] = await Promise.all([
          apiClient<any>('/academic-terms/years'),
          apiClient<any>('/academic-terms/semesters'),
        ]);
        setAcademicYears(yearsRes.data);
        setSemesters(semRes.data);
      } else if (tab === 'courses') {
        const res = await apiClient<any>('/curriculum/courses?limit=100');
        setCourses(res.data.data || []);
      } else if (tab === 'audit') {
        const progRes = await apiClient<any>('/organization/programs');
        setPrograms(progRes.data);
        if (progRes.data.length > 0 && !selectedProgramId) {
          const firstProg = progRes.data[0];
          setSelectedProgramId(firstProg.id);
          loadProgramVersions(firstProg.id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data. Please ensure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const loadProgramVersions = async (progId: string) => {
    try {
      const res = await apiClient<any>(`/curriculum/programs/${progId}/versions`);
      setVersions(res.data);
      if (res.data.length > 0) {
        const firstVer = res.data[0];
        setSelectedVersionId(firstVer.id);
        loadVersionDetails(firstVer.id);
      } else {
        setSelectedVersionId('');
        setVersionDetail(null);
        setAuditReport(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadVersionDetails = async (versionId: string) => {
    try {
      const res = await apiClient<any>(`/curriculum/versions/${versionId}`);
      setVersionDetail(res.data);
      setAuditReport(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadCourseGraph = async (courseId: string) => {
    setGraphLoading(true);
    try {
      const [detailRes, graphRes] = await Promise.all([
        apiClient<any>(`/curriculum/courses/${courseId}`),
        apiClient<any>(`/curriculum/courses/${courseId}/prerequisite-graph`),
      ]);
      setSelectedCourse(detailRes.data);
      setCourseGraph(graphRes.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGraphLoading(false);
    }
  };

  const runDegreeAudit = async () => {
    if (!selectedVersionId) return;
    setAuditLoading(true);
    try {
      const res = await apiClient<any>(`/curriculum/versions/${selectedVersionId}/audit`);
      setAuditReport(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.code.toLowerCase().includes(query) ||
      c.title.toLowerCase().includes(query) ||
      c.department?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-row">
      {/* Left Sidebar */}
      <Sidebar currentTab="curriculum" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <Header
            title="Curriculum & Structure"
            breadcrumb="Dashboard  /  Curriculum & Campuses"
          />

          {/* Navigation Pill Tabs */}
          <div className="px-4 sm:px-8 border-b border-slate-200/80 pb-3 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
                activeTab === 'hierarchy'
                  ? 'bg-[#f43f85] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Multi-Campus Hierarchy</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
                activeTab === 'calendar'
                  ? 'bg-[#f43f85] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Academic Terms & Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
                activeTab === 'courses'
                  ? 'bg-[#f43f85] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Course Catalogue & Prerequisite Graph</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
                activeTab === 'audit'
                  ? 'bg-[#f43f85] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Curriculum Builder & Degree Audit</span>
            </button>

            <button
              onClick={() => fetchTabData(activeTab)}
              disabled={loading}
              className="ml-auto p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <main className="px-4 sm:px-8 py-6 space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <p className="font-semibold">Notice</p>
                  <p className="text-slate-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-[#f43f85] mb-3" />
                <p className="text-xs">Loading institutional data...</p>
              </div>
            )}

            {/* TAB 1: HIERARCHY */}
            {!loading && activeTab === 'hierarchy' && hierarchy && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-pink-50 border border-pink-100 text-[#f43f85]">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">{hierarchy.name}</h2>
                      <p className="text-xs text-slate-400">
                        Code: {hierarchy.code} &bull; Timezone: {hierarchy.defaultTimezone || 'UTC'} &bull; Currency: {hierarchy.defaultCurrency || 'USD'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {hierarchy.campuses?.map((campus: any) => (
                    <div key={campus.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                            {campus.code}
                          </span>
                          <h3 className="text-base font-bold text-slate-800 mt-2">{campus.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {campus.address}, {campus.city}, {campus.country}
                          </p>
                        </div>
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                          Active
                        </span>
                      </div>

                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                          Faculties ({campus.faculties?.length || 0})
                        </h4>
                        <div className="space-y-3">
                          {campus.faculties?.map((fac: any) => (
                            <div key={fac.id} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">
                                  {fac.name} ({fac.code})
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {fac.departments?.length || 0} Departments
                                </span>
                              </div>

                              <div className="mt-2.5 pl-3 border-l-2 border-teal-300 space-y-2">
                                {fac.departments?.map((dept: any) => (
                                  <div key={dept.id} className="text-xs">
                                    <span className="font-semibold text-slate-700">
                                      {dept.name} ({dept.code})
                                    </span>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                      {dept.programs?.map((prog: any) => (
                                        <span
                                          key={prog.id}
                                          className="px-2 py-0.5 rounded-lg bg-white text-teal-700 border border-teal-200 font-mono text-[10px] font-semibold"
                                        >
                                          {prog.code} &bull; {prog.degreeLevel}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: CALENDAR */}
            {!loading && activeTab === 'calendar' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <h2 className="text-base font-bold text-slate-800 flex items-center">
                    <Calendar className="w-4 h-4 text-[#f43f85] mr-2" />
                    Academic Years ({academicYears.length})
                  </h2>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {academicYears.map((yr) => (
                      <div
                        key={yr.id}
                        className={`p-4 rounded-2xl border transition ${
                          yr.isCurrent
                            ? 'bg-pink-50/50 border-pink-200'
                            : 'bg-slate-50 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-800">{yr.name}</span>
                          {yr.isCurrent && (
                            <span className="text-[10px] font-bold text-[#f43f85] bg-pink-100 px-2 py-0.5 rounded-full">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(yr.startDate).toLocaleDateString()} &mdash;{' '}
                          {new Date(yr.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <h2 className="text-base font-bold text-slate-800 flex items-center">
                    <Calendar className="w-4 h-4 text-teal-600 mr-2" />
                    Semesters & Registration Windows ({semesters.length})
                  </h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4 rounded-l-xl">Term / Code</th>
                          <th className="py-3 px-4">Duration</th>
                          <th className="py-3 px-4">Registration Window</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 rounded-r-xl text-right">Sections</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {semesters.map((sem) => (
                          <tr key={sem.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              <div>{sem.name}</div>
                              <div className="text-[10px] font-mono text-teal-600">{sem.code}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {new Date(sem.startDate).toLocaleDateString()} &mdash; {new Date(sem.endDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {new Date(sem.registrationStart).toLocaleDateString()} &mdash; {new Date(sem.registrationEnd).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active / Open
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                              {sem._count?.classSections || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COURSES */}
            {!loading && activeTab === 'courses' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white border border-slate-100 rounded-2xl p-3.5 flex items-center space-x-3 shadow-sm">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-xs bg-transparent focus:outline-none w-full text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[650px] overflow-y-auto pr-1">
                    {filteredCourses.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => loadCourseGraph(c.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition ${
                          selectedCourse?.id === c.id
                            ? 'bg-pink-50/60 border-pink-300 shadow-sm'
                            : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#f43f85] px-2 py-0.5 rounded-lg bg-pink-100/70">
                            {c.code}
                          </span>
                          <span className="text-[11px] text-slate-400">Level {c.level}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mt-2">{c.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{c.department?.name}</p>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                          <span>{c.creditHours} Credits</span>
                          <span className="text-teal-600 font-semibold flex items-center">
                            Inspect DAG <ChevronRight className="w-3 h-3 ml-0.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Course Details & Prerequisite Graph Panel */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm lg:col-span-1 h-fit">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                    <GitBranch className="w-4 h-4 text-teal-600 mr-2" />
                    Prerequisite Dependency Graph
                  </h3>

                  {graphLoading && (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <Loader2 className="w-6 h-6 animate-spin text-[#f43f85] mb-2" />
                      Calculating DAG topology...
                    </div>
                  )}

                  {!graphLoading && selectedCourse && courseGraph && (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-xs font-mono font-bold text-[#f43f85]">{selectedCourse.code}</span>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">{selectedCourse.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{selectedCourse.department?.name}</p>
                        <div className="mt-2 text-[11px] text-slate-600 font-medium">
                          Credits: {selectedCourse.creditHours} | Level: {selectedCourse.level}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Prerequisites ({courseGraph.totalPrerequisites})
                        </h5>

                        {courseGraph.edges?.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
                            No prerequisite rules configured for this course.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {courseGraph.edges.map((edge: any, idx: number) => {
                              const toNode = courseGraph.nodes.find((n: any) => n.id === edge.to);
                              const fromNode = courseGraph.nodes.find((n: any) => n.id === edge.from);
                              return (
                                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                                  <div>
                                    <span className="font-mono font-bold text-slate-800">{fromNode?.code}</span>
                                    <span className="text-slate-400 mx-1.5">&rarr;</span>
                                    <span className="font-mono font-bold text-teal-600">{toNode?.code}</span>
                                  </div>
                                  <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-amber-700 border border-amber-200 font-semibold">
                                    Min Grade: {edge.minGrade}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!graphLoading && !selectedCourse && (
                    <div className="py-16 text-center text-slate-400 text-xs">
                      Select any course on the left to inspect its multi-tier prerequisite graph.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: AUDIT */}
            {!loading && activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Academic Program
                      </label>
                      <select
                        value={selectedProgramId}
                        onChange={(e) => {
                          setSelectedProgramId(e.target.value);
                          loadProgramVersions(e.target.value);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      >
                        {programs.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name} ({p.degreeLevel})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Curriculum Version
                      </label>
                      <select
                        value={selectedVersionId}
                        onChange={(e) => {
                          setSelectedVersionId(e.target.value);
                          loadVersionDetails(e.target.value);
                        }}
                        disabled={versions.length === 0}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50"
                      >
                        {versions.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.versionName} (Intake {v.academicYear})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={runDegreeAudit}
                    disabled={!selectedVersionId || auditLoading}
                    className="inline-flex items-center px-4 py-2.5 rounded-xl bg-[#f43f85] hover:bg-pink-600 font-bold text-white shadow-sm transition text-xs disabled:opacity-50"
                  >
                    {auditLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Auditing...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                        Run Degree Audit
                      </>
                    )}
                  </button>
                </div>

                {auditReport && (
                  <div
                    className={`p-5 rounded-3xl border ${
                      auditReport.isValid
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {auditReport.isValid ? (
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-amber-600" />
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">
                            {auditReport.isValid
                              ? 'Degree Curriculum Verified & Fully Compliant'
                              : `Degree Audit Issues Detected (${auditReport.issuesCount})`}
                          </h3>
                          <p className="text-xs opacity-90 mt-0.5">
                            Total Credits: {auditReport.totalCredits} / {auditReport.requiredCredits} Required
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-white shadow-xs">
                        {auditReport.isValid ? 'PASSED' : 'ACTION REQUIRED'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Footer */}
        <footer className="px-8 py-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div>Copyright &copy; 2026 Patentrixx &bull; ChuoMS Enterprise</div>
          <div className="flex items-center space-x-4 text-[11px]">
            <Link href="/" className="hover:text-slate-600 transition">Attendance</Link>
            <Link href="/login" className="hover:text-slate-600 transition">Login</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
