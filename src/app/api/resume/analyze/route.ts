/**
 * src/app/api/resume/analyze/route.ts
 *
 * WHAT IS THIS FILE?
 * This is a Next.js API Route — a server-side endpoint that runs on the server,
 * never in the browser. The browser calls this URL (POST /api/resume/analyze)
 * and this code runs, processes the resume, and returns a JSON response.
 *
 * WHY SERVER-SIDE?
 * - Your OpenAI API key must NEVER be exposed to the browser (anyone could steal it)
 * - PDF/DOCX parsing libraries run in Node.js, not in browsers
 * - All sensitive logic stays on the server
 *
 * FLOW:
 * 1. Browser sends a multipart form with the uploaded file
 * 2. This route extracts the text from PDF or DOCX
 * 3. Sends the text to OpenAI (or returns mock data if no key)
 * 4. Returns structured JSON: score, strengths, weaknesses, missing skills, suggestions
 */

import { NextRequest, NextResponse } from 'next/server'

// ─── Types ────────────────────────────────────────────────────────────────────

// This is the shape of the JSON we return to the browser.
// TypeScript interfaces let us define exactly what fields exist and their types.
export interface ResumeAnalysisResult {
  score: number           // 0–100 overall resume quality score
  strengths: string[]     // things the resume does well
  weaknesses: string[]    // areas that need improvement
  missingSkills: string[] // skills commonly expected but not found
  suggestions: string[]   // specific, actionable improvement tips
  extractedText: string   // the raw text we pulled from the file (for transparency)
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

/**
 * getMockAnalysis()
 *
 * Returns realistic-looking fake analysis data.
 * Used when OPENAI_API_KEY is not set in .env.local — so you can develop
 * and test the UI without spending API credits.
 *
 * WHY MOCK DATA?
 * During development you often want to test the UI without hitting real APIs.
 * Mock data lets you see exactly how the results will look without any cost.
 */
function getMockAnalysis(extractedText: string): ResumeAnalysisResult {
  return {
    score: 72,
    strengths: [
      'Clear and concise work experience descriptions',
      'Quantified achievements with specific metrics (e.g., "increased sales by 30%")',
      'Relevant technical skills section is well-organized',
      'Education section is properly formatted with graduation dates',
    ],
    weaknesses: [
      'Professional summary is too generic — lacks a specific value proposition',
      'No mention of soft skills or leadership experience',
      'Job descriptions use passive voice instead of strong action verbs',
      'Missing links to portfolio, GitHub, or LinkedIn profile',
    ],
    missingSkills: [
      'Cloud platforms (AWS, GCP, or Azure)',
      'CI/CD pipelines (GitHub Actions, Jenkins)',
      'Agile/Scrum methodology',
      'System design experience',
      'TypeScript (only JavaScript mentioned)',
    ],
    suggestions: [
      'Rewrite your professional summary to target a specific role — e.g., "Full-stack engineer with 3 years building React/Node.js applications for fintech startups"',
      'Start each bullet point with a strong action verb: "Built", "Designed", "Led", "Reduced", "Increased"',
      'Add a Projects section showcasing 2–3 personal or open-source projects with GitHub links',
      'Include your LinkedIn URL and GitHub profile in the contact section',
      'Tailor your skills section to match keywords from the job description you\'re applying to',
      'Add a line about team size or scope for each role to show context (e.g., "Led a team of 4 engineers")',
    ],
    extractedText,
  }
}

// ─── Text Extraction ──────────────────────────────────────────────────────────

/**
 * extractTextFromFile()
 *
 * Reads the uploaded file buffer and extracts plain text from it.
 * Supports PDF (via pdf-parse) and DOCX (via mammoth).
 *
 * WHY DO WE NEED TEXT EXTRACTION?
 * OpenAI can't read binary file formats like PDF or DOCX directly.
 * We need to convert them to plain text first, then send that text to the AI.
 *
 * @param buffer - The raw file bytes
 * @param mimeType - The file type (e.g., "application/pdf")
 * @returns The extracted plain text string
 */
async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    // pdf-parse reads the binary PDF buffer and returns an object with a .text property
    // We use dynamic import because pdf-parse has some quirks with Next.js static analysis
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text.trim()
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    // mammoth converts DOCX files to plain text
    // It strips all formatting and returns just the words
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value.trim()
  }

  // Plain text files — just decode the bytes as UTF-8 text
  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8').trim()
  }

  throw new Error(`Unsupported file type: ${mimeType}. Please upload a PDF, DOCX, or TXT file.`)
}

// ─── OpenAI Analysis ──────────────────────────────────────────────────────────

/**
 * analyzeWithOpenAI()
 *
 * Sends the resume text to OpenAI's GPT model and asks it to analyze the resume.
 *
 * WHAT IS A "PROMPT"?
 * A prompt is the instruction we give to the AI. We tell it:
 * 1. What role to play (a professional resume reviewer)
 * 2. What to analyze (the resume text)
 * 3. Exactly what format to return the answer in (JSON)
 *
 * WHY JSON FORMAT?
 * We ask the AI to respond in JSON so we can reliably parse the response
 * into structured data. If we asked for plain text, parsing would be fragile.
 *
 * @param resumeText - The plain text extracted from the resume
 * @returns Structured analysis result
 */
async function analyzeWithOpenAI(resumeText: string): Promise<ResumeAnalysisResult> {
  // Dynamically import OpenAI — only runs on the server
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const prompt = `You are an expert resume reviewer and career coach with 15+ years of experience in technical recruiting.

Analyze the following resume and provide a detailed, honest assessment.

RESUME TEXT:
---
${resumeText.slice(0, 8000)}
---

Respond with ONLY a valid JSON object in this exact format (no markdown, no explanation, just JSON):
{
  "score": <integer 0-100 representing overall resume quality>,
  "strengths": [<3-5 specific strengths as strings>],
  "weaknesses": [<3-5 specific weaknesses as strings>],
  "missingSkills": [<3-6 skills commonly expected for this type of role that are missing>],
  "suggestions": [<4-6 specific, actionable improvement suggestions as strings>]
}`

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',  // Fast and cost-effective model — good for structured analysis
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    // response_format tells OpenAI to always return valid JSON
    // This prevents the AI from adding markdown code blocks or extra text
    response_format: { type: 'json_object' },
    temperature: 0.3,  // Lower temperature = more consistent, focused responses
    max_tokens: 1500,
  })

  // Extract the text content from the API response
  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI returned an empty response')
  }

  // Parse the JSON string into a JavaScript object
  const parsed = JSON.parse(content)

  return {
    score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    extractedText: resumeText,
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

/**
 * POST /api/resume/analyze
 *
 * This is the main handler function. Next.js calls this when the browser
 * sends a POST request to /api/resume/analyze.
 *
 * WHAT IS FormData?
 * When a browser uploads a file, it sends it as "multipart/form-data" —
 * a special encoding that can carry both text fields and binary file data.
 * Next.js gives us request.formData() to read it.
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Read the uploaded file from the form data
    const formData = await request.formData()
    const file = formData.get('resume') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please select a PDF, DOCX, or TXT file.' },
        { status: 400 }  // 400 = Bad Request
      )
    }

    // Step 2: Validate file size (max 5 MB)
    const MAX_SIZE = 5 * 1024 * 1024  // 5 MB in bytes
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 5 MB.` },
        { status: 400 }
      )
    }

    // Step 3: Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.' },
        { status: 400 }
      )
    }

    // Step 4: Convert the File object to a Node.js Buffer for processing
    // File.arrayBuffer() gives us the raw bytes; Buffer.from() wraps them
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Step 5: Extract plain text from the file
    let extractedText: string
    try {
      extractedText = await extractTextFromFile(buffer, file.type)
    } catch (extractError) {
      return NextResponse.json(
        { error: `Could not read file: ${extractError instanceof Error ? extractError.message : 'Unknown error'}` },
        { status: 422 }  // 422 = Unprocessable Entity
      )
    }

    // Step 6: Check if we have enough text to analyze
    if (extractedText.length < 50) {
      return NextResponse.json(
        { error: 'The file appears to be empty or contains very little text. Please upload a complete resume.' },
        { status: 422 }
      )
    }

    // Step 7: Analyze the resume
    // If OPENAI_API_KEY is set → use real AI analysis
    // If not set → return mock data (useful for development/testing)
    let result: ResumeAnalysisResult

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-replace-with-your-real-openai-api-key') {
      result = await analyzeWithOpenAI(extractedText)
    } else {
      // No API key — use mock data so the UI still works during development
      console.log('[Resume API] No OpenAI API key found — returning mock analysis data')
      result = getMockAnalysis(extractedText)
    }

    // Step 8: Return the result as JSON
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    // Catch any unexpected errors and return a safe error message
    // We log the full error on the server but only send a generic message to the browser
    // (never expose internal error details to users — security best practice)
    console.error('[Resume API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while analyzing your resume. Please try again.' },
      { status: 500 }  // 500 = Internal Server Error
    )
  }
}
