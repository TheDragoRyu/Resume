import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0a0a12',
          raised: '#14102a',
          overlay: '#1e1838',
        },
        accent: {
          DEFAULT: '#00fff0',
          hover: '#67fffa',
        },
        'neon-pink': '#ff00ff',
        'neon-green': '#39ff14',
      },
      fontFamily: {
        sans: ['var(--font-silkscreen)', 'Courier New', 'monospace'],
        mono: ['var(--font-silkscreen)', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
