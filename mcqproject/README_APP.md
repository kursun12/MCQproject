MCQ Practice (React)
====================

How to run
- Dev: `cd mcqproject && npm install && npm run dev` then open the URL Vite prints.
- Build: `npm run build` then `npm run preview` to serve the production build.

Key features
- Import CSV/JSON; normalize answers to 0-based arrays.
- Modes: Practice (instant feedback), Test (no feedback until end), Challenge (points/streaks), Review (browse/filter).
- Multi-answer support with strict or Partial Credit mode (Settings).
- Bookmarks (⭐) and Notes (📝) per question; persisted to localStorage.
- Search & tag filters in Review, “Retry Incorrect Only”.
- Results: score %, streaks, basic badges, export CSV.
- Theme: Light/Dark with system preference; responsive layout.
- Keyboard shortcuts: 1–9 select/toggle, Enter submit/next.
- PWA-ready (manifest + simple service worker; effective in build/preview).

Shortcuts
- 1–9: select/toggle option
- Enter: submit / next
- b: toggle bookmark (on Quiz screen)
- s: open settings (browser shortcut reserved in this app)

Data formats
- CSV headers: Question, Option A..F, Correct Answer(s), Explanation, Tags
  - Correct Answer accepts letters/numbers, multiple separated by comma/semicolon/pipe/slash/space.
- JSON array items: `{ id, question, options[], answer, explanation?, tags? }`
  - `answer` may be a single number or array; converted to `correct[]` internally.

Persistence
- `localStorage` keys:
  - `questions` (imported data), `bookmarks`, `notes`, `shuffleQs`, `shuffleOpts`, `instantReveal`, `partialCredit`, `maxStreak`, `mcqSession` (progress snapshot), `retryIds` (temp for retry flow).

Advanced types (scaffolded)
- `type: 'hotspot'` renders an image with click zones: `media: { src, zones: [{x,y,w,h}] }` with percentages.

