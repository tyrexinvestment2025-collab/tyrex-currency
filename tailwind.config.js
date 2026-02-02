/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Фирменные цвета Tyrex
        'tyrex-dark-black': '#0A0A0A', // Dark Black
        'tyrex-graphite': '#1C1C1C',  // Graphite Gray
        'tyrex-gold-metallic': '#D4A849', // Gold Metallic
        'tyrex-ultra-gold-glow': '#FFCB47', // Ultra Gold Glow (для подсветки)

        // Адаптация под ТГ (для фона и текста, если нужно)
        tg: {
          bg: 'var(--tg-theme-bg-color, #0A0A0A)', // Используем Dark Black как дефолт
          text: 'var(--tg-theme-text-color, #FFFFFF)',
          hint: 'var(--tg-theme-hint-color, #1C1C1C)', // Используем Graphite Gray как дефолт
          link: 'var(--tg-theme-link-color)',
          button: 'var(--tg-theme-button-color, #D4A849)', // Золотой для кнопок
          'button-text': 'var(--tg-theme-button-text-color)',
        }
      },
      // Добавим кастомную тень для эффекта свечения, если потребуется
      boxShadow: {
        'gold-glow': '0 0 10px rgba(255, 203, 71, 0.6)', // Пример тени для Ultra Gold Glow
      }
    },
  },
  plugins: [],
}