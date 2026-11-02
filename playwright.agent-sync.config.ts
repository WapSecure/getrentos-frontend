import { defineConfig, devices } from '@playwright/test';

const port = 43120;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/browser',
  testMatch: 'agent-queue.spec.ts',
  outputDir: 'test-results/agent-sync',
  workers: 1,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], baseURL, trace: 'retain-on-failure' },
  webServer: {
    command: `NEXT_DIST_DIR=.next-agent-sync NEXT_PUBLIC_API_URL=${baseURL}/__qa_api pnpm --filter web dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
