'use client'

/**
 * src/app/resume/page.tsx — Resume Review Page
 *
 * WHAT IS 'use client'?
 * By default, Next.js renders components on the server (Server Components).
 * Adding 'use client' at the top tells Next.js: "This component needs to run
 * in the browser because it uses interactivity."
 *
 * WHY DO WE NEED 'use client' HERE?
 * This page uses:
 * - useState: to track uploaded file, loading state, and results
 * - useRef: to reference the hidden file input element
 * - Event handlers: onClick, onChange, onDragOver, onDrop
 * All of these are browser-only features — they don't exist on the server.
 *
 * PAGE FLOW:
 * 1. User drags/drops or clicks to upload a PDF, DOCX, or TXT file
 * 2. We send the file to POST /api/resume/analyze
 * 3. The server extracts text and calls OpenAI (or returns mock data)
 * 4. We display the results: score, strengths, weaknesses, missing skills, suggestions
 */

import { useState, useRef, useCallback } from 'react'
import type { ResumeAnalysisResult } from '@/app/api/resume/analyze/route'

// ─── Score Color Helper ───────────────────────────────────────────────────────

/**
 * Returns a Tailwind color class based on the score value.
 * This makes the score visually meaningful at a glance.
 */
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return 'stroke-emerald-400'
  if (score >= 60) return 'stroke-yellow-400'
  return 'stroke-red-400'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Strong Resume'
  if (score >= 60) return 'Needs Improvement'
  return 'Significant Work Needed'
}

// ─── Score Ring Component ─────────────────────────────────────────────────────

/**
 * ScoreRing renders an animated circular progress indicator.
 *
 * HOW DOES THE SVG CIRCLE ANIMATION WORK?
 * We use SVG (Scalable Vector Graphics) to draw a circle.
 * The trick is `strokeDasharray` and `strokeDashoffset`:
 * - strokeDasharray sets the total length of the dashes
 * - strokeDashoffset shifts the dash pattern, effectively "hiding" part of the circle
 * - By setting offset = circumference * (1 - score/100), we show only the filled portion
 */
function ScoreRing({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
        {/* Background circle (gray track) */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-700"
        />
        {/* Foreground circle (colored progress) */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${getScoreRingColor(score)} transition-all duration-1000 ease-out`}
        />
      </svg>
      {/* Score number in the center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
        <span className="text-xs text-slate-400 mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

// ─── Result Section Component ─────────────────────────────────────────────────

/**
 * ResultSection renders a titled list of items (strengths, weaknesses, etc.)
 * with a colored icon bullet for each item.
 */
function ResultSection({
  title,
  items,
  icon,
  itemColor,
  bgColor,
  borderColor,
}: {
  title: string
  items: string[]
  icon: string
  itemColor: string
  bgColor: string
  borderColor: string
}) {
  if (items.length === 0) return null

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-5`}>
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span aria-hidden="true">{icon}</span>
        {title}
        <span className="ml-auto text-xs font-normal text-slate-500 normal-case tracking-normal">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </h3>
      <ul className="space-y-2" role="list">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2.5 text-sm text-slate-300">
            <span className={`mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${itemColor} mt-1.5`} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function ResumePage() {
  // STATE — React's useState hook stores values that, when changed, cause the UI to re-render
  const [file, setFile] = useState<File | null>(null)           // The selected file
  const [isDragging, setIsDragging] = useState(false)           // Is user dragging a file over the dropzone?
  const [isLoading, setIsLoading] = useState(false)             // Is the API call in progress?
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null)  // Analysis results
  const [error, setError] = useState<string | null>(null)       // Error message if something went wrong
  const [showExtractedText, setShowExtractedText] = useState(false)  // Toggle for raw text preview

  // useRef gives us a direct reference to a DOM element.
  // We use it to programmatically click the hidden file input when the user
  // clicks the dropzone — because we can't style <input type="file"> nicely.
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── File Validation ─────────────────────────────────────────────────────

  const validateFile = (f: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ]
    if (!allowedTypes.includes(f.type)) {
      return 'Please upload a PDF, DOCX, or TXT file.'
    }
    if (f.size > 5 * 1024 * 1024) {
      return `File is too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 5 MB.`
    }
    return null
  }

  const handleFileSelect = (f: File) => {
    const validationError = validateFile(f)
    if (validationError) {
      setError(validationError)
      setFile(null)
      return
    }
    setFile(f)
    setError(null)
    setResult(null)  // Clear previous results when a new file is selected
  }

  // ─── Drag and Drop Handlers ───────────────────────────────────────────────

  // useCallback memoizes the function so it doesn't get recreated on every render
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()  // Required to allow dropping
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }, [])

  // ─── File Input Change Handler ────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) handleFileSelect(selectedFile)
  }

  // ─── Submit Handler ───────────────────────────────────────────────────────

  /**
   * handleAnalyze sends the file to the API and handles the response.
   *
   * WHAT IS FormData?
   * FormData is a browser API for building multipart/form-data requests —
   * the format used for file uploads. We append the file to it and send it
   * with fetch().
   *
   * WHAT IS fetch()?
   * fetch() is the browser's built-in function for making HTTP requests.
   * It returns a Promise — an object representing a future value.
   * We use `await` to wait for the Promise to resolve.
   */
  const handleAnalyze = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Build the form data payload with the file
      const formData = new FormData()
      formData.append('resume', file)

      // Send the file to our API route
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        body: formData,
        // Note: Do NOT set Content-Type header manually for FormData —
        // the browser sets it automatically with the correct boundary string
      })

      const data = await response.json()

      if (!response.ok) {
        // The server returned an error (4xx or 5xx status code)
        setError(data.error || 'Analysis failed. Please try again.')
        return
      }

      setResult(data as ResumeAnalysisResult)
    } catch (err) {
      // Network error (no internet, server down, etc.)
      setError('Could not connect to the server. Please check your connection and try again.')
      console.error('Resume analysis error:', err)
    } finally {
      // `finally` runs whether the try succeeded or failed
      // Always reset loading state when done
      setIsLoading(false)
    }
  }

  // ─── Reset Handler ────────────────────────────────────────────────────────

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setIsLoading(false)
    setShowExtractedText(false)
    // Reset the file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      {/* Page header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <a
            href="/dashboard"
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5"
            aria-label="Back to dashboard"
          >
            ← Dashboard
          </a>
          <span className="text-slate-700" aria-hidden="true">/</span>
          <h1 className="text-white font-semibold flex items-center gap-2">
            <span aria-hidden="true">📄</span>
            Resume Review
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Intro */}
        <div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Upload your resume and get instant AI-powered feedback — including a quality score,
            strengths, weaknesses, missing skills, and specific improvement suggestions.
          </p>
        </div>

        {/* Upload Section */}
        <section aria-labelledby="upload-heading">
          <h2 id="upload-heading" className="text-lg font-semibold text-white mb-4">
            Upload Your Resume
          </h2>

          {/* Dropzone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload resume file — click or drag and drop"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? fileInputRef.current?.click() : null}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900
              ${isDragging
                ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                : file
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
              }
            `}
          >
            {/* Hidden file input — triggered programmatically */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={handleInputChange}
              className="sr-only"  // sr-only hides it visually but keeps it accessible to screen readers
              aria-label="Resume file input"
            />

            {file ? (
              /* File selected state */
              <div className="space-y-2">
                <div className="text-4xl" aria-hidden="true">✅</div>
                <p className="text-emerald-400 font-medium">{file.name}</p>
                <p className="text-slate-500 text-sm">
                  {(file.size / 1024).toFixed(0)} KB · {file.type.includes('pdf') ? 'PDF' : file.type.includes('word') ? 'DOCX' : 'TXT'}
                </p>
                <p className="text-slate-500 text-xs mt-2">Click to change file</p>
              </div>
            ) : (
              /* Empty state */
              <div className="space-y-3">
                <div className="text-5xl" aria-hidden="true">
                  {isDragging ? '📂' : '📎'}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {isDragging ? 'Drop your resume here' : 'Drag & drop your resume'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    or <span className="text-indigo-400 underline">click to browse</span>
                  </p>
                </div>
                <p className="text-slate-600 text-xs">
                  Supports PDF, DOCX, TXT · Max 5 MB
                </p>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
            >
              <span aria-hidden="true" className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!file || isLoading}
              className="
                flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm
                bg-indigo-600 hover:bg-indigo-500 text-white
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900
              "
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  {/* Spinning loader */}
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing…
                </>
              ) : (
                <>
                  <span aria-hidden="true">🔍</span>
                  Analyze Resume
                </>
              )}
            </button>

            {(file || result) && (
              <button
                onClick={handleReset}
                className="px-4 py-2.5 rounded-lg font-medium text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Start Over
              </button>
            )}
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <section aria-live="polite" aria-label="Analysis in progress">
            <div className="bg-slate-800 rounded-xl p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" aria-hidden="true" />
              </div>
              <div>
                <p className="text-white font-medium">Analyzing your resume…</p>
                <p className="text-slate-400 text-sm mt-1">
                  Extracting text, evaluating content, and generating feedback
                </p>
              </div>
              {/* Animated progress steps */}
              <div className="flex justify-center gap-6 text-xs text-slate-500 mt-2">
                {['Extracting text', 'AI analysis', 'Generating report'].map((step, i) => (
                  <span key={step} className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse bg-indigo-400`}
                      style={{ animationDelay: `${i * 0.3}s` }}
                      aria-hidden="true"
                    />
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Results Section */}
        {result && !isLoading && (
          <section aria-labelledby="results-heading">
            <div className="flex items-center justify-between mb-6">
              <h2 id="results-heading" className="text-lg font-semibold text-white">
                Analysis Results
              </h2>
              {!process.env.NEXT_PUBLIC_HAS_OPENAI_KEY && (
                <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                  Demo data — add OpenAI key for real analysis
                </span>
              )}
            </div>

            {/* Score Card */}
            <div className="bg-slate-800 rounded-xl p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing score={result.score} />
              <div className="text-center sm:text-left">
                <p className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                  {getScoreLabel(result.score)}
                </p>
                <p className="text-slate-400 text-sm mt-1 max-w-sm">
                  Your resume scored <strong className={getScoreColor(result.score)}>{result.score}/100</strong>.{' '}
                  {result.score >= 80
                    ? 'Great work — a few tweaks could make it even stronger.'
                    : result.score >= 60
                      ? 'There\'s solid potential here. Address the suggestions below to improve your score.'
                      : 'This resume needs significant work before applying. Follow the suggestions below.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full">
                    {result.strengths.length} strengths
                  </span>
                  <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full">
                    {result.weaknesses.length} weaknesses
                  </span>
                  <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full">
                    {result.missingSkills.length} missing skills
                  </span>
                </div>
              </div>
            </div>

            {/* Result Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <ResultSection
                title="Strengths"
                items={result.strengths}
                icon="✅"
                itemColor="bg-emerald-400"
                bgColor="bg-emerald-500/5"
                borderColor="border-emerald-500/20"
              />
              <ResultSection
                title="Weaknesses"
                items={result.weaknesses}
                icon="⚠️"
                itemColor="bg-yellow-400"
                bgColor="bg-yellow-500/5"
                borderColor="border-yellow-500/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <ResultSection
                title="Missing Skills"
                items={result.missingSkills}
                icon="🎯"
                itemColor="bg-red-400"
                bgColor="bg-red-500/5"
                borderColor="border-red-500/20"
              />
              <ResultSection
                title="Improvement Suggestions"
                items={result.suggestions}
                icon="💡"
                itemColor="bg-indigo-400"
                bgColor="bg-indigo-500/5"
                borderColor="border-indigo-500/20"
              />
            </div>

            {/* Extracted Text Toggle */}
            <div className="mt-4">
              <button
                onClick={() => setShowExtractedText(!showExtractedText)}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 focus:outline-none focus:underline"
                aria-expanded={showExtractedText}
                aria-controls="extracted-text"
              >
                <span aria-hidden="true">{showExtractedText ? '▼' : '▶'}</span>
                {showExtractedText ? 'Hide' : 'Show'} extracted text
              </button>
              {showExtractedText && (
                <div
                  id="extracted-text"
                  className="mt-3 bg-slate-800/50 border border-slate-700 rounded-lg p-4 max-h-64 overflow-y-auto"
                >
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                    {result.extractedText || 'No text extracted.'}
                  </pre>
                </div>
              )}
            </div>

            {/* Analyze Another */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <button
                onClick={handleReset}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none focus:underline"
              >
                ← Analyze another resume
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
