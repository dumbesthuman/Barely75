git add .
git commit -m "Initial commit: attendance tracker PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/attendance-tracker.git
git push -u origin main
git add .
git commit -m "Describe your change"
git push
# Attendance Tracker — HR Summary

Short summary

This project is a mobile-first attendance tracker that solves the problem of slow, error-prone manual attendance logging. It lets users mark presence quickly, reduces accidental changes during scrolling, and provides a clear reset path for corrections.

Problem addressed (for HR)
- Large classes require a fast, low-friction way to mark attendance on mobile devices.
- Manual entry processes are slow and prone to mistakes; there was no simple, auditable flow for quick corrections.

What I built
- A compact PWA that supports single-tap toggles for Present/Absent and a 3-second long-press to reset a period.
- Visual and programmatic safeguards to avoid accidental changes while scrolling.
- Local persistence for offline usage and quick builds for deployment.

Business impact
- Faster roll-call: reduces per-student marking time and classroom distraction.
- Lower error rate due to explicit reset and movement-cancellation during gestures.
- Easy to deploy and test as a PWA on phones — minimal training required for staff.

Quick tech summary (non-technical)
- Frontend: React + TypeScript (modern, maintainable stack)
- Build: Vite (fast local dev and production builds)
- UX: Mobile-first with an eye on accessibility and offline support

How to try it (for reviewers / non-devs)
1. Run this in the project folder:

```bash
npm install
npm run dev
```

2. Open `http://localhost:5173` in a browser on your phone or desktop.
3. Add a subject using the Add (+) button, then tap a period to mark Present/Absent.
4. To clear a mark: press-and-hold a period for 3 seconds, or use the visible `Reset` button on marked cards.

What to look for during review
- Speed of marking (tap to toggle)
- Stability while scrolling (no accidental marks)
- Clear reset workflow and confirmation that data is persisted locally

Next steps I can take for production readiness
- Add CI to run type checks and builds on PRs
- Add a short demo video and user guide for staff
- Add analytics or an audit log for attendance changes

Contact
- If you want me to prepare a short demo script (2–3 minutes) for stakeholders or a one-page user guide for staff, tell me and I’ll create it.

---

File references for engineers (if needed)
- `src/components/PeriodCard.tsx` — card UI and Reset control
- `src/hooks/useAttendanceGesture.ts` — gesture implementation
- `src/constants/app.ts` — `LONG_PRESS_DURATION`

