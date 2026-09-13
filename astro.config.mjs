// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://alirad.dev',
  vite: {
    plugins: [tailwind()],
  },
});
