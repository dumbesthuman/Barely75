import { memo } from "react";
import { motion } from "framer-motion";
import { useAttendanceGesture } from "../hooks/useAttendanceGesture";
import { RefreshIcon } from "./Icons";
import { GENTLE_SPRING, SPRING } from "../constants/motion";
import type { Period, ScheduleSlot, Subject } from "../types/attendance";
import { formatTimeRange } from "../utils/date";
import { getStatusAccent, getStatusLabel } from "../utils/attendance";

interface PeriodCardProps {
  period: Period;
  slot: ScheduleSlot;
  subject: Subject;
  readOnly?: boolean;
  onCycle: (periodId: string, currentStatus: Period["status"]) => void;
  onClear: (periodId: string) => void;
}

const statusCopy = {
  PRESENT: "Present — tap to mark absent · hold to reset",
  ABSENT: "Absent — tap to mark present · hold to reset",
  CANCELLED: "Tap to mark attendance · hold to reset",
  UNMARKED: "Tap present or absent · hold to clear",
} as const;

export const PeriodCard = memo(
  ({ period, slot, subject, readOnly = false, onCycle, onClear }: PeriodCardProps) => {
    const { gestureProps, isPressed, longPressProgress } = useAttendanceGesture({
      onTap: () => {
        if (!readOnly) {
          onCycle(period.id, period.status);
        }
      },
      onLongPress: () => {
        if (!readOnly) {
          onClear(period.id);
        }
      },
      onDelete: () => {
        if (!readOnly) {
          onClear(period.id);
        }
      },
      disabled: readOnly,
    });

    const statusKey = period.status ?? "UNMARKED";
    const accent = getStatusAccent(period.status);
    const isAbsent = period.status === "ABSENT";

    return (
      <motion.div
        layout
        className="native-card focus-ring relative w-full overflow-hidden px-5 py-5 text-left"
        animate={{
          scale: isPressed ? 0.985 : 1,
          x: isAbsent ? [0, -3, 3, -2, 0] : 0,
        }}
        transition={SPRING}
        role="button"
        tabIndex={0}
        aria-label={`${subject.name}, period ${slot.periodNumber}, ${getStatusLabel(period.status)}`}
        {...gestureProps}
      >
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
              {readOnly ? "Scheduled class" : statusCopy[statusKey]}
              {!readOnly && isPressed && period.status !== null ? (
                <span className="ml-2 text-[0.78rem] font-semibold text-primary">
                  Holding to reset…
                </span>
              ) : null}
            </p>
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

            {!readOnly && period.status !== null ? (
              <button
                type="button"
                className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-elevated text-secondary transition hover:bg-surface-elevated/90"
                aria-label="Reset attendance status"
                onClick={(event) => {
                  event.stopPropagation();
                  onClear(period.id);
                }}
              >
                <RefreshIcon className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  },
  (previous, next) =>
    previous.period === next.period &&
    previous.slot === next.slot &&
    previous.subject === next.subject &&
    previous.readOnly === next.readOnly &&
    previous.onCycle === next.onCycle &&
    previous.onClear === next.onClear,
);

PeriodCard.displayName = "PeriodCard";
