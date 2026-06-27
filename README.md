# Barely 75 — Attendance Tracker

A premium, mobile‑first PWA for fast, reliable attendance marking.

Overview

This app helps instructors and staff mark attendance quickly and accurately on mobile devices. It reduces accidental changes during scrolling, provides an explicit reset flow for corrections, and works offline.

Core value

- Rapid roll-call: single-tap toggles for Present/Absent
- Safe corrections: long-press (3s) or explicit Reset to clear a mark
- Offline-first persistence for classrooms with limited connectivity

Primary features

- Tap to toggle Present / Absent
- Long-press (3 seconds) to clear a period
- Visible Reset control on marked periods
- Local persistence and quick save debounce
- PWA-ready (manifest, icons, service worker)

Technology

- Frontend: React + TypeScript
- Build: Vite
- Animations: Framer Motion
- Gesture handling: `src/hooks/useAttendanceGesture.ts` (pointer events + RAF progress)

Try it locally

1. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

2. Open http://localhost:5173 in a browser (mobile or desktop).

Quick demo steps

- Add a subject via the Add (+) button.
- Tap a period to mark Present or Absent.
- To clear: press-and-hold for 3 seconds or use the Reset button on the marked card.

Notes for maintainers

- `LONG_PRESS_DURATION` is defined in `src/constants/app.ts`.
- Gesture logic is in `src/hooks/useAttendanceGesture.ts`.
- The attendance card UI and Reset control are in `src/components/PeriodCard.tsx`.

Deployment

Configured for static hosting (Vercel recommended). Build with:

```bash
npm run build
```

Next steps (optional)

- Add CI to run typechecks and builds on PRs
- Add a brief demo video and a one-page user guide for staff

If you want this README tailored for a pitch deck or an internal one-pager, I can prepare that next.

---

File references for engineers (if needed)
- `src/components/PeriodCard.tsx` — card UI and Reset control
- `src/hooks/useAttendanceGesture.ts` — gesture implementation
- `src/constants/app.ts` — `LONG_PRESS_DURATION`

