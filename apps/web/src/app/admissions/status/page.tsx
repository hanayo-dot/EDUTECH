'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  UserCheck,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Send,
  Check,
  Award,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

function StatusTrackerContent() {
  const searchParams = useSearchParams();
  const [appNumber, setAppNumber] = useState(searchParams.get('app') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  // Offer Acceptance state
  const [accepting, setAccepting] = useState(false);
  const [acceptSuccess, setAcceptSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (appNumber && email) {
      handleLookup();
    }
  }, []);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!appNumber || !email) {
      setError('Please provide both Application Number and Email.');
      return;
    }

    setLoading(true);
    setError(null);
    setAcceptSuccess(null);

    try {
      const res = await apiClient<any>(
        `/admissions/lookup?applicationNumber=${encodeURIComponent(
          appNumber.trim(),
        )}&email=${encodeURIComponent(email.trim())}`,
      );
      setResult(res.data);
    } catch (err: any) {
      setResult(null);
      setError(
        err.message || 'No matching application found. Please check your credentials.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (accepted: boolean) => {
    if (!result) return;
    setAccepting(true);
    setError(null);
    try {
      await apiClient(`/admissions/applications/${result.id}/accept-offer`, {
        method: 'POST',
        body: JSON.stringify({
          accepted,
          notes: accepted
            ? 'Candidate accepted admission offer via student status tracker.'
            : 'Candidate declined offer.',
        }),
      });
      setAcceptSuccess(
        accepted
          ? 'Congratulations! You have accepted the admission offer. The registrar will issue your student matriculation file.'
          : 'Your decision to decline the offer has been recorded.',
      );
      // Re-fetch
      handleLookup();
    } catch (err: any) {
      setError(err.message || 'Failed to submit offer response.');
    } finally {
      setAccepting(false);
    }
  };

  const workflowSteps = [
    { key: 'SUBMITTED', label: 'Application Submitted' },
    { key: 'UNDER_REVIEW', label: 'Under Review' },
    { key: 'SHORTLISTED', label: 'Shortlisted & Scored' },
    { key: 'OFFERED', label: 'Admission Offered' },
    { key: 'ACCEPTED', label: 'Offer Accepted' },
    { key: 'MATRICULATED', label: 'Matriculated Student' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 0;
      case 'UNDER_REVIEW':
        return 1;
      case 'SHORTLISTED':
        return 2;
      case 'OFFERED':
        return 3;
      case 'ACCEPTED':
        return 4;
      case 'MATRICULATED':
        return 5;
      default:
        return 0;
    }
  };

  const currentIndex = result ? getStepIndex(result.status) : 0;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-royal-600 via-royal-500 to-azure-500 flex items-center justify-center p-[2px]">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-royal-600" />
            </div>
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-lg">
            ChuoMS Admissions Tracker
          </span>
        </Link>

        <div className="flex items-center space-x-3 text-xs font-semibold">
          <Link href="/admissions/apply" className="text-royal-600 hover:underline">
            + New Application
          </Link>
          <span className="text-slate-300">|</span>
          <Link href="/admissions" className="text-slate-600 hover:text-slate-900">
            Admissions Officer Portal
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Lookup Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <h1 className="text-xl font-bold text-slate-900 mb-1">
            Track Real-Time Application Progress
          </h1>
          <p className="text-xs text-slate-500 mb-6">
            Enter your official Application Number and registered Email to view current review status, scores, and admission offer letters.
          </p>

          <form onSubmit={handleLookup} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Application Number
              </label>
              <input
                type="text"
                placeholder="e.g. APP-2026-1001"
                value={appNumber}
                onChange={(e) => setAppNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-royal-500/30 focus:border-royal-500 focus:outline-none font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Registered Email
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-royal-500/30 focus:border-royal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-2.5 bg-royal-600 hover:bg-royal-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'Searching...' : 'Track Application'}</span>
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Application Result Details */}
        {result && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-mono font-bold text-royal-700 bg-royal-50 px-2.5 py-1 rounded-md border border-royal-200">
                  {result.applicationNumber}
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
                  {result.applicantName}
                </h2>
                <p className="text-xs text-slate-500">
                  {result.program?.name} ({result.program?.code}) &bull; {result.intakeTerm}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Current Stage</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {result.status}
                </div>
              </div>
            </div>

            {/* Workflow Timeline */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                Lifecycle Progression
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {workflowSteps.map((wf, idx) => {
                  const isDone = idx < currentIndex;
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={wf.key}
                      className={`p-3 rounded-2xl border flex flex-col justify-between text-center transition ${
                        isCurrent
                          ? 'border-royal-500 bg-royal-50/50 shadow-xs text-royal-900'
                          : isDone
                          ? 'border-emerald-200 bg-emerald-50/40 text-emerald-800'
                          : 'border-slate-100 bg-slate-50/50 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold mb-1">
                        {isDone ? '✓ ' : ''}
                        {idx + 1}. {wf.label}
                      </div>
                      <div className="text-[10px]">
                        {isDone ? 'Completed' : isCurrent ? 'Active Stage' : 'Pending'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notification if Matriculated */}
            {result.status === 'MATRICULATED' && (
              <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-bold text-indigo-900 text-sm">
                      Official Matriculation Certified!
                    </h4>
                  </div>
                  <p className="text-xs text-indigo-700">
                    You are now an officially recognized student of ChuoMS. Your student admission file has been populated.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-1.5 flex-shrink-0"
                >
                  <span>Log into Student Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Offer Letter Action Callout if OFFERED */}
            {result.status === 'OFFERED' && (
              <div className="p-6 bg-teal-50 border border-teal-200 rounded-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-200 text-teal-900 uppercase">
                      Action Required
                    </span>
                    <h4 className="text-base font-bold text-teal-950 mt-1">
                      Congratulations! You have received a formal Admission Offer
                    </h4>
                    <p className="text-xs text-teal-800 mt-0.5">
                      {result.decisionReason || 'You meet all institutional academic criteria for admission.'}
                    </p>
                  </div>

                  <Link
                    href={`/admissions/offer-letter?app=${result.applicationNumber}`}
                    target="_blank"
                    className="px-3.5 py-2 bg-white text-teal-800 border border-teal-300 rounded-xl font-bold text-xs hover:bg-teal-100 transition inline-flex items-center space-x-1.5"
                  >
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>View Official Offer Letter</span>
                    <ExternalLink className="w-3 h-3 text-teal-500" />
                  </Link>
                </div>

                {acceptSuccess ? (
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{acceptSuccess}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      onClick={() => handleAcceptOffer(true)}
                      disabled={accepting}
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{accepting ? 'Recording Acceptance...' : 'Accept Admission Offer'}</span>
                    </button>

                    <button
                      onClick={() => handleAcceptOffer(false)}
                      disabled={accepting}
                      className="px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-semibold rounded-xl text-xs transition"
                    >
                      Decline Offer
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Score & Evaluation Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Academic Program & Faculty
                </span>
                <div className="font-bold text-slate-900 text-xs">
                  {result.program?.name} ({result.program?.code})
                </div>
                <div className="text-[11px] text-slate-500">
                  {result.program?.department?.faculty?.name}
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Admissions Evaluation Score
                </span>
                <div className="font-bold text-slate-900 text-xs">
                  {result.score !== null ? (
                    <span className="text-emerald-700 font-extrabold text-sm">
                      {result.score} / 100 Points
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Evaluation in progress</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  {result.score !== null ? 'Passed preliminary scoring threshold' : 'Under committee assessment'}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-slate-200 text-center text-xs text-slate-400">
        Copyright &copy; 2026 Patentrixx &bull; ChuoMS Enterprise Admissions Platform
      </footer>
    </div>
  );
}

export default function ApplicationStatusTrackerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
          Loading application tracker...
        </div>
      }
    >
      <StatusTrackerContent />
    </React.Suspense>
  );
}
