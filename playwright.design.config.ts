import { defineConfig, devices } from '@playwright/test';

const webURL = 'http://localhost:43130';
const adminURL = 'http://localhost:43131';

export default defineConfig({
  testDir: './tests/browser',
  testMatch: 'design-system.spec.ts',
  outputDir: 'test-results/design-system',
  workers: 1,
  timeout: 90_000,
  reporter: 'list',
  use: { trace: 'retain-on-failure', reducedMotion: 'reduce' },
  projects: [
    {
      name: 'desktop-light',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
        colorScheme: 'light',
      },
    },
    {
      name: 'desktop-dark',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
        colorScheme: 'dark',
      },
    },
    {
      name: 'phone-light',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', colorScheme: 'light' },
    },
    {
      name: 'phone-dark',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', colorScheme: 'dark' },
    },
  ],
  webServer: [
    {
      command: `NEXT_DIST_DIR=.next-design NEXT_PUBLIC_API_URL=${webURL}/__qa_api pnpm --filter web dev --port 43130`,
      url: webURL,
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      command: `NEXT_DIST_DIR=.next-design NEXT_PUBLIC_API_URL=${adminURL}/__qa_api pnpm --filter backoffice exec next dev --port 43131`,
      url: adminURL,
      timeout: 120_000,
      reuseExistingServer: false,
    },
  ],
});
