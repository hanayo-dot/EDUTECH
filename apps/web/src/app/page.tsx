import Link from 'next/link';
import { ShieldCheck, ArrowRight, GraduationCap, Users, Database } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">ChuoMS</h1>
            <p className="text-xs text-slate-400">Enterprise College Management System</p>
          </div>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-sm font-medium text-white shadow transition"
        >
          Institutional Login <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-20 text-center flex-1 flex flex-col justify-center items-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-6">
          Serving 10,000+ to 50,000+ Users Across Multi-Campus Networks
        </span>
        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
          Enterprise Academic & Financial Infrastructure
        </h2>
        <p className="mt-6 text-lg text-slate-400 max-w-2xl leading-relaxed">
          Production-grade, modular higher-education management platform with granular RBAC, multi-identifier authentication, precision decimal financial ledgering, and tamper-evident audit logging.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/curriculum"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold text-white shadow-lg transition"
          >
            Curriculum & Multi-Campus Portal <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 font-semibold text-slate-300 transition"
          >
            Sign In / Role Switcher
          </Link>
          <a
            href="http://localhost:4000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 font-semibold text-slate-300 transition"
          >
            <Database className="mr-2 w-5 h-5 text-sky-400" />
            OpenAPI Docs
          </a>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <GraduationCap className="w-8 h-8 text-sky-400 mb-3" />
            <h3 className="font-semibold text-white text-base">Complete Lifecycle</h3>
            <p className="text-xs text-slate-400 mt-1">From online admissions to academic advising, continuous grading, clearance, and alumni network.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Users className="w-8 h-8 text-sky-400 mb-3" />
            <h3 className="font-semibold text-white text-base">Granular RBAC</h3>
            <p className="text-xs text-slate-400 mt-1">28 institutional roles, 13 action primitives, and hierarchical scope constraints across physical campuses.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <ShieldCheck className="w-8 h-8 text-sky-400 mb-3" />
            <h3 className="font-semibold text-white text-base">Auditable & Tamper-Evident</h3>
            <p className="text-xs text-slate-400 mt-1">Append-only audit ledgering for sensitive financial transactions, grade publications, and privilege changes.</p>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-800/80 px-6 py-6 text-center text-xs text-slate-500">
        ChuoMS &bull; Production Enterprise College Management System &bull; PostgreSQL 16 &bull; NestJS 10 &bull; Next.js 14
      </footer>
    </main>
  );
}
