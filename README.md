# Barely 75 — Attendance Tracker

A premium, mobile‑first PWA for fast, reliable attendance marking.

Overview

This app targets the student problem of "bunking" — predicting whether a student is on track to meet their target attendance and how many classes they can afford to miss (or must attend) to hit that target. Students need a simple, privacy-friendly tool to plan attendance and avoid surprises at the end of the term.

Problem we solve

- Students often miscalculate how many classes they can miss while keeping their attendance above a required target.
- Manual tracking is error-prone and time consuming; existing tools are not mobile‑first or lack actionable predictions.

Our solution

- Record attendance quickly with single taps (Present / Absent) and a clear Reset flow for fixes.
- Provide a per-subject attendance forecast: projected attendance percentage, number of allowed absences to keep a target, and simple suggestions.
- Local-first design: all data stays on the device unless the user exports it.

What you get

- Real-time attendance percentage per subject
- Predictive "bunking" calculator that shows how many classes you can miss or need to attend to reach your target
- Visual timeline and quick analytics cards for trend awareness

Primary features (student-focused)

- Fast marking: tap to toggle Present / Absent
- Safe correction: long-press (3s) or Reset button to clear a period
- Set a target attendance percentage and see live predictions
- Export/import JSON backup for portability
- PWA installable for easy access on phone home screen

How to try it (students)

1. Install and run locally:

```bash
npm install
npm run dev
```

2. Open `http://localhost:5173` on your phone or desktop.
3. Add your subjects and weekly schedule using the Add (+) flow.
4. Each day, tap periods to mark Present/Absent. Watch the dashboard for per-subject predictions and the number of safe absences.

Interpretation guide

- "Projected attendance": current percent if future classes follow the same pattern.
- "Allowed absences": number of future classes you can miss and still meet your target.
- Use Reset to correct accidental marks; predictions update immediately.

Technology (short)

- React + TypeScript, built with Vite
- Framer Motion for micro-interactions
- Custom `useAttendanceGesture` hook for robust touch/pointer handling

Notes for maintainers

- `src/constants/app.ts` — `LONG_PRESS_DURATION` controls long-press time
- `src/hooks/useAttendanceGesture.ts` — pointer capture, RAF progress, movement-cancel
- `src/components/PeriodCard.tsx` — UI for marking, progress bar, Reset control
- Prediction logic and seed data: `src/constants/seed.ts` and `src/utils/attendance.ts`

Deployment

Build and deploy the `dist/` folder to any static host (Vercel recommended):

```bash
npm run build
```

If you'd like, I can now:

- Add a one-page student quick-start guide and demo script
- Add CI to validate builds on push

***

If this captures the app intent, I'll finalize and push the README update. If you want different wording (e.g., for a student-facing flyer), tell me the audience and tone.

