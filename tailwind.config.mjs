/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/app/**/*.{js,jsx,ts,tsx}', './src/components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // FairPlan brand — designed to evoke civic trust + fairness, not generic SaaS.
        ink: {
          DEFAULT: '#0B1F3A', // deep navy — trust, authority
          soft: '#1E3252',
          subtle: '#475569',
        },
        fair: {
          DEFAULT: '#00C49A', // teal — action, fairness, forward motion
          dark: '#009776',
          light: '#7FF0D6',
        },
        warn: '#F59E0B',
        danger: '#DC2626',
        surface: {
          DEFAULT: '#FAFAF7', // warm off-white, less sterile than #FFF
          raised: '#FFFFFF',
          sunken: '#F1F1EC',
        },
        line: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,31,58,0.06), 0 8px 24px -8px rgba(11,31,58,0.10)',
        ring: '0 0 0 4px rgba(0,196,154,0.18)',
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};
