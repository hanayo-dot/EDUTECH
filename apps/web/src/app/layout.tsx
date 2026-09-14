import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EduTech CMS — Enterprise College Management System',
  description:
    'Production-grade higher-education management platform serving multi-campus institutional operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
