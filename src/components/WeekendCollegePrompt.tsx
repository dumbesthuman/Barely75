import { useMemo, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { formatFullDate, formatWeekday, getNearestWeekendDates, isWeekendIso } from "../utils/date";

interface WeekendCollegePromptProps {
  todayIso: string;
  selectedDate: string;
  weekendCollegeDays: string[];
  onConfirmCollege: (dateIso: string) => void;
}

export const WeekendCollegePrompt = ({
  todayIso,
  selectedDate,
  weekendCollegeDays,
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

  if (viewingMarkedWeekend) {
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
        <p className="text-sm font-medium">Weekends are off by default</p>
        <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
          Saturday and Sunday are hidden while you scroll. Unexpected college day?
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="secondary-button"
            disabled={weekendCollegeDays.includes(saturday)}
            onClick={() => openConfirm(saturday)}
          >
            {weekendCollegeDays.includes(saturday) ? "Sat added" : `This ${formatWeekday(saturday)}`}
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={weekendCollegeDays.includes(sunday)}
            onClick={() => openConfirm(sunday)}
          >
            {weekendCollegeDays.includes(sunday) ? "Sun added" : `This ${formatWeekday(sunday)}`}
          </button>
        </div>
        {isWeekendIso(todayIso) && !weekendCollegeDays.includes(todayIso) ? (
          <button
            type="button"
            className="primary-button mt-2 w-full"
            onClick={() => openConfirm(todayIso)}
          >
            College today ({formatWeekday(todayIso)})?
          </button>
        ) : null}
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
