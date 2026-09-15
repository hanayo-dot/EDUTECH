'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { ShieldCheck, Lock, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          ChuoMS Enterprise CMS
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to your institutional portal (Students, Faculty & Staff)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-sm flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successUser ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Welcome, {successUser.firstName} {successUser.lastName}!
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Roles: {successUser.roles.join(', ')}
              </p>
              <div className="mt-6 p-3 rounded-lg bg-slate-900/60 border border-slate-700 text-xs text-slate-300">
                Session authenticated via secure HTTP-only cookies and Bearer token.
              </div>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/curriculum"
                  className="inline-flex items-center px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 font-semibold text-white shadow-lg transition text-sm"
                >
                  Enter Institutional Structure & Curriculum Portal <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {!requiresMfa ? (
                <>
                  <div>
                    <label
                      htmlFor="identifier"
                      className="block text-sm font-medium text-slate-300"
                    >
                      Username, Email, Admission No, or Staff No
                    </label>
                    <div className="mt-1.5 relative rounded-lg shadow-sm">
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
                        placeholder="e.g. ADM-2026-0001 or admin@chuoms.edu"
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-300"
                    >
                      Password
                    </label>
                    <div className="mt-1.5 relative rounded-lg shadow-sm">
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
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label
                    htmlFor="totp"
                    className="block text-sm font-medium text-sky-400"
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
                    className="mt-1.5 block w-full px-4 py-3 bg-slate-900/70 border border-sky-500 rounded-lg text-white placeholder-slate-500 text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition"
              >
                {loading ? 'Authenticating...' : requiresMfa ? 'Verify 2FA Token' : 'Sign In'}
                {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Quick Demo Fill Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Quick-Fill Verified Demo Accounts:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@chuoms.edu', 'Password@2026!')}
                className="p-2 rounded bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700 text-slate-300 text-left transition"
              >
                👑 <strong>Super Admin</strong>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('registrar@chuoms.edu', 'Password@2026!')}
                className="p-2 rounded bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700 text-slate-300 text-left transition"
              >
                📜 <strong>Registrar</strong>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('dr.smith@chuoms.edu', 'Password@2026!')}
                className="p-2 rounded bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700 text-slate-300 text-left transition"
              >
                👨‍🏫 <strong>Lecturer</strong>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('ADM-2026-0001', 'Password@2026!')}
                className="p-2 rounded bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700 text-slate-300 text-left transition"
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
