import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { GENTLE_SPRING } from "../constants/motion";
import type { Period, PeriodStatus, ScheduleSlot, Subject } from "../types/attendance";
import {
  addDaysToIso,
  compareIsoDates,
  formatCompactDate,
  formatFullDate,
  formatWeekday,
  getDayOffsetLabel,
  isWeekendIso,
} from "../utils/date";
import { CheckAllIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "./Icons";
import { PeriodCard } from "./PeriodCard";
import { WeekendCollegePrompt } from "./WeekendCollegePrompt";

interface ScheduleViewProps {
  todayIso: string;
  selectedDate: string;
  weekendCollegeDays: string[];
  onSelectedDateChange: (dateIso: string) => void;
  onConfirmWeekendCollege: (dateIso: string) => void;
  onSkipWeekend: () => void;
  periods: Array<Period & { slot: ScheduleSlot; subject: Subject }>;
  onCycle: (periodId: string, currentStatus: Period["status"]) => void;
  onClear: (periodId: string) => void;
  onBulkMark?: (dateIso: string, status: PeriodStatus) => void;
  onSetNote?: (periodId: string, note: string) => void;
}

export const ScheduleView = ({
  todayIso,
  selectedDate,
  weekendCollegeDays,
  onSelectedDateChange,
  onConfirmWeekendCollege,
  onSkipWeekend,
  periods,
  onCycle,
  onClear,
  onBulkMark,
  onSetNote,
}: ScheduleViewProps) => {
  const [direction, setDirection] = useState(0);
  const dragX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const opacity = useTransform(dragX, [-80, 0, 80], [0.6, 1, 0.6]);

  const isToday = selectedDate === todayIso;
  const isFuture = compareIsoDates(selectedDate, todayIso) > 0;
  const isPast = compareIsoDates(selectedDate, todayIso) < 0;
  const isWeekend = isWeekendIso(selectedDate);
  const isMarkedWeekend = isWeekend && weekendCollegeDays.includes(selectedDate);
  const isUnmarkedWeekend = isWeekend && !weekendCollegeDays.includes(selectedDate);

  const heading = useMemo(() => {
    if (isUnmarkedWeekend) {
      return formatWeekday(selectedDate);
    }
    if (isMarkedWeekend) {
      return "Weekend Schedule";
    }
    if (isToday) {
      return "Today's Schedule";
    }
    if (isPast) {
      return "Past Schedule";
    }
    return "Upcoming Schedule";
  }, [isMarkedWeekend, isPast, isToday, isUnmarkedWeekend, selectedDate]);

  const moveByDay = (step: -1 | 1) => {
    setDirection(step);
    onSelectedDateChange(addDaysToIso(selectedDate, step));
  };

  useEffect(() => {
    setDirection(0);
  }, [selectedDate]);

  // Swipe gesture: drag horizontally to navigate days
  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 60;
    const velocityThreshold = 400;
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      moveByDay(-1); // swipe right = go to previous day
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      moveByDay(1); // swipe left = go to next day
    }
    setIsDragging(false);
    dragX.set(0);
  };

  // Bulk mark: only show on past/today and when periods exist
  const canBulkMark = !isFuture && !isUnmarkedWeekend && periods.length > 0 && onBulkMark;
  const allPresent = periods.length > 0 && periods.every((p) => p.status === "PRESENT");
  const allAbsent = periods.length > 0 && periods.every((p) => p.status === "ABSENT");

  return (
    <section className="space-y-4">
      <div className="schedule-nav native-card px-3 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="touch-button focus-ring"
            onClick={() => moveByDay(-1)}
            aria-label="Previous day"
          >
            <ChevronLeftIcon className="mx-auto h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 px-1 text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">
              {getDayOffsetLabel(selectedDate, todayIso)}
            </p>
            <p className="mt-1 text-base font-semibold tracking-tight">{formatFullDate(selectedDate)}</p>
            <p className="mt-1 text-xs text-secondary">
              {formatWeekday(selectedDate)} · {formatCompactDate(selectedDate)}
              {isMarkedWeekend ? " · weekend class" : isWeekend ? " · weekend" : ""}
            </p>
          </div>

          <button
            type="button"
            className="touch-button focus-ring"
            onClick={() => moveByDay(1)}
            aria-label="Next day"
          >
            <ChevronRightIcon className="mx-auto h-5 w-5" />
          </button>
        </div>

        {!isToday ? (
          <button
            type="button"
            className="secondary-button mt-3 w-full"
            onClick={() => {
              setDirection(0);
              onSelectedDateChange(todayIso);
            }}
          >
            Jump to today
          </button>
        ) : null}
      </div>

      {isUnmarkedWeekend ? (
        <WeekendCollegePrompt
          dateIso={selectedDate}
          onConfirmCollege={onConfirmWeekendCollege}
          onSkipWeekend={onSkipWeekend}
        />
      ) : (
        <>
          <div className="section-heading">
            <h2>{heading}</h2>
            <p>
              {periods.length === 0
                ? "No classes scheduled for this day."
                : `${periods.length} class${periods.length === 1 ? "" : "es"}`}
            </p>
          </div>

          {isFuture ? (
            <p className="px-1 text-sm leading-6 text-secondary">
              Preview only — attendance can be marked once the day arrives.
            </p>
          ) : null}

          {/* Bulk mark controls */}
          {canBulkMark && (
            <motion.div
              className="flex gap-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={GENTLE_SPRING}
            >
              <button
                type="button"
                className={`secondary-button flex-1 text-sm ${allPresent ? "ring-2 ring-[var(--color-success)]" : ""}`}
                style={{ minHeight: 40 }}
                onClick={() => onBulkMark!(selectedDate, "PRESENT")}
                aria-label="Mark all present"
              >
                <CheckAllIcon className="h-3.5 w-3.5" />
                All Present
              </button>
              <button
                type="button"
                className={`secondary-button flex-1 text-sm ${allAbsent ? "ring-2 ring-[var(--color-danger)]" : ""}`}
                style={{ minHeight: 40 }}
                onClick={() => onBulkMark!(selectedDate, "ABSENT")}
                aria-label="Mark all absent"
              >
                <XIcon className="h-3.5 w-3.5" />
                All Absent
              </button>
              <button
                type="button"
                className="secondary-button text-sm"
                style={{ minHeight: 40, minWidth: 40, padding: "0 0.75rem" }}
                onClick={() => onBulkMark!(selectedDate, null)}
                aria-label="Clear all marks"
                title="Clear all"
              >
                Reset
              </button>
            </motion.div>
          )}

          {periods.length === 0 ? (
            <motion.div
              key={selectedDate}
              className="native-card px-5 py-6 text-sm leading-6 text-secondary"
              initial={{ opacity: 0, y: direction === 0 ? 10 : direction > 0 ? 14 : -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={GENTLE_SPRING}
            >
              {isMarkedWeekend
                ? "This weekend day is marked for college but no classes are set yet. Add subjects with Saturday or Sunday slots."
                : isFuture
                  ? "Your weekly timetable has no classes on this weekday yet. Add subjects from the + button."
                  : "Nothing was scheduled here. Browse other days or add subjects with weekly slots."}
            </motion.div>
          ) : (
            // Swipeable container
            <motion.div
              ref={containerRef}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              style={{ x: dragX, opacity }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              key={selectedDate}
              className="space-y-3 cursor-grab active:cursor-grabbing"
              initial={{ opacity: 0, x: direction === 0 ? 0 : direction > 0 ? 18 : -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={GENTLE_SPRING}
            >
              {periods.map((period, index) => (
                <motion.div
                  key={period.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...GENTLE_SPRING, delay: index * 0.03 }}
                >
                  <PeriodCard
                    period={period}
                    slot={period.slot}
                    subject={period.subject}
                    readOnly={isFuture}
                    onCycle={onCycle}
                    onClear={onClear}
                    onSetNote={onSetNote}
                    isDragging={isDragging}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </section>
  );
};
