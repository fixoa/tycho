/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        ink: {
          1: 'var(--ink-1)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
        },
        line: {
          1: 'var(--line-1)',
          2: 'var(--line-2)',
        },
        bar: { 0: 'var(--bar-0)', 1: 'var(--bar-1)' },
        accent: 'var(--accent)',
        'accent-strong': 'var(--accent-strong)',
        series: {
          1: 'var(--series-1)',
          2: 'var(--series-2)',
          3: 'var(--series-3)',
          4: 'var(--series-4)',
          5: 'var(--series-5)',
          6: 'var(--series-6)',
          7: 'var(--series-7)',
          8: 'var(--series-8)',
        },
        status: {
          good: '#3dcc91',
          warning: '#ffb366',
          serious: '#ff9980',
          critical: '#ff7373',
        },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 0 0 1px var(--line-2)',
      },
      borderRadius: {
        DEFAULT: '3px',
      },
    },
  },
  plugins: [],
}
