git add .
git commit -m "Initial commit: attendance tracker PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/attendance-tracker.git
git push -u origin main
git add .
git commit -m "Describe your change"
git push
#![Barely 75 — Attendance Tracker]

Barely 75 is a compact, mobile-first attendance tracker focused on rapid, low-friction data entry for students and faculty. It's designed to be PWA-friendly, accessible, and resilient on low-end devices.

Why this project exists
- Fast daily workflow for marking attendance on mobile
- Avoids cognitive overhead: single-tap toggles, long-press to reset
- Small bundle size, offline-first UX, and predictable animations

Key features
- Tap to toggle Present / Absent
- Long-press (3s) to clear/reset a period
- Local persistence with quick save debouncing
- PWA ready (icons, manifest, service worker)
- Accessible controls and keyboard support

Architecture overview
- Framework: React + TypeScript with Vite (dev + build)
- Animation: Framer Motion for lightweight motion primitives
- State: React Context + reducer pattern for deterministic updates
- Gesture handling: `src/hooks/useAttendanceGesture.ts` (pointer events + RAF-based progress)
- Styling: utility CSS with a few opinionated utilities for layout and accessibility

Repository layout
- `src/`
   - `components/` — UI building blocks (`PeriodCard`, sheets, navigation)
   - `hooks/` — `useAttendanceGesture`, persistence hooks
   - `pages/` — top-level views (Dashboard)
   - `store/` — `AttendanceContext`, reducer logic
   - `utils/` — date, storage, and small helpers

Getting started (local dev)

Requirements
- Node.js 18+ (or latest LTS)
- npm (or pnpm/yarn)

Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:5173` to view the app.

Build for production

```bash
npm run build
```

Preview the production build

```bash
npm run preview
```

Core implementation notes (for maintainers)
- Long-press duration lives in `src/constants/app.ts` as `LONG_PRESS_DURATION`.
- Gesture logic is implemented in `src/hooks/useAttendanceGesture.ts`. It uses pointer capture, RAF to render progress, and cancels on meaningful pointer movement to avoid false positives while scrolling.
- The attendance card UI is `src/components/PeriodCard.tsx`. It handles tap/hold gestures, animated progress, and the visible `Reset` affordance.

UX and mobile considerations
- `touch-action` is set carefully to allow vertical scrolling while preserving horizontal and press interactions where appropriate.
- Long-press cancellation on movement prevents accidental clears when the user is scrolling.
- Accessibility: interactive elements have focus styles and keyboard handlers for Enter/Space and Delete/Backspace for quick actions.

Deployment
- Vercel is the recommended provider; the repo includes `vercel.json` for sensible defaults. Build command: `npm run build`, output directory: `dist`.

Contributing
- Keep PRs small and focused: UI, gesture logic, or storage changes should be split when possible.
- Add unit tests for gesture logic (consider `vitest`) when changing `useAttendanceGesture`.
- Document UX changes in the PR description (how to reproduce, expected behavior).

Maintenance notes
- If long-press sensitivity needs tuning, change `LONG_PRESS_DURATION` and adjust progress smoothing in `useAttendanceGesture`.
- For production monitoring, add lightweight analytics to capture unhandled rejections and slowed renders.

Contact and next steps
- If you want, I can add a `CONTRIBUTING.md`, an issue template, or CI (GitHub Actions) to run typechecks and builds on PRs.

---

File references
- `src/components/PeriodCard.tsx` — card UI and Reset control
- `src/hooks/useAttendanceGesture.ts` — gesture implementation
- `src/constants/app.ts` — `LONG_PRESS_DURATION` and other app constants

License: MIT (add LICENSE file if desired)

If you'd like, I can expand this README with diagrams, API notes, or CI examples.
