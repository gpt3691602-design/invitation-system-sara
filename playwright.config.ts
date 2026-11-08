import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against a live server:
//   BASE_URL=http://localhost:3000 npm run test:e2e        (local)
//   BASE_URL=https://invitation-system-sara.vercel.app npm run test:e2e
// The staff flow needs E2E_STAFF_EMAIL and E2E_STAFF_PASSWORD (a staff user);
// without them only the public checks run.
export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    locale: "he-IL",
    trace: "off",
    // Sandboxed runners (cloud sessions, some CI) reach the internet only via
    // an HTTPS proxy. Playwright's request API ignores HTTPS_PROXY, so pass it
    // explicitly; localhost stays direct.
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // iPhone viewport and touch on Chromium (WebKit is not installed everywhere).
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
});
