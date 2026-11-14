import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { svgClean } from './build/svg-clean.ts';
import { languagePages } from './build/language-pages.ts';

export default defineConfig({
  plugins: [svgClean(), preact(), languagePages()],
  server: { fs: { allow: ['.'] } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'build/**/*.test.ts'],
  },
});
