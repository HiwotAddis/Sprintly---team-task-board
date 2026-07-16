import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#121212',
        steel: '#2b2f33',
        amber: '#f29f05',
        sand: '#f7f2e8',
      },
      boxShadow: {
        soft: '0 18px 50px rgba(0, 0, 0, 0.10)',
      },
    },
  },
  plugins: [],
};

export default config;