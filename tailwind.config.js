/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      // Brand color correction: this app used Tailwind's stock "emerald" (green) as its
      // primary accent throughout (2000+ class instances across 221 files). The brand is
      // maroon (matches the V12 logo's chrome/maroon-glow identity), not green. Rather than
      // hand-edit every file, this overrides the emerald *scale* itself - every existing
      // bg-emerald-500, text-emerald-400, border-emerald-500/20, etc. now resolves to a
      // maroon value automatically. Same technique applied to "sky" (was used for one-off
      // blue accents in a few places) is not needed; only emerald was the primary brand color.
      colors: {
        emerald: {
          50:  '#fdf2f3',
          100: '#fce4e6',
          200: '#f9c9cf',
          300: '#f3a0ab',
          400: '#ff3357', // matches --maroon-bright from the V12 logo-derived palette
          450: '#d43655',
          500: '#c81e3a', // matches --maroon from the V12 logo-derived palette
          600: '#a3182f',
          700: '#7a0f22', // matches --maroon-soft
          800: '#5c0a1a',
          900: '#2c0510', // matches --maroon-deep
          950: '#1c0309',
        },
        // Secondary accent correction: pink was used throughout fan/social/quest features as
        // a distinct third accent color. Brief calls for maroon (primary) + grayish (secondary)
        // only, so this maps the pink scale onto zinc-equivalent grays.
        pink: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
      },
    },
  },
  plugins: [],
}
