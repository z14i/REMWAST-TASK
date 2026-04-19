import { defineConfig, devices } from "@playwright/test";

const localBaseUrl = "http://127.0.0.1:3100";
const configuredBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim();
const baseURL = configuredBaseUrl || localBaseUrl;
const runAgainstExternalDeployment = Boolean(configuredBaseUrl);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI || runAgainstExternalDeployment ? 2 : 0,
  workers: 1,
  timeout: runAgainstExternalDeployment ? 45_000 : 30_000,
  expect: {
    timeout: runAgainstExternalDeployment ? 10_000 : 5_000,
  },
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: runAgainstExternalDeployment
    ? undefined
    : {
        command:
          "cd ../ui && npm run build && npm run start -- --hostname 127.0.0.1 --port 3100",
        url: localBaseUrl,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
