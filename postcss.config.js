/**
 * postcss.config.js
 *
 * WHAT IS THIS FILE?
 * PostCSS is a tool that transforms CSS using JavaScript plugins.
 * Think of it as a "build step" for your CSS files.
 *
 * WHY DO WE NEED IT?
 * Tailwind CSS is actually a PostCSS plugin. When Next.js builds your app,
 * it runs PostCSS on your CSS files, which triggers Tailwind to generate
 * all the utility classes you used.
 *
 * WHAT DO THESE PLUGINS DO?
 * - tailwindcss: Generates the Tailwind utility classes
 * - autoprefixer: Automatically adds browser vendor prefixes to CSS properties
 *   (e.g., adds -webkit- prefix for Safari compatibility)
 *
 * You almost never need to change this file.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
