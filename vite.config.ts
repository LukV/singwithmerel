import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { svgClean } from './build/svg-clean.ts';
import { languagePages } from './build/language-pages.ts';
import { serviceWorker } from './build/service-worker.ts';
import { previewHeaders } from './build/headers.ts';

export default defineConfig({
  plugins: [
    svgClean(),
    // Hot reloading wraps each module in code that needs a window; the pitch worklet imports
    // src/listen/ and runs where there is none, so in dev it would load but never register.
    preact({ exclude: [/\/src\/listen\//, /node_modules/] }),
    languagePages(),
    serviceWorker(),
  ],
  server: {
    fs: { allow: ['.'] },
    // npm run dev:phone: HTTPS on the local network, so a phone may use the microphone.
    ...(process.env.MEREL_HTTPS ? { https: { key: readFileSync('.cert/dev-key.pem'), cert: readFileSync('.cert/dev.pem') } } : {}),
  },
  // The preview sends the live site's headers, so the browser check runs under the same rules.
  preview: { headers: previewHeaders() },
  test: {
    // Plain Node by default; a test file that needs a browser says so in its first line (@vitest-environment jsdom).
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'build/**/*.test.ts', 'deploy/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
