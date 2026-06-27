import { motion } from "framer-motion";
import { useState } from "react";
import { GENTLE_SPRING } from "../constants/motion";
import type { SubjectWithMetrics } from "../types/attendance";
import { getPredictionMessage } from "../utils/attendance";
import { PencilIcon, PlusIcon, TrashIcon } from "./Icons";
import { Sparkline } from "./Sparkline";

interface SubjectCardsProps {
  subjects: SubjectWithMetrics[];
  onAdjustTarget: (subjectId: string, nextTarget: number) => void;
  onEdit: (subjectId: string) => void;
  onDelete: (subjectId: string) => void;
  onAddSubject: () => void;
}

export const SubjectCards = ({
  subjects,
  onAdjustTarget,
  onEdit,
  onDelete,
  onAddSubject,
}: SubjectCardsProps) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (subjects.length === 0) {
    return (
      <section className="space-y-4">
        <div className="section-heading">
          <h2>Your Subjects</h2>
          <p>Add courses to start tracking</p>
        </div>
        <motion.div
          className="native-card px-5 py-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={GENTLE_SPRING}
        >
          <p className="text-sm leading-6 text-secondary">
            No subjects yet. Tap the button below or use the + button to add your first course with its weekly
            timetable.
          </p>
          <button type="button" className="primary-button mt-4 w-full" onClick={onAddSubject}>
            <PlusIcon className="h-4 w-4" />
            Add your first subject
          </button>
        </motion.div>
      </section>
    );
  }

  // Sort by attendance rate ascending (most at risk first)
  const sorted = [...subjects].sort((a, b) => a.metrics.attendanceRate - b.metrics.attendanceRate);

  return (
    <section className="space-y-3">
      <div className="section-heading">
        <h2>Your Subjects</h2>
        <p>{subjects.length} course{subjects.length === 1 ? "" : "s"} tracked</p>
      </div>

      <div className="space-y-3">
        {sorted.map(({ subject, metrics, sparkline }, index) => {
          const confirmingDelete = confirmDeleteId === subject.id;
          const isAboveTarget = metrics.attendanceRate >= metrics.targetAttendance;
          const subjectColor = subject.color ?? "var(--color-primary)";

          return (
            <motion.article
              key={subject.id}
              layout
              className="native-card px-5 py-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...GENTLE_SPRING, delay: index * 0.03 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex items-center gap-3">
                  {/* Color dot */}
                  <div
                    className="subject-color-dot shrink-0"
                    style={{ backgroundColor: subjectColor }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <h3 className="text-lg font-medium tracking-tight">{subject.name}</h3>
                    <p className="mt-1 text-sm text-secondary">{subject.teacher}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div
                    className="rounded-full px-3 py-1 text-sm tabular-nums font-semibold"
                    style={{
                      backgroundColor: isAboveTarget
                        ? "color-mix(in srgb, var(--color-success) 15%, var(--color-surface-elevated))"
                        : "color-mix(in srgb, var(--color-danger) 15%, var(--color-surface-elevated))",
                      color: isAboveTarget ? "var(--color-success)" : "var(--color-danger)",
                    }}
                  >
                    {metrics.attendanceRate.toFixed(1)}%
                  </div>
                  <button
                    type="button"
                    className="touch-button focus-ring"
                    onClick={() => onEdit(subject.id)}
                    aria-label={`Edit ${subject.name}`}
                  >
                    <PencilIcon className="mx-auto h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={`touch-button focus-ring ${confirmingDelete ? "border-[var(--color-danger)] text-[var(--color-danger)]" : ""}`}
                    onClick={() => {
                      if (confirmingDelete) {
                        onDelete(subject.id);
                        setConfirmDeleteId(null);
                        return;
                      }
                      setConfirmDeleteId(subject.id);
                    }}
                    aria-label={confirmingDelete ? `Confirm delete ${subject.name}` : `Delete ${subject.name}`}
                  >
                    <TrashIcon className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>

              {confirmingDelete ? (
                <p className="mt-3 text-sm text-[var(--color-danger)]">
                  Tap delete again to remove this subject and all its attendance records.
                </p>
              ) : null}

              {/* Progress bar */}
              <div className="mt-4 h-2 rounded-full bg-divider">
                <motion.div
                  className="h-full rounded-full"
                  animate={{
                    width: `${Math.max(4, Math.min(100, metrics.attendanceRate))}%`,
                    backgroundColor: isAboveTarget
                      ? "var(--color-success)"
                      : "var(--color-danger)",
                  }}
                  transition={GENTLE_SPRING}
                />
              </div>

              {/* Stats row + sparkline */}
              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-secondary">Target</p>
                      <p className="mt-1 text-xl font-semibold tabular-nums">{subject.targetAttendance}%</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-secondary">
                        {isAboveTarget ? "Safe bunks" : "Need to attend"}
                      </p>
                      <p className="mt-1 text-xl font-semibold tabular-nums">
                        {isAboveTarget ? metrics.safeBunks : metrics.recoveryClasses}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-secondary">Missed</p>
                      <p className="mt-1 text-xl font-semibold tabular-nums">{metrics.absent}</p>
                    </div>
                  </div>

                  {/* Target ± buttons */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-secondary">Adjust target:</span>
                    <button
                      type="button"
                      className="touch-button"
                      style={{ width: 36, height: 36, minHeight: 36 }}
                      onClick={() => onAdjustTarget(subject.id, subject.targetAttendance - 1)}
                      aria-label={`Lower ${subject.name} target attendance`}
                      disabled={subject.targetAttendance <= 60}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      className="touch-button"
                      style={{ width: 36, height: 36, minHeight: 36 }}
                      onClick={() => onAdjustTarget(subject.id, subject.targetAttendance + 1)}
                      aria-label={`Increase ${subject.name} target attendance`}
                      disabled={subject.targetAttendance >= 95}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Sparkline */}
                {sparkline.length >= 2 && (
                  <div className="shrink-0">
                    <p className="text-xs text-secondary mb-1 text-right">30d trend</p>
                    <Sparkline
                      data={sparkline}
                      target={subject.targetAttendance}
                      width={90}
                      height={32}
                      color={subjectColor}
                    />
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm leading-6 text-secondary">
                {getPredictionMessage(metrics)}
              </p>
            </motion.article>
          );
        })}
      </div>

      {/* Add more button at bottom */}
      <motion.button
        type="button"
        className="secondary-button w-full"
        onClick={onAddSubject}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...GENTLE_SPRING, delay: 0.1 }}
      >
        <PlusIcon className="h-4 w-4" />
        Add another subject
      </motion.button>
    </section>
  );
};
