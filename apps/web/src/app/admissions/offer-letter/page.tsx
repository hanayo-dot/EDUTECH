'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Printer,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Award,
  Building,
  Calendar,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

function OfferLetterContent() {
  const searchParams = useSearchParams();
  const appParam = searchParams.get('app') || '';
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appParam) {
      fetchOfferData();
    } else {
      setLoading(false);
      setError('Please provide an application parameter (e.g. ?app=APP-2026-1001).');
    }
  }, [appParam]);

  const fetchOfferData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<any>(`/admissions/offer-letter/${encodeURIComponent(appParam)}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Could not retrieve official offer letter.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center text-slate-500 text-sm">
          Generating cryptographic offer letter verification...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900">Offer Letter Unavailable</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <Link
            href="/admissions"
            className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            &larr; Back to Admissions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200/60 py-8 px-4 sm:px-6 flex flex-col items-center">
      {/* Top Action Bar (hidden when printing) */}
      <div className="w-full max-w-3xl mb-4 flex items-center justify-between print:hidden">
        <Link
          href={`/admissions/status?app=${data.applicationNumber}&email=${encodeURIComponent(
            data.applicantEmail || '',
          )}`}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tracker</span>
        </Link>

        <button
          onClick={handlePrint}
          className="px-5 py-2 bg-slate-900 hover:bg-[#f43f85] text-white rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Official PDF</span>
        </button>
      </div>

      {/* Printable Formal Document Sheet (A4 format) */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-300/80 p-8 sm:p-14 print:p-0 print:border-none print:shadow-none print:rounded-none relative text-slate-800 font-serif leading-relaxed">
        {/* University Header with Crest */}
        <div className="border-b-2 border-slate-800 pb-6 mb-8 text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-[#f43f85] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wider text-slate-950 font-sans">
            {data.institutionName || 'CHUOMS ENTERPRISE UNIVERSITY'}
          </h1>
          <p className="text-xs font-sans tracking-widest text-slate-500 uppercase mt-1">
            Office of the Registrar &bull; Directorate of Academic Affairs & Admissions
          </p>
          <p className="text-[11px] font-sans text-slate-400 mt-0.5">
            {data.campusName} &bull; {data.campusLocation} &bull; ISO 9001:2015 Certified
          </p>
        </div>

        {/* Reference & Date Bar */}
        <div className="flex items-center justify-between text-xs font-sans mb-8 border-b border-slate-100 pb-3">
          <div>
            <span className="font-semibold text-slate-400 uppercase">Our Reference:</span>{' '}
            <span className="font-mono font-bold text-slate-900">
              CMS/ADM/{data.programCode}/{data.applicationNumber}
            </span>
          </div>
          <div>
            <span className="font-semibold text-slate-400 uppercase">Date Issued:</span>{' '}
            <span className="font-bold text-slate-900">
              {new Date(data.decisionDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Addressed To */}
        <div className="mb-6 font-sans text-xs space-y-0.5">
          <div className="text-slate-400 font-semibold uppercase text-[10px]">Addressed To:</div>
          <div className="text-sm font-bold text-slate-950">{data.applicantName}</div>
          <div className="text-slate-600">{data.applicantEmail}</div>
          <div className="font-mono text-slate-500">Applicant Ref: {data.applicationNumber}</div>
        </div>

        {/* Letter Subject */}
        <div className="mb-6">
          <h2 className="text-sm sm:text-base font-sans font-extrabold text-slate-950 underline uppercase tracking-wide">
            OFFER OF PROVISIONAL ADMISSION TO {data.programName?.toUpperCase()} ({data.programCode})
          </h2>
        </div>

        {/* Body Text */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
          <p>Dear {data.applicantName},</p>

          <p>
            On behalf of the University Senate and Admissions Board, I have the distinct honor and pleasure to inform you that you have been offered provisional admission to the following academic program:
          </p>

          {/* Program Specs Callout Table */}
          <div className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 font-medium">Degree Level:</span>
                <div className="font-bold text-slate-900">{data.degreeLevel} Degree</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Program Title:</span>
                <div className="font-bold text-slate-900">{data.programName}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Faculty / School:</span>
                <div className="font-bold text-slate-900">{data.facultyName}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Assigned Campus:</span>
                <div className="font-bold text-slate-900">{data.campusName}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Standard Duration:</span>
                <div className="font-bold text-slate-900">{data.durationYears} Academic Years</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Commencement Term:</span>
                <div className="font-bold text-slate-900">{data.intakeTerm}</div>
              </div>
            </div>
          </div>

          <p>
            <strong>Terms and Conditions:</strong> {data.conditions}
          </p>

          <p>
            <strong>Reporting Date & Orientation:</strong> You are requested to report to the campus Admissions Office on{' '}
            <strong>
              {new Date(data.reportingDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </strong>{' '}
            for original document verification, biometric registration, smart RFID student badge issuance, and formal matriculation ceremony induction.
          </p>

          <p>
            Please log into the ChuoMS Admissions portal using your Application Number (
            <code>{data.applicationNumber}</code>) to formally record your acceptance of this offer.
          </p>

          <p className="pt-2">We congratulate you on this milestone and warmly welcome you to our community of academic excellence.</p>
        </div>

        {/* Signatures & Seal Section */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 font-sans">
          <div>
            <div className="font-serif italic text-lg text-slate-800 border-b border-slate-400 pb-1 mb-1 font-bold">
              Margaret Hamilton
            </div>
            <div className="font-bold text-slate-900 text-xs uppercase">Margaret Hamilton, Ph.D.</div>
            <div className="text-[11px] text-slate-500">Registrar (Academic & Student Affairs)</div>
            <div className="text-[10px] text-slate-400">ChuoMS Enterprise University</div>
          </div>

          {/* Verification Hash Stamp */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3 text-left">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Cryptographic Audit Stamp
              </div>
              <div className="font-mono font-bold text-xs text-slate-900">
                VERIFY: {data.verificationCode}
              </div>
              <div className="text-[9px] text-emerald-600 font-semibold">
                Tamper-Evident Institutional Registry Verified
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OfficialOfferLetterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-xs text-slate-400">
          Generating cryptographic offer letter verification...
        </div>
      }
    >
      <OfferLetterContent />
    </React.Suspense>
  );
}
