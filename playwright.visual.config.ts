import { defineConfig, devices } from '@playwright/test';

const webUrl = process.env.E2E_WEB_URL ?? 'http://localhost:3000';
const backofficeUrl = process.env.E2E_BACKOFFICE_URL ?? 'http://localhost:3001';
const webPort = Number(new URL(webUrl).port || 3000);
const backofficePort = Number(new URL(backofficeUrl).port || 3001);
const reuseExistingServer = process.env.E2E_REUSE_EXISTING_SERVER !== '0';

if (!Number.isInteger(webPort) || !Number.isInteger(backofficePort)) {
  throw new Error('E2E web and backoffice URLs must contain valid ports.');
}

const viewports = [
  { name: 'mobile', viewport: { width: 390, height: 844 } },
  { name: 'tablet', viewport: { width: 768, height: 1024 } },
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'wide', viewport: { width: 1920, height: 1080 } },
] as const;

const projects = (application: 'web' | 'backoffice', baseURL: string) => [
  ...viewports.map(({ name, viewport }) => ({
    name: `${application}-${name}`,
    testMatch: new RegExp(`visual-qa\\.${application}\\.spec\\.ts$`),
    use: { ...devices['Desktop Chrome'], baseURL, viewport, colorScheme: 'light' as const },
  })),
  {
    name: `${application}-dark`,
    testMatch: new RegExp(`visual-qa\\.${application}\\.spec\\.ts$`),
    use: {
      ...devices['Desktop Chrome'],
      baseURL,
      viewport: { width: 1440, height: 900 },
      colorScheme: 'dark' as const,
    },
  },
];

export default defineConfig({
  testDir: './tests/browser',
  outputDir: 'test-results/playwright-visual',
  testMatch: /visual-qa\.(?:web|backoffice)\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  workers: Number(process.env.E2E_VISUAL_WORKERS ?? 1),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-visual-report', open: 'never' }]],
  expect: { timeout: 10_000 },
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{projectName}/{arg}{ext}',
  projects: [...projects('web', webUrl), ...projects('backoffice', backofficeUrl)],
  webServer: [
    {
      command: `NEXT_DIST_DIR=.next-e2e pnpm --filter web dev --port ${webPort}`,
      url: webUrl,
      reuseExistingServer,
      timeout: 120_000,
    },
    {
      command: `NEXT_DIST_DIR=.next-e2e pnpm --filter backoffice exec next dev --port ${backofficePort}`,
      url: backofficeUrl,
      reuseExistingServer,
      timeout: 120_000,
    },
  ],
});
