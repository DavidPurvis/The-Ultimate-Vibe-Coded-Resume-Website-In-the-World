import { defineConfig, devices } from '@playwright/test';

const BASE = (
  process.env.BASE_PATH || '/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World'
).replace(/\/$/, '');
const chromiumPath = process.env.PW_CHROMIUM_PATH;
/**
 * Two runs: the production artifact (dist/) runs everything except @hooks; the test-hooks build
 * (dist-hooks/, PUBLIC_TEST_HOOKS=1) runs only @hooks, the specs that force roulette samples or
 * stub gameplay footage. The delivered artifact never contains the hooks (scan-dist checks).
 */
const HOOKS = process.env.PW_HOOKS === '1';
const byBuild = HOOKS ? { grep: /@hooks/ } : { grepInvert: /@hooks/ };
// Separate ports, so a server left running for one build is never reused for the other.
const PORT = HOOKS ? 4322 : 4321;
const launchOptions = chromiumPath ? { executablePath: chromiumPath } : {};

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}${BASE}/`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: HOOKS ? 'DIST_DIR=dist-hooks PORT=4322 npm run serve:dist' : 'npm run serve:dist',
    url: `http://127.0.0.1:${PORT}${BASE}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions }, ...byBuild },
    ...(HOOKS
      ? []
      : [
          {
            name: 'mobile',
            use: { ...devices['Pixel 7'], launchOptions },
            grep: /@mobile|@smoke/,
            grepInvert: /@hooks/,
          },
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            grep: /@smoke/,
            grepInvert: /@hooks/,
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            grep: /@smoke/,
            grepInvert: /@hooks/,
          },
        ]),
  ],
});
