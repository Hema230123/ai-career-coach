/**
 * src/app/dashboard/page.tsx — Dashboard Page
 *
 * This is the main dashboard. It shows quick-access cards to all features.
 * The Resume Review card links to /resume where the full feature lives.
 */

import Link from 'next/link'

// Feature cards shown on the dashboard
const features = [
  {
    href: '/resume',
    icon: '📄',
    title: 'Resume Review',
    description: 'Upload your resume and get an AI-powered score with strengths, weaknesses, and improvement tips.',
    color: 'from-indigo-500/20 to-indigo-600/10',
    border: 'border-indigo-500/30',
    badge: 'Ready',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    href: '#',
    icon: '💬',
    title: 'Career Guidance',
    description: 'Chat with an AI career advisor for personalized guidance on your career path.',
    color: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
    badge: 'Coming soon',
    badgeColor: 'bg-slate-700 text-slate-400',
  },
  {
    href: '#',
    icon: '🎤',
    title: 'Interview Prep',
    description: 'Practice mock interviews with AI feedback on your answers.',
    color: 'from-pink-500/20 to-pink-600/10',
    border: 'border-pink-500/30',
    badge: 'Coming soon',
    badgeColor: 'bg-slate-700 text-slate-400',
  },
  {
    href: '#',
    icon: '🔍',
    title: 'Job Search',
    description: 'Find relevant job listings and see how well your profile matches each role.',
    color: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/30',
    badge: 'Coming soon',
    badgeColor: 'bg-slate-700 text-slate-400',
  },
  {
    href: '#',
    icon: '📊',
    title: 'Skill Gap Analysis',
    description: 'Discover which skills you need to reach your target role.',
    color: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30',
    badge: 'Coming soon',
    badgeColor: 'bg-slate-700 text-slate-400',
  },
]

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🎯</span>
            <span className="font-bold text-white">AI Career Coach</span>
          </div>
          <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
            v0.1 — Foundation
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome back 👋
          </h1>
          <p className="text-slate-400">
            Your AI-powered career development platform. Start with Resume Review — it&apos;s ready to use.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Resume Score', value: '—', color: 'text-indigo-400', note: 'Upload to get score' },
            { label: 'Jobs Applied', value: '0', color: 'text-blue-400', note: 'Track applications' },
            { label: 'Skill Progress', value: '—', color: 'text-pink-400', note: 'Run gap analysis' },
            { label: 'AI Sessions', value: '0', color: 'text-yellow-400', note: 'Sessions used' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-600 mt-1">{stat.note}</p>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => {
            const isReady = feature.badge === 'Ready'
            const CardWrapper = isReady ? Link : 'div'
            const wrapperProps = isReady ? { href: feature.href } : {}

            return (
              // @ts-expect-error — dynamic tag between Link and div
              <CardWrapper
                key={feature.title}
                {...wrapperProps}
                className={`
                  block rounded-xl border p-5 bg-gradient-to-br ${feature.color} ${feature.border}
                  ${isReady
                    ? 'hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900'
                    : 'opacity-60 cursor-default'
                  }
                `}
                aria-label={isReady ? `Go to ${feature.title}` : `${feature.title} — coming soon`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl" aria-hidden="true">{feature.icon}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${feature.badgeColor}`}>
                    {feature.badge}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </CardWrapper>
            )
          })}
        </div>
      </div>
    </main>
  )
}
