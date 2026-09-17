'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Upload,
  User,
  BookOpen,
  Building,
  Calendar,
  Sparkles,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

export default function PublicAdmissionsApplyPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    dateOfBirth: '2004-06-15',
    gender: 'MALE',
    nationality: 'Kenyan',
    nationalId: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',

    // Step 2: Academic Program Choice
    programId: '312717bb-cb25-4786-a8df-a95e3a06d07c', // BSC CS default
    campusId: '9b702c9b-7680-4c7f-87d1-d1b19de64303', // Main Campus
    intakeTerm: 'FALL 2026',
    studyMode: 'REGULAR',

    // Step 3: Prior Education & Docs
    highSchool: 'Alliance High School',
    qualification: 'Kenya Certificate of Secondary Education (KCSE)',
    meanGrade: 'A-',
    completionYear: '2025',
    transcriptTitle: 'KCSE Official Result Slip',
    transcriptUrl: 'https://storage.chuoms.edu/documents/transcripts/applicant_result_slip.pdf',
    nationalIdTitle: 'National Identity Card Scan',
    nationalIdUrl: 'https://storage.chuoms.edu/documents/id/applicant_national_id.pdf',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || undefined,
        email: formData.email,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender,
        nationality: formData.nationality,
        nationalId: formData.nationalId || undefined,
        address: formData.address || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
        programId: formData.programId,
        campusId: formData.campusId,
        intakeTerm: formData.intakeTerm,
        studyMode: formData.studyMode,
        documents: [
          {
            docType: 'TRANSCRIPT',
            title: formData.transcriptTitle || 'Official Academic Transcript',
            fileUrl: formData.transcriptUrl,
            fileSize: 2048576,
            mimeType: 'application/pdf',
          },
          {
            docType: 'ID_CARD',
            title: formData.nationalIdTitle || 'Government National ID / Passport',
            fileUrl: formData.nationalIdUrl,
            fileSize: 1048576,
            mimeType: 'application/pdf',
          },
        ],
      };

      const res = await apiClient<any>('/admissions/apply', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSubmittedData(res.data);
      setStep(4); // Success step
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please verify details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white flex flex-col justify-between">
      {/* Public Header */}
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ec4899] via-[#f43f85] to-[#38bdf8] flex items-center justify-center p-[2px]">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-[#f43f85]" />
              </div>
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">
              ChuoMS Admissions
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-4 text-xs font-semibold">
          <Link
            href="/admissions/status"
            className="text-slate-600 hover:text-slate-900 inline-flex items-center space-x-1"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Track Application</span>
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            href="/admissions"
            className="text-indigo-600 hover:text-indigo-800 inline-flex items-center space-x-1"
          >
            <span>Officer Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8">
        {step < 4 && (
          <div className="mb-8 text-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-pink-100 text-[#f43f85]">
              Fall 2026 Admissions Open
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
              Undergraduate & Graduate Application Portal
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl mx-auto">
              Join thousands of aspiring scholars. Fill in the online form below to begin your academic journey at ChuoMS.
            </p>

            {/* Step Progress Stepper */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 mt-6">
              {[
                { num: 1, label: 'Personal Information' },
                { num: 2, label: 'Program Selection' },
                { num: 3, label: 'Education & Documents' },
              ].map((s) => (
                <div key={s.num} className="flex items-center space-x-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      step === s.num
                        ? 'bg-[#f43f85] text-white shadow-md shadow-pink-200 ring-4 ring-pink-100'
                        : step > s.num
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden md:inline ${
                      step === s.num ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                  {s.num < 3 && <div className="w-8 h-[2px] bg-slate-200 hidden sm:block" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs flex items-center space-x-2">
            <span className="font-bold">Error:</span>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: PERSONAL DETAILS */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-[#f43f85]" />
                Step 1: Personal & Contact Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ensure names match exactly with your official national ID or passport.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="e.g. Samuel"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f43f85]/30 focus:border-[#f43f85]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Last Name (Surname) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="e.g. Ochieng"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f43f85]/30 focus:border-[#f43f85]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  placeholder="e.g. Kiprono"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f43f85]/30 focus:border-[#f43f85]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f43f85]/30 focus:border-[#f43f85]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+254 7XX XXX XXX"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f43f85]/30 focus:border-[#f43f85]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f43f85]/30 focus:border-[#f43f85]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f43f85]/30 focus:border-[#f43f85]"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other / Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  National ID / Passport Number
                </label>
                <input
                  type="text"
                  name="nationalId"
                  placeholder="39281044"
                  value={formData.nationalId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f43f85]/30 focus:border-[#f43f85]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  if (!formData.firstName || !formData.lastName || !formData.email) {
                    setError('Please provide at least First Name, Last Name, and Email.');
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="px-6 py-3 bg-[#f43f85] hover:bg-pink-600 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-2"
              >
                <span>Continue to Program Selection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PROGRAM SELECTION */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-[#f43f85]" />
                Step 2: Academic Program & Campus Preference
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your intended program of study and preferred institutional campus.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Select Desired Degree Program <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: '312717bb-cb25-4786-a8df-a95e3a06d07c',
                      code: 'BCS',
                      title: 'Bachelor of Science in Computer Science',
                      faculty: 'Faculty of Computing & Informatics',
                      duration: '4 Years',
                    },
                    {
                      id: 'b963a81b-c98d-42bc-bdd1-712ad5ad64b0',
                      code: 'BSE',
                      title: 'Bachelor of Science in Software Engineering',
                      faculty: 'Faculty of Computing & Informatics',
                      duration: '4 Years',
                    },
                    {
                      id: '246b260d-d14f-4dd8-ab45-118b7a6968ca',
                      code: 'BAF',
                      title: 'BBA in Finance & Investment',
                      faculty: 'School of Business & Economics',
                      duration: '4 Years',
                    },
                  ].map((prog) => (
                    <div
                      key={prog.id}
                      onClick={() => setFormData((p) => ({ ...p, programId: prog.id }))}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        formData.programId === prog.id
                          ? 'border-[#f43f85] bg-pink-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {prog.code}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs mt-2">{prog.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-1">{prog.faculty}</p>
                      </div>
                      <div className="mt-3 text-[11px] font-semibold text-slate-500">
                        Duration: {prog.duration}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Campus Location
                  </label>
                  <select
                    name="campusId"
                    value={formData.campusId}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f43f85]/30 focus:border-[#f43f85]"
                  >
                    <option value="9b702c9b-7680-4c7f-87d1-d1b19de64303">
                      Main Campus - Metropolis
                    </option>
                    <option value="c8a2db14-6053-4ee9-8fd1-2a8cc8444605">
                      North Campus - Tech Valley
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Intake Term
                  </label>
                  <select
                    name="intakeTerm"
                    value={formData.intakeTerm}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f43f85]/30 focus:border-[#f43f85]"
                  >
                    <option value="FALL 2026">Fall 2026 (September)</option>
                    <option value="SPRING 2027">Spring 2027 (January)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Study Mode
                  </label>
                  <select
                    name="studyMode"
                    value={formData.studyMode}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f43f85]/30 focus:border-[#f43f85]"
                  >
                    <option value="REGULAR">Full-Time Day (Regular)</option>
                    <option value="EVENING">Evening / Executive</option>
                    <option value="WEEKEND">Weekend Cohort</option>
                    <option value="DISTANCE">Online & Distance Learning</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs transition flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-[#f43f85] hover:bg-pink-600 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-2"
              >
                <span>Continue to Education & Documents</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PRIOR EDUCATION & DOCUMENTS */}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-[#f43f85]" />
                Step 3: Prior Academic History & Supporting Documents
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload scans of your high school examination certificates or diploma transcripts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  High School / Previous Institution
                </label>
                <input
                  type="text"
                  name="highSchool"
                  placeholder="e.g. Nairobi High School"
                  value={formData.highSchool}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f43f85]/30 focus:border-[#f43f85]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Exam Mean Grade / GPA
                </label>
                <input
                  type="text"
                  name="meanGrade"
                  placeholder="e.g. Mean Grade A (81 Points) or GPA 3.8"
                  value={formData.meanGrade}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f43f85]/30 focus:border-[#f43f85]"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Document Upload Attachments
              </h4>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800 text-xs">
                      1. Academic Transcript / KCSE Certificate
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Ready to Attach
                  </span>
                </div>
                <input
                  type="text"
                  name="transcriptTitle"
                  value={formData.transcriptTitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                />
                <input
                  type="text"
                  name="transcriptUrl"
                  value={formData.transcriptUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-[11px] font-mono text-slate-600 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-slate-800 text-xs">
                      2. Government ID / Passport Bio Page
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Ready to Attach
                  </span>
                </div>
                <input
                  type="text"
                  name="nationalIdTitle"
                  value={formData.nationalIdTitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                />
                <input
                  type="text"
                  name="nationalIdUrl"
                  value={formData.nationalIdUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-[11px] font-mono text-slate-600 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
              <span>
                By submitting, you certify that all statements and attached qualifications are genuine and subject to verification against official testing authority registries.
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs transition flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-[#f43f85] hover:bg-pink-600 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-2"
              >
                <span>{submitting ? 'Submitting Application...' : 'Submit Final Application'}</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 4 && submittedData && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 text-center space-y-6 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Application Submitted Successfully!
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Your application has been logged into the ChuoMS Admissions registry.
              </p>
            </div>

            {/* Application Details Callout */}
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-left space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  Official Application Number
                </span>
                <span className="text-lg font-mono font-extrabold text-[#f43f85]">
                  {submittedData.applicationNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Program:</span>
                  <div className="font-bold text-slate-800">{submittedData.program?.name}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Intake Term:</span>
                  <div className="font-bold text-slate-800">{submittedData.intakeTerm}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Applicant:</span>
                  <div className="font-bold text-slate-800">{submittedData.applicant?.fullName}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Initial Status:</span>
                  <div className="font-bold text-blue-600">{submittedData.status}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-900 text-left">
              <strong>Next Steps:</strong> The Admissions Committee will review your academic transcript and eligibility. You can track real-time progress using your Application Number and Email.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={`/admissions/status?app=${submittedData.applicationNumber}&email=${encodeURIComponent(
                  submittedData.applicant?.email,
                )}`}
                className="w-full sm:w-auto px-6 py-3 bg-[#f43f85] hover:bg-pink-600 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-2"
              >
                <span>Track Application Real-Time</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/admissions"
                className="w-full sm:w-auto px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Admissions Dashboard
              </Link>
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
