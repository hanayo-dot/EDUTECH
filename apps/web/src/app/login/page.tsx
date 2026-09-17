'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import {
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          password,
          totpCode: requiresMfa ? totpCode : undefined,
        }),
      });

      if (res.data.requiresMfa) {
        setRequiresMfa(true);
      } else {
        if (res.data.accessToken) {
          localStorage.setItem('accessToken', res.data.accessToken);
        }
        setSuccessUser(res.data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (idVal: string, passVal: string) => {
    setIdentifier(idVal);
    setPassword(passVal);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Return link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 px-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-teal-600 hover:text-teal-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Attendance Dashboard
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Stylized Brand Logo */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ec4899] via-[#f43f85] to-[#06b6d4] p-[2px] shadow-sm mb-3">
          <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-[#f43f85]">
              <path
                d="M17 8C17 5.79086 15.2091 4 13 4H9C6.79086 4 5 5.79086 5 8C5 10.2091 6.79086 12 9 12H15C17.2091 12 19 13.7909 19 16C19 18.2091 17.2091 20 15 20H11C8.79086 20 7 18.2091 7 16"
                stroke="url(#brandGrad)"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="brandGrad" x1="5" y1="4" x2="19" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f43f85" />
                  <stop offset="0.6" stopColor="#ec4899" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          ChuoMS Enterprise CMS
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Sign in to your institutional account (Students, Faculty & Staff)
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.06)] border border-slate-100 rounded-3xl sm:px-10">
          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successUser ? (
            <div className="text-center py-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                Welcome, {successUser.firstName} {successUser.lastName}!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Active Roles: {successUser.roles.join(', ')}
              </p>
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                Session authenticated via secure HTTP-only cookies and Bearer token.
              </div>
              <div className="mt-6 flex flex-col space-y-2">
                <Link
                  href="/"
                  className="inline-flex justify-center items-center px-4 py-2.5 rounded-xl bg-[#f43f85] hover:bg-pink-600 font-semibold text-white shadow-sm transition text-xs"
                >
                  Enter Attendance Dashboard <ArrowRight className="ml-2 w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/curriculum"
                  className="inline-flex justify-center items-center px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 transition text-xs"
                >
                  Curriculum & Multi-Campus Portal
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!requiresMfa ? (
                <>
                  <div>
                    <label
                      htmlFor="identifier"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Username, Email, Admission No, or Staff No
                    </label>
                    <div className="relative rounded-xl">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        id="identifier"
                        name="identifier"
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. admin@chuoms.edu or ADM-2026-0001"
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Password
                    </label>
                    <div className="relative rounded-xl">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label
                    htmlFor="totp"
                    className="block text-xs font-semibold text-teal-700 mb-1"
                  >
                    Two-Factor Authentication Code (6 digits)
                  </label>
                  <input
                    id="totp"
                    name="totp"
                    type="text"
                    required
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="123456"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-teal-300 rounded-xl text-slate-900 text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-sm text-xs font-bold text-white bg-[#f43f85] hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 transition"
              >
                {loading ? 'Authenticating...' : requiresMfa ? 'Verify 2FA Token' : 'Sign In'}
                {!loading && <ArrowRight className="ml-2 w-3.5 h-3.5" />}
              </button>
            </form>
          )}

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Quick-Fill Verified Demo Accounts:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@chuoms.edu', 'Password@2026!')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-left transition"
              >
                👑 <strong>Super Admin</strong>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('registrar@chuoms.edu', 'Password@2026!')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-left transition"
              >
                📜 <strong>Registrar</strong>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('dr.smith@chuoms.edu', 'Password@2026!')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-left transition"
              >
                👨‍🏫 <strong>Lecturer</strong>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('ADM-2026-0001', 'Password@2026!')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-left transition"
              >
                🎓 <strong>Student (Alice)</strong>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
