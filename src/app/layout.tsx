/**
 * src/app/layout.tsx — Root Layout
 *
 * WHAT IS THIS FILE?
 * In Next.js App Router, every route group needs a layout file.
 * This is the ROOT layout — it wraps EVERY page in the entire application.
 *
 * WHAT DOES IT DO?
 * It defines the outer HTML shell: the <html> tag, the <head> (via metadata),
 * and the <body> tag. Every page you visit will be rendered inside the
 * {children} slot here.
 *
 * WHY IS THIS IMPORTANT?
 * - It's the single place to import global CSS (globals.css)
 * - It's where you set the page title and description for SEO
 * - It's where you load fonts
 * - Anything here renders on EVERY page (like a global header or footer)
 *
 * WHAT IS `Metadata`?
 * Next.js uses the exported `metadata` object to automatically set
 * <title> and <meta description> tags in the HTML <head>.
 * This is important for SEO (search engines) and browser tab titles.
 *
 * WHAT IS `Inter`?
 * Inter is a clean, modern font from Google Fonts. `next/font/google`
 * downloads and optimizes it automatically — no external network request
 * needed at runtime, which makes the app faster.
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Load the Inter font with the Latin character subset.
// `variable` lets us use it as a CSS variable if needed later.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

// This metadata object is read by Next.js and injected into the HTML <head>.
// Every page inherits this as a default, but individual pages can override it.
export const metadata: Metadata = {
  title: {
    default: 'AI Career Coach',
    // Template: when a page sets its own title, it becomes "Page Title | AI Career Coach"
    template: '%s | AI Career Coach',
  },
  description:
    'Your personalized AI-powered career development platform. Get career guidance, resume feedback, interview practice, and skill gap analysis.',
}

// RootLayout is a React Server Component (no 'use client' needed).
// It receives `children` — whatever page is currently being visited.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // lang="en" helps screen readers and search engines understand the language
    <html lang="en" className={inter.variable}>
      {/*
       * The <body> uses the Inter font via the CSS variable.
       * `antialiased` is a Tailwind class that makes text look smoother on screens.
       * `bg-gray-50` gives the whole app a very light gray background.
       */}
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  )
}
