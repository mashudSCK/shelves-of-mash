const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light mode (the day library)
        ivory: {
          DEFAULT: '#F4EFE6',
          dim: '#ECE5D6',
          deep: '#E3D9C5',
        },
        walnut: {
          DEFAULT: '#4A3526',
          light: '#5E4534',
          dark: '#382819',
        },
        forest: {
          DEFAULT: '#2C3D2E',
          light: '#3A4F3D',
          dark: '#1E2B20',
        },
        gold: {
          DEFAULT: '#C9A24B',
          light: '#D9B96E',
          dark: '#A9833A',
        },
        ink: '#2A2118',

        // Dark mode (the night library) — almost-black, warm
        nightshelf: {
          DEFAULT: '#16130F',
          raised: '#1E1A14',
          line: '#2C2620',
        },
        parchment: '#E8DFCE',

        // Semantic aliases, theme-aware via CSS vars set per-mode
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        border: 'var(--border)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
      },
      fontFamily: {
        serif: ['var(--font-display)', 'Georgia', ...fontFamily.serif],
        body: ['var(--font-body)', ...fontFamily.serif],
        mono: ['var(--font-mono)', ...fontFamily.mono],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
      },
      letterSpacing: {
        widest2: '0.18em',
      },
      maxWidth: {
        prose: '42rem',
        shelf: '68rem',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.625rem',
      },
      boxShadow: {
        spine: '2px 0 6px -2px rgba(0,0,0,0.25), inset -1px 0 0 0 rgba(0,0,0,0.15)',
        card: '0 1px 2px rgba(42,33,24,0.06), 0 4px 16px -4px rgba(42,33,24,0.10)',
      },
      keyframes: {
        'fade-settle': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'spine-lift': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-3px)' },
        },
      },
      animation: {
        'fade-settle': 'fade-settle 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      transitionTimingFunction: {
        settle: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
};
