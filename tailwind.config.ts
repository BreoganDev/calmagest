import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    fontSize: {
      ...defaultTheme.fontSize,
      'xxs': ['0.75rem', { lineHeight: '1.2' }],
      xs: ['0.875rem', { lineHeight: '1.4' }],
      sm: ['1rem', { lineHeight: '1.5' }],
      base: ['1rem', { lineHeight: '1.6' }],
      lg: ['1.125rem', { lineHeight: '1.7' }],
      xl: ['1.25rem', { lineHeight: '1.7' }],
      '2xl': ['1.5rem', { lineHeight: '1.3' }],
      '3xl': ['1.875rem', { lineHeight: '1.2' }],
      '4xl': ['2.25rem', { lineHeight: '1.1' }],
      '5xl': ['3rem', { lineHeight: '1' }],
    },
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1200px'
      }
    },
    extend: {
      fontFamily: {
        sans: [
          'var(--font-nunito)',
          'Nunito',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif'
        ],
        app: [
          'var(--font-plus-jakarta)',
          'Plus Jakarta Sans',
          'var(--font-nunito)',
          'sans-serif'
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace'
        ]
      },
      colors: {
        rd: {
          rose: 'var(--rd-rose)',
          roseSoft: 'var(--rd-rose-soft)',
          nude: 'var(--rd-nude)',
          text: 'var(--rd-text)',
          ui: 'var(--rd-ui)',
          roseDeep: 'var(--rd-rose-deep)',
          calmGreen: 'var(--rd-calm-green)',
          luxe: 'var(--rd-luxe)',
          // Gray scale
          gray: {
            50: 'var(--rd-gray-50)',
            100: 'var(--rd-gray-100)',
            200: 'var(--rd-gray-200)',
            300: 'var(--rd-gray-300)',
            400: 'var(--rd-gray-400)',
            500: 'var(--rd-gray-500)',
            600: 'var(--rd-gray-600)',
            700: 'var(--rd-gray-700)',
            800: 'var(--rd-gray-800)',
            900: 'var(--rd-gray-900)',
          },
          // Semantic colors
          success: 'var(--rd-success)',
          successBg: 'var(--rd-success-bg)',
          warning: 'var(--rd-warning)',
          warningBg: 'var(--rd-warning-bg)',
          danger: 'var(--rd-danger)',
          dangerBg: 'var(--rd-danger-bg)',
          info: 'var(--rd-info)',
          infoBg: 'var(--rd-info-bg)',
        },
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        cardForeground: 'var(--card-foreground)',
        muted: 'var(--muted)',
        mutedForeground: 'var(--muted-foreground)',
        border: 'var(--border)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        'xs': 'var(--rd-radius-sm)',
        sm: 'var(--rd-radius-md)',
        DEFAULT: 'var(--rd-radius-lg)',
        lg: 'var(--rd-radius-xl)',
        xl: 'var(--rd-radius-2xl)',
        '2xl': 'var(--rd-radius-3xl)',
        '3xl': '2rem',
        full: 'var(--rd-radius-full)',
      },
      boxShadow: {
        xs: 'var(--rd-shadow-xs)',
        sm: 'var(--rd-shadow-sm)',
        DEFAULT: 'var(--rd-shadow-md)',
        md: 'var(--rd-shadow-md)',
        lg: 'var(--rd-shadow-lg)',
        xl: 'var(--rd-shadow-xl)',
        '2xl': '0 24px 64px 0 rgba(45, 45, 45, 0.14)',
        inner: 'var(--rd-shadow-inner)',
        soft: '0 8px 30px rgba(42,42,42,0.08)',
        elevated: 'var(--rd-shadow-lg)',
        float: 'var(--rd-shadow-xl)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.05), inset 0 1px 1px 0 rgba(255, 255, 255, 0.6)',
        'glass-hover': '0 12px 40px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        }
      },
      animation: {
        rise: 'rise 0.5s ease-out both',
        'fade-in': 'fadeIn 0.3s ease-out both',
        'slide-in': 'slideIn 0.3s ease-out both',
        'scale-in': 'scaleIn 0.3s ease-out both',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s infinite linear',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        'ease-out-quart': 'cubic-bezier(0.165, 0.84, 0.44, 1)',
        'ease-in-quart': 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
      }
    }
  },
  plugins: []
};

export default config;