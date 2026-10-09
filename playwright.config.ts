import { defineConfig, devices } from '@playwright/test';

const webUrl = process.env.E2E_WEB_URL ?? 'http://localhost:3000';
const backofficeUrl = process.env.E2E_BACKOFFICE_URL ?? 'http://localhost:3001';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: 'test-results/playwright',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: Number(process.env.E2E_WORKERS ?? (process.env.CI ? 2 : 1)),
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  expect: { timeout: 10_000 },
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'web-desktop',
      testMatch: /web\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: webUrl },
    },
    {
      name: 'web-mobile',
      testMatch: /web\.spec\.ts/,
      use: { ...devices['Pixel 7'], baseURL: webUrl },
    },
    {
      name: 'backoffice',
      testMatch: /backoffice\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: backofficeUrl },
    },
  ],
  webServer: [
    {
      command: 'pnpm dev:web',
      url: webUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'pnpm dev:backoffice',
      url: backofficeUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
