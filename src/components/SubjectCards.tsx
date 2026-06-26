import { motion } from "framer-motion";
import { useState } from "react";
import { GENTLE_SPRING } from "../constants/motion";
import type { SubjectWithMetrics } from "../types/attendance";
import { getPredictionMessage } from "../utils/attendance";
import { PencilIcon, PlusIcon, TrashIcon } from "./Icons";

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
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
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

  return (
    <section className="space-y-3">
      <div className="section-heading">
        <h2>Your Subjects</h2>
        <p>{subjects.length} course{subjects.length === 1 ? "" : "s"} tracked</p>
      </div>

      <div className="space-y-3">
        {subjects.map(({ subject, metrics }, index) => {
          const confirmingDelete = confirmDeleteId === subject.id;

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
                <div className="min-w-0">
                  <h3 className="text-lg font-medium tracking-tight">{subject.name}</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subject.teacher}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="rounded-full bg-[var(--color-surface-elevated)] px-3 py-1 text-sm tabular-nums text-[var(--color-text-secondary)]">
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

              <div className="mt-4 h-2 rounded-full bg-[var(--color-divider)]">
                <motion.div
                  className="h-full rounded-full"
                  animate={{
                    width: `${Math.max(4, Math.min(100, metrics.attendanceRate))}%`,
                    backgroundColor:
                      metrics.attendanceRate >= metrics.targetAttendance
                        ? "var(--color-success)"
                        : "var(--color-danger)",
                  }}
                  transition={GENTLE_SPRING}
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">
                    Target
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{subject.targetAttendance}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="touch-button"
                    onClick={() => onAdjustTarget(subject.id, subject.targetAttendance - 1)}
                    aria-label={`Lower ${subject.name} target attendance`}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    className="touch-button"
                    onClick={() => onAdjustTarget(subject.id, subject.targetAttendance + 1)}
                    aria-label={`Increase ${subject.name} target attendance`}
                  >
                    +
                  </button>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
                {getPredictionMessage(metrics)}
              </p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
};
