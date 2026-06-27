import { motion } from "framer-motion";
import type { StreakData, SubjectWithMetrics } from "../types/attendance";
import { GENTLE_SPRING } from "../constants/motion";
import { AlertTriangleIcon, FlameIcon } from "./Icons";

interface ProgressWidgetsProps {
  subjects: SubjectWithMetrics[];
  streakData: StreakData;
}

export const ProgressWidgets = ({ subjects, streakData }: ProgressWidgetsProps) => {
  const sortedByRate = [...subjects].sort(
    (left, right) => right.metrics.attendanceRate - left.metrics.attendanceRate,
  );
  const leader = sortedByRate[0];
  const risk = [...subjects].sort(
    (left, right) => left.metrics.attendanceRate - right.metrics.attendanceRate,
  )[0];
  const totalMissed = subjects.reduce((sum, item) => sum + item.metrics.absent, 0);

  // Danger subjects: below target attendance
  const dangerSubjects = subjects.filter(
    (s) => s.metrics.conducted > 0 && s.metrics.attendanceRate < s.metrics.targetAttendance,
  );

  // Different label when only one subject (leader = risk = same subject)
  const showSingleSubjectNote = subjects.length === 1;

  const widgets = [
    {
      label: "Top performer",
      value: leader ? `${leader.metrics.attendanceRate.toFixed(1)}%` : "—",
      copy: leader
        ? showSingleSubjectNote
          ? `${leader.subject.name} (only subject)`
          : leader.subject.name
        : "No subjects yet",
      color: leader?.subject.color,
    },
    {
      label: subjects.length === 1 ? "Recovery classes" : "Most at risk",
      value: showSingleSubjectNote
        ? risk
          ? `${risk.metrics.recoveryClasses}`
          : "—"
        : risk
          ? `${risk.metrics.attendanceRate.toFixed(1)}%`
          : "—",
      copy: showSingleSubjectNote
        ? risk
          ? risk.metrics.recoveryClasses === 0
            ? "You're safe!"
            : "classes to recover"
          : "No data yet"
        : risk
          ? risk.subject.name
          : "No subjects yet",
      color: showSingleSubjectNote ? undefined : risk?.subject.color,
    },
    {
      label: "Missed so far",
      value: `${totalMissed}`,
      copy: totalMissed === 1 ? "One class missed" : `${totalMissed} classes missed`,
    },
  ];

  return (
    <section className="space-y-3">
      <div className="section-heading">
        <h2>Progress Widgets</h2>
        <p>Live highlights across the semester</p>
      </div>

      {/* Danger zone banner */}
      {dangerSubjects.length > 0 && (
        <motion.div
          className="native-card px-4 py-4 border-[var(--color-danger)]"
          style={{ borderColor: "var(--color-danger)", borderWidth: 1 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={GENTLE_SPRING}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-danger) 16%, var(--color-surface-elevated))",
                color: "var(--color-danger)",
              }}
            >
              <AlertTriangleIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--color-danger)" }}>
                ⚠️ Danger Zone
              </p>
              <p className="mt-1 text-sm leading-6 text-secondary">
                {dangerSubjects.length === 1
                  ? `${dangerSubjects[0]!.subject.name} is below target — attend ${dangerSubjects[0]!.metrics.recoveryClasses} more class${dangerSubjects[0]!.metrics.recoveryClasses === 1 ? "" : "es"} to recover.`
                  : `${dangerSubjects.length} subjects are below their attendance targets.`}
              </p>
              {dangerSubjects.length > 1 && (
                <ul className="mt-2 space-y-1">
                  {dangerSubjects.slice(0, 3).map((s) => (
                    <li key={s.subject.id} className="flex items-center gap-2 text-xs text-secondary">
                      {s.subject.color && (
                        <span
                          className="inline-block h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: s.subject.color }}
                        />
                      )}
                      {s.subject.name} — attend {s.metrics.recoveryClasses} more
                    </li>
                  ))}
                  {dangerSubjects.length > 3 && (
                    <li className="text-xs text-secondary">+{dangerSubjects.length - 3} more</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Streak card */}
      {streakData.currentStreak > 0 && (
        <motion.div
          className="native-card px-4 py-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...GENTLE_SPRING, delay: 0.02 }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: "color-mix(in srgb, #f59e0b 18%, var(--color-surface-elevated))",
                  color: "#f59e0b",
                }}
              >
                <FlameIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-secondary">Streak</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {streakData.currentStreak} day{streakData.currentStreak === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            {streakData.longestStreak > streakData.currentStreak && (
              <div className="text-right">
                <p className="text-xs text-secondary">Best</p>
                <p className="mt-1 text-base font-semibold tabular-nums text-secondary">
                  {streakData.longestStreak}d
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className="grid gap-3">
        {widgets.map((widget, index) => (
          <motion.article
            key={widget.label}
            className="native-card px-5 py-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...GENTLE_SPRING, delay: index * 0.03 }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                {widget.color && (
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: widget.color }}
                    aria-hidden="true"
                  />
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-secondary">
                    {widget.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{widget.value}</p>
                </div>
              </div>
              <p className="max-w-none text-sm leading-6 text-secondary sm:max-w-32 sm:text-right">
                {widget.copy}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};
