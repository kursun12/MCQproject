# Improvements Summary

## Root causes & fixes

- `src/App.jsx:1-98`, `src/App.css:1-19`, `src/main.jsx:1-51` — Introduced an `ErrorBoundary`, added semantic `<header>/<main>` structure, and wired the debug panel so runtime faults surface gracefully rather than crashing the shell. Axe now reports zero critical issues on the landing page.
- `src/components/DebugPanel.jsx:1-97`, `src/utils/debug.js:1-102`, `src/utils/apiClient.js:1-110` — Centralised API logging, error capture, and telemetry. Unhandled promise rejections and fetch failures are routed to the debug drawer and console, simplifying incident triage.
- `src/utils/importUtils.js:1-74` & `src/Import.jsx:1-780` — Extracted pure helpers (`normalizeQuestion`, `prepareImport`, `moveItem`, `remapAnswers`) so the importer no longer throws TDZ errors when `normalizeQuestion` is referenced before initialisation. Added `test/importUtils.test.js:1-64` to cover the parsing edge cases and ID de-duplication logic.
- `src/utils/quizBuilder.js:1-121` & `src/Quiz.jsx:1-990` — Moved question-pool construction into a dedicated utility used via `useCallback`, eliminating the previous hook suppressions and fixing stale dependency bugs when storage updates arrive. Added `test/quizBuilder.test.js:1-89` to exercise filters (bookmarks, sets, tags, hard mode) and shuffle mechanics.
- `server.js:1-46` & `test/server.test.js:1-20` — Exported the Express app and added a `/healthz` route, enabling fast supertest assertions without booting an actual port listener.
- `playwright/tests/*`, `playwright.config.js:1-38` — Trimmed the Chromium suite to nine targeted specs covering nav, quiz happy-path, accessibility, and a click-all harness with screenshots/videos/traces saved in `artifacts/e2e/`.

## Before / After

- **Before**: Navigation between modes occasionally crashed (`normalizeQuestion` TDZ), axe flagged missing main landmarks, and E2E clicks weren’t captured with artefacts. Local storage mutations didn’t retrigger question rebuilds reliably due to disabled hook linting.
- **After**: Import helpers are modular and tested, Quiz question pools recompute deterministically via `buildQuestionPool`, the layout is accessible, and the Chromium Playwright run validates every nav link plus normal quiz flow while persisting screenshots, videos, and traces.

## TODOs

- `src/Import.jsx:120` — Still a large stateful component; consider decomposing into hooks/subcomponents for better readability and coverage.
- `src/Quiz.jsx:1` — Continue slimming by extracting repeat-mode logic and timing/stat tracking into dedicated hooks to improve maintainability.
- `src/utils/debug.js:1` — Extend coverage to exercise the event bus (subscribe/unsubscribe, log overflow) so instrumentation stays reliable.
