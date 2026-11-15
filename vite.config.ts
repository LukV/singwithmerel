import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { svgClean } from './build/svg-clean.ts';
import { languagePages } from './build/language-pages.ts';
import { serviceWorker } from './build/service-worker.ts';
import { previewHeaders } from './build/headers.ts';

export default defineConfig({
  plugins: [svgClean(), preact(), languagePages(), serviceWorker()],
  server: {
    fs: { allow: ['.'] },
    // npm run dev:phone: HTTPS on the local network, so a phone may use the microphone.
    ...(process.env.MEREL_HTTPS ? { https: { key: readFileSync('.cert/dev-key.pem'), cert: readFileSync('.cert/dev.pem') } } : {}),
  },
  // The preview sends the live site's headers, so the browser check runs under the same rules.
  preview: { headers: previewHeaders() },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'build/**/*.test.ts', 'deploy/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
