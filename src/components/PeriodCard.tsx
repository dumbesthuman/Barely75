import { memo } from "react";
import { motion } from "framer-motion";
import { useAttendanceGesture } from "../hooks/useAttendanceGesture";
import { GENTLE_SPRING, SPRING } from "../constants/motion";
import { LONG_PRESS_DURATION } from "../constants/app";
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
  PRESENT: "Present — tap to mark absent · hold for 3 seconds to reset",
  ABSENT: "Absent — tap to mark present · hold for 3 seconds to reset",
  CANCELLED: "Tap to mark attendance · hold for 3 seconds to reset",
  UNMARKED: "Tap present or absent · hold for 3 seconds to clear",
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
            </p>
            {!readOnly && isPressed && period.status !== null ? (
              <p className="mt-2 text-xs font-semibold text-primary">
                Reset in {Math.max(0, Math.ceil((1 - longPressProgress) * (LONG_PRESS_DURATION / 1000)))}s
              </p>
            ) : null}
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
      {period.status !== null && !readOnly ? (
        <button
          type="button"
          className="absolute right-4 bottom-4 z-20 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-primary shadow-sm transition hover:bg-surface-elevated focus-ring"
          onClick={(event) => {
            event.stopPropagation();
            onClear(period.id);
          }}
        >
          Reset
        </button>
      ) : null}
      </div>
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
