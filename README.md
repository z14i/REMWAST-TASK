# Booking Web App

A Desktop-hosted prototype of a four-step skip booking flow built with Next.js App Router, TypeScript, Tailwind CSS, and Playwright.

## What is included

- `ui/`: the Next.js application, including fixture-backed mock APIs and the full booking experience.
- `automation/`: Playwright configuration, page objects, shared test data, API client helpers, and end-to-end plus API tests for the core booking paths.
- `manual-tests.md`: a refreshed 40-case manual QA checklist covering layout, validation, fixtures, branching, summary, and accessibility.
- `bug-reports.md`: three realistic sample bug reports that document prototype-level risks and gaps.

## Booking flow

1. Search a postcode fixture and select an address.
2. Choose a waste type and persist it through a mock API.
3. Review skip options, with heavy-waste restrictions applied to larger sizes.
4. Review the invoice and confirm the booking with double-submit protection.

## Supported postcode fixtures

- `SW1A 1AA`: returns 12 addresses.
- `EC1A 1BB`: returns 0 addresses.
- `M1 1AE`: returns addresses after simulated latency.
- `BS1 4DJ`: returns a temporary error on first lookup and succeeds on retry.

## Run locally

### UI

```bash
cd /Users/abdulrahimqme/Desktop/booking-app/ui
npm install
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000).

### Playwright

```bash
cd /Users/abdulrahimqme/Desktop/booking-app/automation
npm install
npx playwright install chromium
npx playwright test
```

The Playwright config builds the UI and runs an isolated production-style server on `http://127.0.0.1:3100`, so it does not depend on or interfere with a manual session running on port `3000`.

### Playwright against the deployed site

```bash
cd /Users/abdulrahimqme/Desktop/booking-app/automation
npm run test:deployed
```

This targets [https://rme-wast-task.vercel.app/](https://rme-wast-task.vercel.app/) directly and skips the local `webServer` startup. You can also override the target with `PLAYWRIGHT_BASE_URL=<url>`.

## Automation structure

- `automation/pages/booking-flow.page.ts`: senior-style page object for the booking journey.
- `automation/support/booking-api.client.ts`: reusable API client for contract-level automation checks.
- `automation/support/test-data.ts`: shared fixture data used by the tests.
- `automation/tests/booking-flow.spec.ts`: end-to-end coverage for populated, empty, loading, retryable-error, and manual-entry plasterboard flows.
- `automation/tests/booking-api.spec.ts`: API automation for postcode lookup, skip catalogue, waste-type validation, and booking confirmation.
- `automation/playwright.config.ts`: environment-aware Playwright setup that supports both local execution and deployed-site execution.

## Build verification

```bash
cd /Users/abdulrahimqme/Desktop/booking-app/ui
npm run build
npm run start
```

## Testing rationale

- The API routes are deterministic so the UI and E2E tests can assert exact states reliably.
- Page-object methods wait on the relevant network responses so the suite synchronizes with the booking flow instead of racing the UI.
- `data-testid` selectors are used on the key branching points in the flow to keep Playwright strict and resilient.
- The final confirmation button disables after a successful response so accidental double submissions are blocked in both manual and automated checks.

## Tradeoffs and assumptions

- This is a prototype, so postcodes are fixture-driven rather than backed by a real address service.
- Waste type persistence is mocked and does not store data beyond the current process.
- Booking confirmations are generated in memory and are not persisted across server restarts.
- Prices and surcharges are illustrative, not linked to a live pricing engine.
# REMWAST-TASK
