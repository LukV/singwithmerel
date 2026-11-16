import { defineConfig, devices } from '@playwright/test';
import { fakeMicFile } from './tests/e2e/fake-mic.ts';

// The browser check runs against the built site, as it will be served.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: 'listening.spec.ts' },
    { name: 'phone', use: { ...devices['Pixel 7'] }, testIgnore: 'listening.spec.ts' },
    // Merel listening, with Chromium's fake microphone singing the scale and the permission granted.
    {
      name: 'listening',
      testMatch: 'listening.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['microphone'],
        launchOptions: {
          args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${fakeMicFile()}`],
        },
      },
    },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/en/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
