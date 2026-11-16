/** @type {import('tailwindcss').Config} */

// Цвет из CSS-переменной в формате "R G B" — поддерживает прозрачность (bg-accent/10)
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Палитра «Ночное золото»: значения задаются в src/theme/theme.ts
      // для светлой и тёмной темы. Золото (accent) — только заливкой; текстовый акцент — link.
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        raised: token('raised'),
        line: token('border'),
        fg: token('text'),
        muted: token('text-secondary'),
        accent: token('accent'),
        'on-accent': token('on-accent'),
        link: token('link'),
        violet: token('violet'),
        chart: token('chart'),
        third: token('third'),
        'accent-2': token('accent-2'),
        positive: token('positive'),
        negative: token('negative'),
        info: token('info'),

        // Старые фирменные цвета — ещё используются в экранах, которые не переведены на новую систему
        'tyrex-dark-black': '#0A0A0A',
        'tyrex-graphite': '#1C1C1C',
        'tyrex-gold-metallic': '#D4A849',
        'tyrex-ultra-gold-glow': '#FFCB47',
        tg: {
          bg: 'var(--tg-theme-bg-color, #0A0A0A)',
          text: 'var(--tg-theme-text-color, #FFFFFF)',
          hint: 'var(--tg-theme-hint-color, #1C1C1C)',
          link: 'var(--tg-theme-link-color)',
          button: 'var(--tg-theme-button-color, #D4A849)',
          'button-text': 'var(--tg-theme-button-text-color)',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Roboto', 'Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'Consolas', '"Roboto Mono"', 'monospace'],
      },
      // Типографика в rem: растёт вместе с системным размером шрифта
      fontSize: {
        display: ['2.125rem', { lineHeight: '2.5rem', fontWeight: '600' }],   // 34/40
        title: ['1.375rem', { lineHeight: '1.75rem', fontWeight: '600' }],    // 22/28
        headline: ['1.0625rem', { lineHeight: '1.375rem', fontWeight: '600' }], // 17/22
        body: ['0.9375rem', { lineHeight: '1.25rem' }],                        // 15/20
        callout: ['0.8125rem', { lineHeight: '1.125rem' }],                    // 13/18
        caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],       // 12/16 — меньше не бывает
      },
      borderRadius: {
        card: '16px',
        control: '12px',
        sheet: '20px',
      },
      maxWidth: {
        app: '480px',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      boxShadow: {
        'gold-glow': '0 0 10px rgba(255, 203, 71, 0.6)',
      },
    },
  },
  plugins: [],
}
