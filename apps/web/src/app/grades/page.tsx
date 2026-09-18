'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  Plus,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  FileText,
  AlertTriangle,
  GraduationCap,
  TrendingUp,
  Download,
  Check,
  Send,
  UserCheck,
  HelpCircle,
  Eye,
} from 'lucide-react';

interface AssessmentItem {
  id: string;
  name: string;
  type: string;
  maxMarks: number;
  weightPercentage: number;
}

interface RosterStudent {
  enrollmentId: string;
  studentId: string;
  admissionNumber: string;
  studentName: string;
  programCode: string;
  assessmentScores: Record<string, number>;
  continuousAssessmentMarks: number;
  examMarks: number;
  totalMarks: number;
  letterGrade: string;
  gradePoint: number;
  workflowStatus: string;
  remarks?: string | null;
  appealStatus?: string | null;
}

interface SectionGradebook {
  sectionId: string;
  sectionName: string;
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  semesterCode: string;
  lecturerName: string;
  workflowStatus: string;
  assessments: AssessmentItem[];
  statistics: {
    totalEnrolled: number;
    gradedCount: number;
    meanMarks: number;
    passRate: number;
  };
  roster: RosterStudent[];
}

function GradesContent() {
  const [activeTab, setActiveTab] = useState<'gradebook' | 'moderation' | 'publishing' | 'student'>('gradebook');
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Gradebook State
  const [gradebook, setGradebook] = useState<SectionGradebook>({
    sectionId: 'sec-cs101-demo',
    sectionName: 'Section A - Morning',
    courseCode: 'CS101',
    courseTitle: 'Introduction to Computer Science & Programming',
    creditHours: 3,
    semesterCode: '2026-SEM1',
    lecturerName: 'Dr. Alan Smith',
    workflowStatus: 'DRAFT',
    assessments: [
      { id: 'cat-1', name: 'CAT 1 (Algorithms & Flow)', type: 'CAT', maxMarks: 30, weightPercentage: 30 },
      { id: 'exam-1', name: 'Final Semester Exam', type: 'FINAL_EXAM', maxMarks: 70, weightPercentage: 70 },
    ],
    statistics: {
      totalEnrolled: 3,
      gradedCount: 3,
      meanMarks: 81.33,
      passRate: 100,
    },
    roster: [
      {
        enrollmentId: 'enr-1',
        studentId: 'std-alice',
        admissionNumber: 'ADM-2026-0001',
        studentName: 'Alice Johnson',
        programCode: 'BCS',
        assessmentScores: { 'cat-1': 28.5 },
        continuousAssessmentMarks: 28.5,
        examMarks: 63.5,
        totalMarks: 92.0,
        letterGrade: 'A',
        gradePoint: 4.0,
        workflowStatus: 'DRAFT',
      },
      {
        enrollmentId: 'enr-2',
        studentId: 'std-bob',
        admissionNumber: 'ADM-2026-0002',
        studentName: 'Bob Miller',
        programCode: 'BCS',
        assessmentScores: { 'cat-1': 21.0 },
        continuousAssessmentMarks: 21.0,
        examMarks: 51.0,
        totalMarks: 72.0,
        letterGrade: 'A',
        gradePoint: 4.0,
        workflowStatus: 'DRAFT',
      },
      {
        enrollmentId: 'enr-3',
        studentId: 'std-clara',
        admissionNumber: 'ADM-2026-0003',
        studentName: 'David Kim',
        programCode: 'BCS',
        assessmentScores: { 'cat-1': 16.0 },
        continuousAssessmentMarks: 16.0,
        examMarks: 44.0,
        totalMarks: 60.0,
        letterGrade: 'B',
        gradePoint: 3.0,
        workflowStatus: 'DRAFT',
      },
    ],
  });

  // Modals State
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [newAssessmentName, setNewAssessmentName] = useState('');
  const [newAssessmentType, setNewAssessmentType] = useState('CAT');
  const [newMaxMarks, setNewMaxMarks] = useState(20);
  const [newWeight, setNewWeight] = useState(20);

  // Moderation Revision Modal
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionRemarks, setRevisionRemarks] = useState('');

  // Appeal Modal
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [appealReason, setAppealReason] = useState('');

  // Student Transcript Mock
  const studentTranscript = {
    fullName: 'Alice Johnson',
    admissionNumber: 'ADM-2026-0001',
    program: 'Bachelor of Science in Computer Science',
    faculty: 'Faculty of Computing & Informatics',
    cgpa: 3.92,
    creditsAttempted: 18,
    creditsEarned: 18,
    academicStanding: 'GOOD_STANDING',
    semesters: [
      {
        name: 'Semester 1 (2026/2027)',
        sgpa: 4.0,
        courses: [
          { code: 'CS101', title: 'Intro to Computer Science', credits: 3, marks: 92, grade: 'A', gp: 4.0 },
          { code: 'MTH101', title: 'Calculus I for Engineers', credits: 3, marks: 88, grade: 'A', gp: 4.0 },
          { code: 'ENG101', title: 'Academic Writing & Research', credits: 3, marks: 84, grade: 'A', gp: 4.0 },
        ],
      },
      {
        name: 'Semester 2 (2026/2027)',
        sgpa: 3.84,
        courses: [
          { code: 'CS201', title: 'Data Structures & Algorithms', credits: 4, marks: 86, grade: 'A', gp: 4.0 },
          { code: 'SE201', title: 'Software Architecture & Patterns', credits: 3, marks: 74, grade: 'A', gp: 4.0 },
          { code: 'PHY102', title: 'Digital Logic & Circuitry', credits: 2, marks: 66, grade: 'B', gp: 3.0 },
        ],
      },
    ],
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">DRAFT</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">PENDING HOD MODERATION</span>;
      case 'MODERATED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">MODERATED / PENDING DEAN</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">APPROVED / PENDING REGISTRAR</span>;
      case 'PUBLISHED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">OFFICIAL & PUBLISHED</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  const getGradeBadge = (letter: string) => {
    switch (letter) {
      case 'A':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-emerald-100 text-emerald-800">A (4.0)</span>;
      case 'B':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-blue-100 text-blue-800">B (3.0)</span>;
      case 'C':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-yellow-100 text-yellow-800">C (2.0)</span>;
      case 'D':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-orange-100 text-orange-800">D (1.0)</span>;
      case 'F':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-red-100 text-red-800">F (0.0)</span>;
      default:
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-slate-100 text-slate-700">{letter}</span>;
    }
  };

  const getStandingBadge = (standing: string) => {
    switch (standing) {
      case 'GOOD_STANDING':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">GOOD STANDING</span>;
      case 'ACADEMIC_WARNING':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">ACADEMIC WARNING</span>;
      case 'PROBATION':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">PROBATION</span>;
      case 'SUSPENDED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">SUSPENDED</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">{standing}</span>;
    }
  };

  const handleScoreChange = (studentId: string, assessmentId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setGradebook((prev) => {
      const updatedRoster = prev.roster.map((r) => {
        if (r.studentId === studentId) {
          const newScores = { ...r.assessmentScores, [assessmentId]: num };
          // Recompute CA
          let ca = 0;
          for (const a of prev.assessments) {
            if (a.type !== 'FINAL_EXAM' && newScores[a.id] !== undefined && a.maxMarks > 0) {
              ca += (newScores[a.id] / a.maxMarks) * a.weightPercentage;
            }
          }
          ca = Math.round(ca * 100) / 100;
          const total = Math.min(Math.max(ca + r.examMarks, 0), 100);
          let letter = 'F';
          let gp = 0.0;
          if (total >= 70) { letter = 'A'; gp = 4.0; }
          else if (total >= 60) { letter = 'B'; gp = 3.0; }
          else if (total >= 50) { letter = 'C'; gp = 2.0; }
          else if (total >= 40) { letter = 'D'; gp = 1.0; }

          return {
            ...r,
            assessmentScores: newScores,
            continuousAssessmentMarks: ca,
            totalMarks: total,
            letterGrade: letter,
            gradePoint: gp,
          };
        }
        return r;
      });
      return { ...prev, roster: updatedRoster };
    });
  };

  const handleExamChange = (studentId: string, val: string) => {
    const exam = parseFloat(val) || 0;
    setGradebook((prev) => {
      const updatedRoster = prev.roster.map((r) => {
        if (r.studentId === studentId) {
          const total = Math.min(Math.max(r.continuousAssessmentMarks + exam, 0), 100);
          let letter = 'F';
          let gp = 0.0;
          if (total >= 70) { letter = 'A'; gp = 4.0; }
          else if (total >= 60) { letter = 'B'; gp = 3.0; }
          else if (total >= 50) { letter = 'C'; gp = 2.0; }
          else if (total >= 40) { letter = 'D'; gp = 1.0; }

          return {
            ...r,
            examMarks: exam,
            totalMarks: total,
            letterGrade: letter,
            gradePoint: gp,
          };
        }
        return r;
      });
      return { ...prev, roster: updatedRoster };
    });
  };

  // Workflow Handlers
  const handleLecturerSubmit = () => {
    setGradebook((prev) => ({
      ...prev,
      workflowStatus: 'SUBMITTED',
      roster: prev.roster.map((r) => ({ ...r, workflowStatus: 'SUBMITTED' })),
    }));
    setActionSuccess('Section grades formally submitted to Department Head of Department (HoD) for moderation.');
  };

  const handleHoDModerate = () => {
    setGradebook((prev) => ({
      ...prev,
      workflowStatus: 'MODERATED',
      roster: prev.roster.map((r) => ({ ...r, workflowStatus: 'MODERATED' })),
    }));
    setActionSuccess('Grades successfully moderated and signed off by Department HoD. Forwarded to Dean.');
  };

  const handleRequestRevision = () => {
    if (!revisionRemarks) {
      setActionError('Please provide specific remarks detailing needed revisions.');
      return;
    }
    setGradebook((prev) => ({
      ...prev,
      workflowStatus: 'DRAFT',
      roster: prev.roster.map((r) => ({ ...r, workflowStatus: 'DRAFT', remarks: revisionRemarks })),
    }));
    setIsRevisionModalOpen(false);
    setActionSuccess('Revision requested. Grades unlocked and returned to lecturer DRAFT.');
  };

  const handleDeanApprove = () => {
    setGradebook((prev) => ({
      ...prev,
      workflowStatus: 'APPROVED',
      roster: prev.roster.map((r) => ({ ...r, workflowStatus: 'APPROVED' })),
    }));
    setActionSuccess('Grades approved by Faculty Dean. Ready for Registrar official publication.');
  };

  const handleRegistrarPublish = () => {
    setGradebook((prev) => ({
      ...prev,
      workflowStatus: 'PUBLISHED',
      roster: prev.roster.map((r) => ({ ...r, workflowStatus: 'PUBLISHED' })),
    }));
    setActionSuccess('Official publication completed. Grades released to student portal; SGPA and CGPA progression recalculated.');
  };

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const currentWeight = gradebook.assessments.reduce((sum, a) => sum + a.weightPercentage, 0);
    if (currentWeight + newWeight > 100.001) {
      setActionError(`Total weight cannot exceed 100%. Current: ${currentWeight}%, Attempted: ${newWeight}%`);
      return;
    }
    const newId = `ass-${Date.now()}`;
    const newAss: AssessmentItem = {
      id: newId,
      name: newAssessmentName,
      type: newAssessmentType,
      maxMarks: newMaxMarks,
      weightPercentage: newWeight,
    };
    setGradebook((prev) => ({
      ...prev,
      assessments: [...prev.assessments, newAss],
    }));
    setIsAssessmentModalOpen(false);
    setNewAssessmentName('');
    setActionSuccess(`Assessment "${newAssessmentName}" (${newWeight}%) added successfully.`);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar currentTab="grades" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Gradebook & Academic Progression"
          breadcrumb="Academics  /  Gradebook & Progression"
          badge="Dean Moderation Active"
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-200/80 gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-royal-700">
                <Sparkles className="w-3.5 h-3.5 text-royal-600" />
                <span>Phase 10 • Academic Engine</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
                Assessments, Secure Gradebook & GPA Progression
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Continuous assessment weighting, secure marks entry, moderation approval state machine, and automated SGPA/CGPA standing.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setActionSuccess('Grade data refreshed.');
                  setTimeout(() => setActionSuccess(null), 3000);
                }}
                className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-medium shadow-xs transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setIsAssessmentModalOpen(true)}
                disabled={gradebook.workflowStatus !== 'DRAFT'}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Assessment</span>
              </button>
            </div>
          </div>

          {/* Notifications */}
          {actionSuccess && (
            <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{actionSuccess}</span>
              </div>
              <button onClick={() => setActionSuccess(null)} className="text-emerald-700 font-bold hover:text-emerald-900">×</button>
            </div>
          )}
          {actionError && (
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
              <button onClick={() => setActionError(null)} className="text-red-700 font-bold hover:text-red-900">×</button>
            </div>
          )}

          {/* Analytics Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Course Section</span>
                <BookOpen className="w-4 h-4 text-royal-600" />
              </div>
            <div className="text-lg font-bold text-slate-900">{gradebook.courseCode}</div>
            <div className="text-xs text-slate-500 truncate">{gradebook.sectionName}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Workflow Status</span>
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-1">{getStatusBadge(gradebook.workflowStatus)}</div>
            <div className="text-xs text-slate-400 mt-1">Lecturer: {gradebook.lecturerName}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Pass Rate</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{gradebook.statistics.passRate}%</div>
            <div className="text-xs text-slate-500">Mean: {gradebook.statistics.meanMarks} / 100</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Enrolled Students</span>
              <GraduationCap className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{gradebook.statistics.totalEnrolled}</div>
            <div className="text-xs text-slate-500">Graded: {gradebook.statistics.gradedCount}</div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 border-b border-slate-200 mt-8 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('gradebook')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all ${
              activeTab === 'gradebook'
                ? 'bg-white border-t border-l border-r border-slate-200 text-royal-700 shadow-xs border-b-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Lecturer Class Gradebook
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all ${
              activeTab === 'moderation'
                ? 'bg-white border-t border-l border-r border-slate-200 text-royal-700 shadow-xs border-b-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            2. HoD Moderation & Dean Approval
          </button>
          <button
            onClick={() => setActiveTab('publishing')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all ${
              activeTab === 'publishing'
                ? 'bg-white border-t border-l border-r border-slate-200 text-royal-700 shadow-xs border-b-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Registrar Official Publishing & Standing
          </button>
          <button
            onClick={() => setActiveTab('student')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all ${
              activeTab === 'student'
                ? 'bg-white border-t border-l border-r border-slate-200 text-royal-700 shadow-xs border-b-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            4. Student Academic Transcript & Appeals
          </button>
        </div>

        {/* TAB 1: LECTURER CLASS GRADEBOOK */}
        {activeTab === 'gradebook' && (
          <div className="mt-6 space-y-6">
            {/* Assessment Structure Chips */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Grading Architecture</h3>
                <p className="text-xs text-slate-400 mt-0.5">Continuous Assessment (CA) + Final Examination weights must equal 100%.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {gradebook.assessments.map((a) => (
                  <div key={a.id} className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-royal-600" />
                    <span>{a.name}</span>
                    <span className="text-slate-400 font-normal">({a.weightPercentage}%)</span>
                  </div>
                ))}
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                  Total Weight: {gradebook.assessments.reduce((sum, a) => sum + a.weightPercentage, 0)}%
                </div>
              </div>
            </div>

            {/* Roster Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Student Mark Entry Grid</h3>
                  <p className="text-xs text-slate-400">Continuous Assessment and Examination marks calculate total scores and letter grades in real-time.</p>
                </div>

                <div className="flex items-center space-x-2">
                  {gradebook.workflowStatus === 'DRAFT' && (
                    <button
                      onClick={handleLecturerSubmit}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-indigo-700 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit to HoD for Moderation</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Program</th>
                      {gradebook.assessments
                        .filter((a) => a.type !== 'FINAL_EXAM')
                        .map((a) => (
                          <th key={a.id} className="py-3 px-4">
                            {a.name} (Max {a.maxMarks})
                          </th>
                        ))}
                      <th className="py-3 px-4">CA Total (30%)</th>
                      <th className="py-3 px-4">Final Exam (Max 70)</th>
                      <th className="py-3 px-4">Total Score (100)</th>
                      <th className="py-3 px-4">Grade & GP</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gradebook.roster.map((student) => (
                      <tr key={student.studentId} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{student.studentName}</div>
                          <div className="text-[11px] text-slate-400">{student.admissionNumber}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{student.programCode}</td>
                        {gradebook.assessments
                          .filter((a) => a.type !== 'FINAL_EXAM')
                          .map((a) => (
                            <td key={a.id} className="py-3 px-4">
                              <input
                                type="number"
                                min="0"
                                max={a.maxMarks}
                                disabled={gradebook.workflowStatus !== 'DRAFT'}
                                value={student.assessmentScores[a.id] ?? ''}
                                onChange={(e) => handleScoreChange(student.studentId, a.id, e.target.value)}
                                className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal-500 disabled:bg-slate-50 disabled:text-slate-500"
                              />
                            </td>
                          ))}
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {student.continuousAssessmentMarks.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            max="70"
                            disabled={gradebook.workflowStatus !== 'DRAFT'}
                            value={student.examMarks}
                            onChange={(e) => handleExamChange(student.studentId, e.target.value)}
                            className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal-500 disabled:bg-slate-50 disabled:text-slate-500"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {student.totalMarks.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">{getGradeBadge(student.letterGrade)}</td>
                        <td className="py-3 px-4">{getStatusBadge(student.workflowStatus)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HOD MODERATION & DEAN APPROVAL */}
        {activeTab === 'moderation' && (
          <div className="mt-6 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Head of Department (HoD) & Dean Moderation Hub</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Rigorous peer review of grading distributions, mark audits, and formal sign-offs.
                  </p>
                </div>
                {getStatusBadge(gradebook.workflowStatus)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-xs text-slate-500 font-medium">Department</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">Computer Science (FCI)</div>
                  <div className="text-xs text-slate-400 mt-1">HoD: Prof. Charles Babbage</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-xs text-slate-500 font-medium">Grade Anomaly Detection</div>
                  <div className="text-sm font-bold text-emerald-700 mt-1">Bell-Curve Normal</div>
                  <div className="text-xs text-slate-400 mt-1">0 missing marks, 0 anomalies flagged</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-xs text-slate-500 font-medium">Faculty Dean</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">Prof. Ada Lovelace</div>
                  <div className="text-xs text-slate-400 mt-1">Computing & Informatics</div>
                </div>
              </div>

              {/* Action Buttons based on state */}
              <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                {gradebook.workflowStatus === 'SUBMITTED' && (
                  <>
                    <button
                      onClick={handleHoDModerate}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-blue-700 transition flex items-center space-x-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>HoD: Sign-off & Moderate Section</span>
                    </button>
                    <button
                      onClick={() => setIsRevisionModalOpen(true)}
                      className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold hover:bg-rose-100 transition flex items-center space-x-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>HoD: Request Revisions from Lecturer</span>
                    </button>
                  </>
                )}

                {gradebook.workflowStatus === 'MODERATED' && (
                  <button
                    onClick={handleDeanApprove}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-purple-700 transition flex items-center space-x-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Dean: Formally Approve Grades</span>
                  </button>
                )}

                {['DRAFT', 'APPROVED', 'PUBLISHED'].includes(gradebook.workflowStatus) && (
                  <div className="text-xs text-slate-500 italic">
                    Current status ({gradebook.workflowStatus}) does not require immediate moderation action.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REGISTRAR OFFICIAL PUBLISHING & STANDING */}
        {activeTab === 'publishing' && (
          <div className="mt-6 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Office of the Registrar: Grade Publication & GPA Engine</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Final release of official grades to student transcripts and automated batch evaluation of academic progression.
                  </p>
                </div>
                {getStatusBadge(gradebook.workflowStatus)}
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-800">Publish Approved Course Grades</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Once published, grades cannot be edited without elevated authorization, reason logging, and audit trail entry.
                  </div>
                </div>

                <button
                  onClick={handleRegistrarPublish}
                  disabled={gradebook.workflowStatus !== 'APPROVED'}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 whitespace-nowrap"
                >
                  <Award className="w-4 h-4" />
                  <span>Publish Grades to Students</span>
                </button>
              </div>

              {/* Standing Rules Matrix */}
              <div className="mt-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Academic Standing Evaluation Matrix</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                    <div className="text-xs font-bold text-emerald-900">Good Standing</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">CGPA ≥ 2.00</div>
                    <div className="text-[11px] text-slate-500 mt-1">Normal academic progression</div>
                  </div>

                  <div className="p-3 bg-yellow-50/60 border border-yellow-200 rounded-xl">
                    <div className="text-xs font-bold text-yellow-900">Academic Warning</div>
                    <div className="text-[11px] text-yellow-700 mt-0.5">1.75 ≤ CGPA &lt; 2.00</div>
                    <div className="text-[11px] text-slate-500 mt-1">Mandatory academic advising</div>
                  </div>

                  <div className="p-3 bg-orange-50/60 border border-orange-200 rounded-xl">
                    <div className="text-xs font-bold text-orange-900">Academic Probation</div>
                    <div className="text-[11px] text-orange-700 mt-0.5">1.00 ≤ CGPA &lt; 1.75</div>
                    <div className="text-[11px] text-slate-500 mt-1">Credit limit capped at 12</div>
                  </div>

                  <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl">
                    <div className="text-xs font-bold text-red-900">Suspension</div>
                    <div className="text-[11px] text-red-700 mt-0.5">CGPA &lt; 1.00 or 2 terms on probation</div>
                    <div className="text-[11px] text-slate-500 mt-1">Excluded for 1 academic year</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STUDENT TRANSCRIPT & APPEALS */}
        {activeTab === 'student' && (
          <div className="mt-6 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Official Student Record</div>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">{studentTranscript.fullName}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {studentTranscript.admissionNumber} • {studentTranscript.program} • {studentTranscript.faculty}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {getStandingBadge(studentTranscript.academicStanding)}
                  <button
                    onClick={() => setIsAppealModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
                  >
                    Submit Grade Appeal
                  </button>
                  <button
                    onClick={() => alert('Official cryptographic PDF transcript downloaded.')}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-800 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Cumulative Gauge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-xs text-slate-500 font-medium">Cumulative GPA (CGPA)</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">{studentTranscript.cgpa.toFixed(2)}</div>
                  <div className="text-xs text-emerald-600 font-medium mt-1">Top 5% of Cohort</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-xs text-slate-500 font-medium">Credits Earned / Attempted</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">
                    {studentTranscript.creditsEarned} / {studentTranscript.creditsAttempted}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">100% Completion Rate</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-xs text-slate-500 font-medium">Academic Status</div>
                  <div className="mt-2">{getStandingBadge(studentTranscript.academicStanding)}</div>
                  <div className="text-xs text-slate-400 mt-2">Eligible for Semester Registration</div>
                </div>
              </div>

              {/* Semesters list */}
              <div className="mt-8 space-y-6">
                {studentTranscript.semesters.map((sem, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{sem.name}</span>
                      <span className="text-xs font-mono font-semibold text-slate-700">SGPA: {sem.sgpa.toFixed(2)}</span>
                    </div>

                    <table className="w-full text-left text-xs">
                      <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-white">
                        <tr>
                          <th className="py-2.5 px-4">Code</th>
                          <th className="py-2.5 px-4">Course Title</th>
                          <th className="py-2.5 px-4">Credits</th>
                          <th className="py-2.5 px-4">Score</th>
                          <th className="py-2.5 px-4">Letter</th>
                          <th className="py-2.5 px-4">Grade Point</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sem.courses.map((c) => (
                          <tr key={c.code} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-semibold text-slate-900">{c.code}</td>
                            <td className="py-2.5 px-4 text-slate-700">{c.title}</td>
                            <td className="py-2.5 px-4">{c.credits}</td>
                            <td className="py-2.5 px-4 font-mono">{c.marks}</td>
                            <td className="py-2.5 px-4">{getGradeBadge(c.grade)}</td>
                            <td className="py-2.5 px-4 font-mono font-medium">{c.gp.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Assessment */}
        {isAssessmentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add Course Assessment</h3>
              <p className="text-xs text-slate-500 mt-1">Define an assessment weighting component for this class section.</p>

              <form onSubmit={handleCreateAssessment} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Midterm Examination, CAT 2"
                    value={newAssessmentName}
                    onChange={(e) => setNewAssessmentName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-royal-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                    <select
                      value={newAssessmentType}
                      onChange={(e) => setNewAssessmentType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-royal-500 focus:outline-none"
                    >
                      <option value="CAT">CAT (Test)</option>
                      <option value="ASSIGNMENT">Assignment</option>
                      <option value="QUIZ">Quiz</option>
                      <option value="LAB">Lab Work</option>
                      <option value="FINAL_EXAM">Final Exam</option>
                      <option value="PROJECT">Project</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Max Raw Marks</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="1000"
                      value={newMaxMarks}
                      onChange={(e) => setNewMaxMarks(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-royal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weight Percentage (%)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={newWeight}
                    onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-royal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAssessmentModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    Save Assessment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Request Revision */}
        {isRevisionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Request Grade Revisions</h3>
              <p className="text-xs text-slate-500 mt-1">Specify detailed instructions for lecturer mark corrections.</p>

              <div className="mt-4 space-y-4">
                <textarea
                  rows={4}
                  placeholder="e.g. Please re-check Bob Miller Final Exam Section B calculations..."
                  value={revisionRemarks}
                  onChange={(e) => setRevisionRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRevisionModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestRevision}
                    className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-rose-700 transition"
                  >
                    Confirm Revision Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Grade Appeal */}
        {isAppealModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Submit Formal Grade Appeal</h3>
              <p className="text-xs text-slate-500 mt-1">Appeals will be reviewed by the Faculty Academic Board.</p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs">
                    <option>CS101 - Introduction to Computer Science & Programming</option>
                    <option>CS201 - Data Structures & Algorithms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Reason for Re-evaluation</label>
                  <textarea
                    rows={4}
                    placeholder="Provide specific questions, sections, or proof supporting re-marking..."
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-royal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAppealModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!appealReason || appealReason.length < 10) {
                        alert('Please provide a detailed reason with at least 10 characters.');
                        return;
                      }
                      setIsAppealModalOpen(false);
                      setActionSuccess('Grade appeal submitted successfully. Tracking ticket created.');
                    }}
                    className="px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    Submit Appeal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}

export default function GradesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Grades & Progression Engine...</div>}>
      <GradesContent />
    </Suspense>
  );
}
