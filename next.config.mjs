/**
 * next.config.mjs — Next.js Configuration
 *
 * WHAT IS THIS FILE?
 * This is the configuration file for your Next.js application.
 * Next.js reads this file when it starts up (dev server or build).
 *
 * WHY .mjs INSTEAD OF .ts?
 * Next.js 14 supports .js and .mjs config files. The .mjs extension means
 * "ES Module" — it uses the modern `import`/`export` syntax instead of
 * the older `require()`/`module.exports` syntax.
 *
 * WHAT ARE SECURITY HEADERS?
 * HTTP security headers are instructions your server sends to the browser
 * telling it how to behave for security purposes. Each one protects against
 * a specific type of web attack.
 */

/** @type {import('next').NextConfig} */

// These headers are added to EVERY response from our server.
const securityHeaders = [
  {
    // HSTS — Forces browsers to always use HTTPS (never HTTP) for 2 years.
    // This prevents "downgrade attacks" where someone intercepts HTTP traffic.
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // Prevents browsers from "guessing" file types.
    // Without this, a browser might execute a malicious file disguised as an image.
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Prevents your site from being embedded in an <iframe> on another site.
    // This stops "clickjacking" — where attackers trick users into clicking hidden buttons.
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Controls how much URL info is shared when users click links to other sites.
    // "strict-origin-when-cross-origin" shares only the domain, not the full path.
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
]

const nextConfig = {
  // async headers() attaches HTTP headers to responses for matching routes.
  // '/:path*' matches ALL routes in the application.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
