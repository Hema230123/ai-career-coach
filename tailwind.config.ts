/**
 * tailwind.config.ts
 *
 * WHAT IS THIS FILE?
 * This is the configuration file for Tailwind CSS — the styling library we use.
 *
 * WHAT IS TAILWIND CSS?
 * Instead of writing separate CSS files, Tailwind gives you small utility classes
 * you apply directly in your HTML/JSX. For example:
 *   - `className="text-blue-500"` makes text blue
 *   - `className="p-4"` adds padding
 *   - `className="flex items-center"` makes a flex container
 *
 * WHY THE `content` ARRAY?
 * Tailwind scans your source files to find which utility classes you actually use,
 * then generates ONLY those CSS classes. This keeps your final CSS bundle tiny.
 * The `content` array tells Tailwind WHERE to look for class names.
 */

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    // Scan all TypeScript, JavaScript, and JSX/TSX files inside src/
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // You can add custom colors, fonts, spacing, etc. here later.
      // For example:
      // colors: {
      //   brand: '#6366f1',
      // }
    },
  },
  plugins: [
    // Tailwind plugins (like @tailwindcss/forms) can be added here later.
  ],
}

export default config
