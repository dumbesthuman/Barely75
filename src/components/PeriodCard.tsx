import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAttendanceGesture } from "../hooks/useAttendanceGesture";
import { GENTLE_SPRING, SPRING } from "../constants/motion";
import { LONG_PRESS_DURATION } from "../constants/app";
import type { Period, ScheduleSlot, Subject } from "../types/attendance";
import { formatTimeRange } from "../utils/date";
import { getStatusAccent, getStatusLabel } from "../utils/attendance";
import { NoteIcon } from "./Icons";

interface PeriodCardProps {
  period: Period;
  slot: ScheduleSlot;
  subject: Subject;
  readOnly?: boolean;
  isDragging?: boolean;
  onCycle: (periodId: string, currentStatus: Period["status"]) => void;
  onClear: (periodId: string) => void;
  onSetNote?: (periodId: string, note: string) => void;
}

const statusCopy = {
  PRESENT: "Present — tap to mark absent · hold to reset",
  ABSENT: "Absent — tap to mark present · hold to reset",
  CANCELLED: "Cancelled — tap to mark attendance · hold to reset",
  UNMARKED: "Tap to mark present or absent",
} as const;

export const PeriodCard = memo(
  ({ period, slot, subject, readOnly = false, isDragging = false, onCycle, onClear, onSetNote }: PeriodCardProps) => {
    const [noteOpen, setNoteOpen] = useState(false);
    const [noteDraft, setNoteDraft] = useState(period.note ?? "");

    const { gestureProps, isPressed, longPressProgress } = useAttendanceGesture({
      onTap: () => {
        if (!readOnly && !isDragging) {
          onCycle(period.id, period.status);
        }
      },
      onLongPress: () => {
        if (!readOnly && !isDragging) {
          onClear(period.id);
        }
      },
      onDelete: () => {
        if (!readOnly) {
          onClear(period.id);
        }
      },
      disabled: readOnly || isDragging,
    });

    const statusKey = period.status ?? "UNMARKED";
    const accent = getStatusAccent(period.status);
    const isAbsent = period.status === "ABSENT";
    const subjectColor = subject.color;

    return (
      <div className="relative">
        <motion.button
          type="button"
          layout
          className="native-card focus-ring relative w-full overflow-hidden px-5 py-5 text-left"
          style={{ touchAction: "none" }}
          animate={{
            scale: isPressed ? 0.985 : 1,
            x: isAbsent ? [0, -3, 3, -2, 0] : 0,
          }}
          transition={SPRING}
          aria-label={`${subject.name}, period ${slot.periodNumber}, ${getStatusLabel(period.status)}`}
          {...gestureProps}
        >
          {/* Color accent strip from subject color */}
          {subjectColor && (
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[27px]"
              style={{ backgroundColor: subjectColor }}
              aria-hidden="true"
            />
          )}

          <motion.div
            className="absolute inset-0"
            animate={{
              background:
                period.status === null
                  ? "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))"
                  : `linear-gradient(180deg, ${accent}18, transparent 58%)`,
            }}
            transition={GENTLE_SPRING}
          />
          <motion.div
            className="absolute inset-x-5 bottom-0 h-1.5 rounded-full"
            style={{ backgroundColor: `${accent}20` }}
            initial={false}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: accent }}
              animate={{ width: `${longPressProgress * 100}%`, opacity: longPressProgress > 0 ? 1 : 0 }}
              transition={{ duration: 0.08 }}
            />
          </motion.div>

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.26em] text-secondary">
                Period {slot.periodNumber}
              </p>
              <h3 className="mt-2 text-lg font-medium tracking-tight">{subject.name}</h3>
              <p className="mt-1 text-sm text-secondary">
                {formatTimeRange(slot.startTime, slot.endTime)} · {slot.room}
              </p>
              <p className="mt-3 text-sm leading-6 text-secondary">
                {readOnly ? "Preview — mark attendance once the day arrives" : statusCopy[statusKey]}
              </p>
              {!readOnly && isPressed && period.status !== null ? (
                <p className="mt-2 text-xs font-semibold text-primary">
                  Reset in {Math.max(0, Math.ceil((1 - longPressProgress) * (LONG_PRESS_DURATION / 1000)))}s
                </p>
              ) : null}
              {/* Note preview */}
              {period.note && (
                <p className="mt-2 text-xs text-secondary italic line-clamp-1">
                  📝 {period.note}
                </p>
              )}
            </div>

            <div className="flex items-start gap-3">
              <motion.div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-border"
                animate={{
                  backgroundColor: accent,
                  color: period.status === null ? "var(--color-text-secondary)" : "white",
                }}
                transition={SPRING}
                style={{
                  backgroundColor: period.status === null ? "var(--color-surface-elevated)" : accent,
                }}
              >
                <span className="text-xs font-medium uppercase tracking-[0.22em]">
                  {readOnly ? "Soon" : period.status === null ? "Tap" : getStatusLabel(period.status).slice(0, 3)}
                </span>
              </motion.div>
            </div>
          </div>
        </motion.button>

        {/* Action buttons below card */}
        {period.status !== null && !readOnly ? (
          <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2">
            {onSetNote && (
              <button
                type="button"
                className="rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-primary shadow-sm transition hover:bg-surface-elevated focus-ring"
                onClick={(event) => {
                  event.stopPropagation();
                  setNoteDraft(period.note ?? "");
                  setNoteOpen((prev) => !prev);
                }}
                aria-label={period.note ? "Edit note" : "Add note"}
              >
                <NoteIcon className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              className="rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-primary shadow-sm transition hover:bg-surface-elevated focus-ring"
              onClick={(event) => {
                event.stopPropagation();
                onClear(period.id);
              }}
            >
              Reset
            </button>
          </div>
        ) : null}

        {/* Note inline editor */}
        <AnimatePresence>
          {noteOpen && onSetNote && (
            <motion.div
              className="mt-2 native-card px-4 py-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={GENTLE_SPRING}
            >
              <label className="space-y-2 block">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
                  {period.status === "ABSENT" ? "Reason for absence" : "Class note"}
                </span>
                <input
                  className="input-field text-sm"
                  style={{ minHeight: 40 }}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder={period.status === "ABSENT" ? "e.g. Sick, family event..." : "Any notes..."}
                  maxLength={120}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onSetNote(period.id, noteDraft.trim());
                      setNoteOpen(false);
                    }
                    if (e.key === "Escape") {
                      setNoteOpen(false);
                    }
                  }}
                />
              </label>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="primary-button text-sm"
                  style={{ minHeight: 36, padding: "0.5rem 1rem" }}
                  onClick={() => {
                    onSetNote(period.id, noteDraft.trim());
                    setNoteOpen(false);
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="secondary-button text-sm"
                  style={{ minHeight: 36, padding: "0.5rem 1rem" }}
                  onClick={() => {
                    if (period.note) {
                      onSetNote(period.id, "");
                    }
                    setNoteOpen(false);
                  }}
                >
                  {period.note ? "Clear" : "Cancel"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
  (previous, next) =>
    previous.period === next.period &&
    previous.slot === next.slot &&
    previous.subject === next.subject &&
    previous.readOnly === next.readOnly &&
    previous.isDragging === next.isDragging &&
    previous.onCycle === next.onCycle &&
    previous.onClear === next.onClear &&
    previous.onSetNote === next.onSetNote,
);

PeriodCard.displayName = "PeriodCard";
