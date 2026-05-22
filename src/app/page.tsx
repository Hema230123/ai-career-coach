/**
 * src/app/page.tsx — Landing Page (route: "/")
 *
 * WHAT IS THIS FILE?
 * In Next.js App Router, every folder inside `src/app/` that contains a
 * `page.tsx` file becomes a URL route. This file is at the root, so it
 * handles the "/" route — the homepage.
 *
 * This is a simple landing page. Later we'll add authentication so
 * unauthenticated users land here, and logged-in users go straight to /dashboard.
 *
 * WHY IS IT A SERVER COMPONENT?
 * There's no 'use client' directive at the top, which means this is a
 * React Server Component. It renders on the server and sends plain HTML
 * to the browser — faster initial load, better SEO.
 * We only need 'use client' when we need interactivity (useState, onClick, etc.)
 */

import Link from 'next/link'

export default function HomePage() {
  return (
    /*
     * min-h-screen: makes the section at least as tall as the viewport
     * flex flex-col items-center justify-center: centers content vertically and horizontally
     * px-4: horizontal padding so text doesn't touch screen edges on mobile
     */
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-slate-900 to-slate-700">

      {/* Hero Section */}
      <div className="text-center max-w-2xl">

        {/* App icon / emoji */}
        <div className="text-6xl mb-6" role="img" aria-label="Career coaching">
          🎯
        </div>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          AI Career Coach
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-slate-300 mb-8">
          Your personalized AI-powered career development platform.
          Get guidance, review your resume, practice interviews, and close skill gaps.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10 text-sm">
          {[
            { icon: '💬', label: 'Career Guidance' },
            { icon: '📄', label: 'Resume Review' },
            { icon: '🎤', label: 'Interview Prep' },
            { icon: '🔍', label: 'Job Search' },
            { icon: '📊', label: 'Skill Gap Analysis' },
            { icon: '🚀', label: 'AI-Powered' },
          ].map((feature) => (
            <div
              key={feature.label}
              className="bg-white/10 rounded-lg px-3 py-2 text-white flex items-center gap-2"
            >
              <span aria-hidden="true">{feature.icon}</span>
              <span>{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Call-to-action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/*
           * Link from next/link is the correct way to navigate between pages in Next.js.
           * It's faster than a regular <a> tag because it prefetches the destination page.
           */}
          <Link
            href="/dashboard"
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/register"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-lg transition-colors border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-12 text-slate-500 text-sm">
        Built with Next.js · Tailwind CSS · OpenAI API
      </p>
    </main>
  )
}
