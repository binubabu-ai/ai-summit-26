import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Enable dark mode via class strategy (next-themes uses this)
  theme: {
    extend: {
      colors: {
        // Minimal Brand Colors - Monochromatic with subtle accent
        brand: {
          primary: '#000000',
          secondary: '#666666',
          accent: {
            DEFAULT: '#0A0A0A',
            subtle: '#1A1A1A',
            hover: '#2A2A2A',
          },
        },
        // Pure Neutrals - Cool Grays
        neutral: {
          0: '#FFFFFF',
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Dark Mode Specific
        dark: {
          bg: {
            primary: '#000000',
            secondary: '#0A0A0A',
            elevated: '#141414',
            card: '#1A1A1A',
          },
          border: '#262626',
          text: {
            primary: '#FFFFFF',
            secondary: '#A3A3A3',
            tertiary: '#737373',
          },
        },
        // Semantic Colors (minimal, desaturated)
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'xs': ['0.6875rem', { lineHeight: '0.9375rem' }],     // 9.625px (was 12px)
        'sm': ['0.8125rem', { lineHeight: '1.125rem' }],      // 11.375px (was 14px)
        'base': ['0.9375rem', { lineHeight: '1.375rem' }],    // 13.125px (was 16px)
        'lg': ['1.0625rem', { lineHeight: '1.5rem' }],        // 14.875px (was 18px)
        'xl': ['1.1875rem', { lineHeight: '1.625rem' }],      // 16.625px (was 20px)
        '2xl': ['1.375rem', { lineHeight: '1.875rem' }],      // 19.25px (was 24px)
        '3xl': ['1.75rem', { lineHeight: '2rem' }],           // 24.5px (was 30px)
        '4xl': ['2.125rem', { lineHeight: '2.375rem' }],      // 29.75px (was 36px)
        '5xl': ['2.75rem', { lineHeight: '1.16' }],           // 38.5px (was 48px)
        '6xl': ['3.5rem', { lineHeight: '1.16' }],            // 49px (was 60px)
        '7xl': ['4.25rem', { lineHeight: '1.16' }],           // 59.5px (was 72px)
        '8xl': ['5.5rem', { lineHeight: '1.16' }],            // 77px (was 96px)
        '9xl': ['7.5rem', { lineHeight: '1.16' }],            // 105px (was 128px)
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      borderRadius: {
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'DEFAULT': '0 2px 6px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 20px rgba(0, 0, 0, 0.1)',
        'xl': '0 12px 28px rgba(0, 0, 0, 0.12)',
        'minimal': '0 1px 0 rgba(0, 0, 0, 0.05)',
        'subtle': '0 0 0 1px rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'gradient-minimal': 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
        'gradient-dark-minimal': 'linear-gradient(180deg, #0A0A0A 0%, #000000 100%)',
        'gradient-subtle': 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, transparent 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} satisfies Config;
