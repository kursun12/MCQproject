# MCQ Practice

Modernised React + Vite single page application for drilling multiple-choice questions. The UI persists questions in `localStorage`, exposes import/export workflows, and supports repeat practice, review, bookmarking, and configurable settings.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
npm install
```

### Environment variables

Runtime configuration lives in `.env`. Copy the sample and customise as needed:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Optional base URL for API requests served from `server.js`. Leave blank for same-origin. |

## Development

### Start the dev server

```bash
npm run dev
```

The app runs on [http://127.0.0.1:59222](http://127.0.0.1:59222) by default. The header now contains a proper `<main>` landmark and an accessible mode badge, and the floating debug button opens a panel that streams network/error telemetry captured by `src/utils/apiClient.js` and `src/utils/debug.js`.

### Lint & formatting

```bash
npm run lint
```

### Unit tests + coverage

```bash
npm run test        # runs Vitest with coverage
npm run test:unit   # runs Vitest without the coverage report
```

Coverage artefacts are written to `artifacts/coverage` (text + HTML + lcov).

### Playwright end-to-end tests

```bash
npx playwright install    # one-time browser install
npm run e2e               # launches Vite dev server, runs Chromium suite
```

Each run stores screenshots, videos, and traces beneath `artifacts/e2e/`:

- `artifacts/e2e/screenshots/`
- `artifacts/e2e/videos/`
- `artifacts/e2e/traces/`
- `artifacts/e2e/report/`

The suite covers:

1. Landing page boot/accessibility + axe scan
2. Quiz happy path (two-question practice flow)
3. Navigation links per primary route (Home, Quiz, Repeat, Review, Bookmarks, Settings, Questions)
4. Exploratory click-all harness across Home, Quiz, Settings (safe interactions captured via screenshots)

### Debug overlays & instrumentation

- Global `ErrorBoundary` wraps the React tree and surfaces friendly fallback copy instead of crashing.
- All fetches route through `src/utils/apiClient.js`, logging metadata to the browser console and the in-app debug drawer.
- Uncaught errors and unhandled rejections appear in the debug overlay (toggled via the “Debug (0)” button).

## Continuous Integration

`.github/workflows/ci.yml` builds on Node 20, installs dependencies, lints, runs Vitest + coverage, starts Vite and executes the Chromium Playwright run, uploading artefacts under `artifacts/e2e/**`.

## Project structure

```
mcqproject/
+-- public/                # static assets & service worker
+-- src/
¦   +-- components/        # shared UI primitives (Modal, Toaster, ErrorBoundary, DebugPanel)
¦   +-- repeat/            # spaced repetition engine + settings
¦   +-- utils/             # storage sync, API client, debug bus, scoring
¦   +-- Import.jsx         # question library management
¦   +-- Quiz.jsx           # practice/test/challenge flows
¦   +-- RepeatBuilder.jsx  # repeat drill builder
¦   +-- Review.jsx         # review/filter/search view
¦   +-- Settings.jsx       # configuration
¦   +-- main.jsx           # bootstrap + StrictMode + ErrorBoundary
+-- playwright/            # Playwright config, helpers, and specs
+-- test/                  # Vitest suites
+-- artifacts/             # coverage + e2e artefacts (created by tests)
+-- .env.example
+-- package.json
```

## Debug tips

- Toggle the debug drawer via the floating “Debug (0)” pill; events stream only during local development (`import.meta.env.DEV`).
- Press `?` to open the in-app Help overlay. Keyboard shortcuts for navigation are documented in `LandingPage.jsx`.
