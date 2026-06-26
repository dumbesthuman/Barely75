import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { GENTLE_SPRING } from "../constants/motion";
import type { Period, ScheduleSlot, Subject } from "../types/attendance";
import {
  compareIsoDates,
  findNextSchedulableDay,
  formatCompactDate,
  formatFullDate,
  formatWeekday,
  getDayOffsetLabel,
  isNavigableScheduleDay,
  isWeekendIso,
} from "../utils/date";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";
import { PeriodCard } from "./PeriodCard";
import { WeekendCollegePrompt } from "./WeekendCollegePrompt";

interface ScheduleViewProps {
  todayIso: string;
  selectedDate: string;
  weekendCollegeDays: string[];
  onSelectedDateChange: (dateIso: string) => void;
  onConfirmWeekendCollege: (dateIso: string) => void;
  periods: Array<Period & { slot: ScheduleSlot; subject: Subject }>;
  onCycle: (periodId: string, currentStatus: Period["status"]) => void;
  onClear: (periodId: string) => void;
}

export const ScheduleView = ({
  todayIso,
  selectedDate,
  weekendCollegeDays,
  onSelectedDateChange,
  onConfirmWeekendCollege,
  periods,
  onCycle,
  onClear,
}: ScheduleViewProps) => {
  const [direction, setDirection] = useState(0);
  const [hasScrolledDays, setHasScrolledDays] = useState(false);

  const isToday = selectedDate === todayIso;
  const isFuture = compareIsoDates(selectedDate, todayIso) > 0;
  const isPast = compareIsoDates(selectedDate, todayIso) < 0;
  const isMarkedWeekend =
    isWeekendIso(selectedDate) && weekendCollegeDays.includes(selectedDate);

  const weekendArrived =
    isWeekendIso(todayIso) && !weekendCollegeDays.includes(todayIso);

  const showWeekendPrompt = hasScrolledDays || weekendArrived;

  useEffect(() => {
    if (!isNavigableScheduleDay(selectedDate, weekendCollegeDays)) {
      onSelectedDateChange(findNextSchedulableDay(selectedDate, 1, weekendCollegeDays));
    }
  }, [onSelectedDateChange, selectedDate, weekendCollegeDays]);

  const heading = useMemo(() => {
    if (isMarkedWeekend) {
      return "Weekend Schedule";
    }
    if (isToday) {
      return "Today’s Schedule";
    }
    if (isPast) {
      return "Past Schedule";
    }
    return "Upcoming Schedule";
  }, [isMarkedWeekend, isPast, isToday]);

  const moveByDay = (step: -1 | 1) => {
    setHasScrolledDays(true);
    setDirection(step);
    onSelectedDateChange(findNextSchedulableDay(selectedDate, step, weekendCollegeDays));
  };

  useEffect(() => {
    setDirection(0);
  }, [selectedDate]);

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
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">
              {getDayOffsetLabel(selectedDate, todayIso)}
            </p>
            <p className="mt-1 text-base font-semibold tracking-tight">{formatFullDate(selectedDate)}</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {formatWeekday(selectedDate)} · {formatCompactDate(selectedDate)}
              {isMarkedWeekend ? " · weekend class" : ""}
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

      {showWeekendPrompt ? (
        <WeekendCollegePrompt
          todayIso={todayIso}
          selectedDate={selectedDate}
          weekendCollegeDays={weekendCollegeDays}
          weekendArrived={weekendArrived}
          onConfirmCollege={onConfirmWeekendCollege}
        />
      ) : null}

      <div className="section-heading">
        <h2>{heading}</h2>
        <p>
          {periods.length === 0
            ? "No classes scheduled for this day."
            : `${periods.length} class${periods.length === 1 ? "" : "es"}`}
        </p>
      </div>

      {isFuture ? (
        <p className="px-1 text-sm leading-6 text-[var(--color-text-secondary)]">
          Preview only. You can mark attendance once the day arrives.
        </p>
      ) : null}

      {periods.length === 0 ? (
        <motion.div
          key={selectedDate}
          className="native-card px-5 py-6 text-sm leading-6 text-[var(--color-text-secondary)]"
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
        <motion.div
          key={selectedDate}
          className="space-y-3"
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
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
};
