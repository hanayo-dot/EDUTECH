'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
      setAuditReport(null); // Reset audit when switching versions
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-none">Institutional Structure & Curriculum Builder</h1>
              <p className="text-xs text-slate-400 mt-1">Multi-Campus Hierarchy, Prerequisite DAG & Degree Audit</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition"
            >
              Sign In / Switch Role
            </Link>
            <button
              onClick={() => fetchTabData(activeTab)}
              disabled={loading}
              className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-50 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 border-t border-slate-800/80 pt-2 pb-2">
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition ${
              activeTab === 'hierarchy'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Multi-Campus Hierarchy</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition ${
              activeTab === 'calendar'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Academic Terms & Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition ${
              activeTab === 'courses'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Course Catalogue & Prerequisite Graph</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition ${
              activeTab === 'audit'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Curriculum Builder & Degree Audit</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-sm flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
            <div>
              <p className="font-semibold">Request Notice</p>
              <p className="text-xs text-red-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
            <p className="text-sm">Loading institutional data from backend...</p>
          </div>
        )}

        {!loading && activeTab === 'hierarchy' && hierarchy && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{hierarchy.name}</h2>
                  <p className="text-xs text-slate-400">
                    Code: {hierarchy.code} &bull; Domain: {hierarchy.domain} &bull; Timezone: {hierarchy.timezone}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hierarchy.campuses?.map((campus: any) => (
                <div key={campus.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20">
                        {campus.code}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2">{campus.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {campus.address}, {campus.city}, {campus.country}
                      </p>
                    </div>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Active
                    </span>
                  </div>

                  <div className="mt-5 border-t border-slate-800 pt-4">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Faculties ({campus.faculties?.length || 0})
                    </h4>
                    <div className="space-y-3">
                      {campus.faculties?.map((fac: any) => (
                        <div key={fac.id} className="bg-slate-800/40 rounded-lg p-3 border border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-white">
                              {fac.name} ({fac.code})
                            </span>
                            <span className="text-xs text-slate-400">
                              {fac.departments?.length || 0} Departments
                            </span>
                          </div>

                          <div className="mt-2 pl-3 border-l-2 border-slate-700 space-y-2">
                            {fac.departments?.map((dept: any) => (
                              <div key={dept.id} className="text-xs">
                                <span className="font-medium text-slate-300">
                                  {dept.name} ({dept.code})
                                </span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {dept.programs?.map((prog: any) => (
                                    <span
                                      key={prog.id}
                                      className="px-2 py-0.5 rounded bg-slate-900 text-sky-300 border border-slate-700 font-mono text-[11px]"
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

        {!loading && activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white flex items-center">
                <Calendar className="w-5 h-5 text-sky-400 mr-2" />
                Academic Years ({academicYears.length})
              </h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {academicYears.map((yr) => (
                  <div
                    key={yr.id}
                    className={`p-4 rounded-xl border ${
                      yr.isCurrent
                        ? 'bg-sky-950/30 border-sky-500/50'
                        : 'bg-slate-800/40 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-white">{yr.name}</span>
                      {yr.isCurrent && (
                        <span className="text-[11px] font-bold text-sky-400 bg-sky-500/20 px-2 py-0.5 rounded border border-sky-500/30">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(yr.startDate).toLocaleDateString()} &mdash;{' '}
                      {new Date(yr.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{yr.semesters?.length || 0} Semesters</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white flex items-center">
                <Calendar className="w-5 h-5 text-emerald-400 mr-2" />
                Semesters & Registration Windows ({semesters.length})
              </h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase font-medium">
                    <tr>
                      <th className="py-3 px-4 rounded-l-lg">Code / Name</th>
                      <th className="py-3 px-4">Term Duration</th>
                      <th className="py-3 px-4">Registration Window</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 rounded-r-lg text-right">Sections</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {semesters.map((sem) => (
                      <tr key={sem.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{sem.name}</div>
                          <div className="text-xs font-mono text-sky-400">{sem.code}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-300">
                          {new Date(sem.startDate).toLocaleDateString()} &mdash;{' '}
                          {new Date(sem.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-300">
                          {new Date(sem.registrationStart).toLocaleDateString()} &mdash;{' '}
                          {new Date(sem.registrationEnd).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {sem.isClosed ? (
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              Closed
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              Active / Open
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-400">
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

        {!loading && activeTab === 'courses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
                <Search className="w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by course code, title, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:outline-none w-full placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[700px] overflow-y-auto pr-1">
                {filteredCourses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => loadCourseGraph(c.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedCourse?.id === c.id
                        ? 'bg-sky-950/40 border-sky-500'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                        {c.code}
                      </span>
                      <span className="text-xs text-slate-400">Level {c.level}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mt-2 leading-snug">{c.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{c.department?.name}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                      <span>{c.creditHours} Credits &bull; {c.contactHours} Hrs</span>
                      <span className="text-sky-400 flex items-center">
                        Graph <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Details & Prerequisite Graph Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:col-span-1 h-fit">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
                <GitBranch className="w-4 h-4 text-sky-400 mr-2" />
                Prerequisite Dependency Graph
              </h3>

              {graphLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-500 mb-2" />
                  Calculating DAG topology...
                </div>
              )}

              {!graphLoading && selectedCourse && courseGraph && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <span className="text-xs font-mono font-bold text-sky-400">{selectedCourse.code}</span>
                    <h4 className="text-sm font-bold text-white mt-1">{selectedCourse.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedCourse.department?.faculty?.campus?.name} &bull; {selectedCourse.department?.name}
                    </p>
                    <div className="mt-2 text-xs text-slate-300">
                      Credits: {selectedCourse.creditHours} | Contact: {selectedCourse.contactHours}h | Level: {selectedCourse.level}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Multi-Tier Prerequisites ({courseGraph.totalPrerequisites})
                    </h5>

                    {courseGraph.edges?.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-800 text-center text-xs text-slate-500">
                        No prerequisite rules configured for this course. Directly open for enrollment.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {courseGraph.edges.map((edge: any, idx: number) => {
                          const toNode = courseGraph.nodes.find((n: any) => n.id === edge.to);
                          const fromNode = courseGraph.nodes.find((n: any) => n.id === edge.from);
                          return (
                            <div key={idx} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 text-xs flex items-center justify-between">
                              <div>
                                <span className="font-mono font-bold text-white">{fromNode?.code}</span>
                                <span className="text-slate-500 mx-1.5">&rarr; requires &rarr;</span>
                                <span className="font-mono font-bold text-sky-400">{toNode?.code}</span>
                              </div>
                              <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-amber-300 border border-amber-500/30">
                                Min Grade: {edge.minGrade}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-800/40 text-xs text-sky-300 flex items-start space-x-2">
                    <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                    <span>
                      The backend graph engine uses Breadth-First Search (BFS) to prevent cyclic prerequisites and ensure strict acyclic DAG topology.
                    </span>
                  </div>
                </div>
              )}

              {!graphLoading && !selectedCourse && (
                <div className="py-16 text-center text-slate-500 text-xs">
                  Select any course on the left to inspect its multi-tier prerequisite graph and constraints.
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && activeTab === 'audit' && (
          <div className="space-y-6">
            {/* Program & Version Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Academic Program
                  </label>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => {
                      setSelectedProgramId(e.target.value);
                      loadProgramVersions(e.target.value);
                    }}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name} ({p.degreeLevel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Curriculum Version
                  </label>
                  <select
                    value={selectedVersionId}
                    onChange={(e) => {
                      setSelectedVersionId(e.target.value);
                      loadVersionDetails(e.target.value);
                    }}
                    disabled={versions.length === 0}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
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
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold text-white shadow-lg transition text-sm disabled:opacity-50"
              >
                {auditLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Auditing Curriculum...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Run Degree Audit
                  </>
                )}
              </button>
            </div>

            {/* Audit Results Banner */}
            {auditReport && (
              <div
                className={`p-5 rounded-2xl border ${
                  auditReport.isValid
                    ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
                    : 'bg-amber-950/30 border-amber-800/80 text-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {auditReport.isValid ? (
                      <CheckCircle className="w-7 h-7 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-7 h-7 text-amber-400" />
                    )}
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {auditReport.isValid
                          ? 'Degree Curriculum Verified & Fully Compliant'
                          : `Degree Audit Issues Detected (${auditReport.issuesCount})`}
                      </h3>
                      <p className="text-xs opacity-90 mt-0.5">
                        Program: {auditReport.programName} ({auditReport.degreeLevel}) &bull; Total Credits:{' '}
                        {auditReport.totalCredits} / {auditReport.requiredCredits} Required
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                      auditReport.isValid
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {auditReport.isValid ? 'VERIFIED PASSED' : 'ACTION REQUIRED'}
                  </span>
                </div>

                {auditReport.issues?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-amber-800/60 space-y-2">
                    {auditReport.issues.map((iss: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs flex items-start space-x-2.5">
                        <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {iss.type}
                        </span>
                        <p className="text-slate-200 mt-0.5">{iss.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Semester-by-Semester Curriculum Breakdown */}
            {versionDetail && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400">Total Courses</span>
                    <p className="text-2xl font-bold text-white mt-1">{versionDetail.summary.totalCourses}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400">Core Credits</span>
                    <p className="text-2xl font-bold text-sky-400 mt-1">{versionDetail.summary.totalCoreCredits}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400">Elective Credits</span>
                    <p className="text-2xl font-bold text-purple-400 mt-1">{versionDetail.summary.totalElectiveCredits}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400">Required Credits</span>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{versionDetail.summary.requiredCredits}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(versionDetail.terms || {}).map(([termKey, items]: [string, any]) => (
                    <div key={termKey} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                        <h4 className="font-bold text-white text-sm">{termKey}</h4>
                        <span className="text-xs text-slate-400 font-mono">
                          {items.reduce((sum: number, i: any) => sum + i.course.creditHours, 0)} Total Credits
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {items.map((item: any) => (
                          <div key={item.id} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/60 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-sky-400">{item.course.code}</span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                  item.isCore
                                    ? 'bg-sky-500/20 text-sky-300'
                                    : 'bg-purple-500/20 text-purple-300'
                                }`}
                              >
                                {item.isCore ? 'CORE' : 'ELECTIVE'}
                              </span>
                            </div>
                            <div className="font-semibold text-white mt-1.5 line-clamp-1">{item.course.title}</div>
                            <div className="text-slate-400 mt-1">
                              {item.course.creditHours} Credit Hrs &bull; Contact {item.course.contactHours}h
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
