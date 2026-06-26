import { useMemo, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { formatFullDate, formatWeekday, getNearestWeekendDates, isWeekendIso } from "../utils/date";

interface WeekendCollegePromptProps {
  todayIso: string;
  selectedDate: string;
  weekendCollegeDays: string[];
  weekendArrived: boolean;
  onConfirmCollege: (dateIso: string) => void;
}

export const WeekendCollegePrompt = ({
  todayIso,
  selectedDate,
  weekendCollegeDays,
  weekendArrived,
  onConfirmCollege,
}: WeekendCollegePromptProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const { saturday, sunday } = useMemo(
    () => getNearestWeekendDates(selectedDate),
    [selectedDate],
  );

  const viewingMarkedWeekend =
    isWeekendIso(selectedDate) && weekendCollegeDays.includes(selectedDate);

  const hasUnmarkedWeekendNearby =
    !weekendCollegeDays.includes(saturday) || !weekendCollegeDays.includes(sunday);

  if (viewingMarkedWeekend || !hasUnmarkedWeekendNearby) {
    return null;
  }

  const openConfirm = (dateIso: string) => {
    if (weekendCollegeDays.includes(dateIso)) {
      onConfirmCollege(dateIso);
      return;
    }
    setPendingDate(dateIso);
    setConfirmOpen(true);
  };

  return (
    <>
      <section className="native-card px-4 py-4">
        <p className="text-sm font-medium">
          {weekendArrived ? `It’s ${formatWeekday(todayIso)} — college today?` : "Skipping a weekend?"}
        </p>
        <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
          {weekendArrived
            ? "Weekends are usually off. Tap below if classes are actually happening."
            : "Saturday and Sunday stay hidden unless you mark them."}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {!weekendCollegeDays.includes(saturday) ? (
            <button type="button" className="secondary-button" onClick={() => openConfirm(saturday)}>
              {weekendArrived && todayIso === saturday ? "Yes, college today" : `This ${formatWeekday(saturday)}`}
            </button>
          ) : null}
          {!weekendCollegeDays.includes(sunday) ? (
            <button type="button" className="secondary-button" onClick={() => openConfirm(sunday)}>
              {weekendArrived && todayIso === sunday ? "Yes, college today" : `This ${formatWeekday(sunday)}`}
            </button>
          ) : null}
        </div>
      </section>

      <BottomSheet
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingDate(null);
        }}
        title="College on a weekend?"
        description="Only mark this if classes are actually happening."
      >
        {pendingDate ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              Is there college on <strong>{formatFullDate(pendingDate)}</strong>?
            </p>
            <div className="grid gap-2">
              <button
                type="button"
                className="primary-button w-full"
                onClick={() => {
                  onConfirmCollege(pendingDate);
                  setConfirmOpen(false);
                  setPendingDate(null);
                }}
              >
                Yes, sadly college is on
              </button>
              <button
                type="button"
                className="secondary-button w-full"
                onClick={() => {
                  setConfirmOpen(false);
                  setPendingDate(null);
                }}
              >
                No, day off
              </button>
            </div>
          </div>
        ) : null}
      </BottomSheet>
    </>
  );
};
