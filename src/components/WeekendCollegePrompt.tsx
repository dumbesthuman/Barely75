import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { formatFullDate, formatWeekday } from "../utils/date";

interface WeekendCollegePromptProps {
  dateIso: string;
  onConfirmCollege: (dateIso: string) => void;
  onSkipWeekend: () => void;
}

export const WeekendCollegePrompt = ({
  dateIso,
  onConfirmCollege,
  onSkipWeekend,
}: WeekendCollegePromptProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <section className="native-card px-4 py-4">
        <p className="text-sm font-medium">It&apos;s {formatWeekday(dateIso)} — college today?</p>
        <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
          Weekends are usually off. Only add classes if something is actually scheduled.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="primary-button" onClick={() => setConfirmOpen(true)}>
            Yes, college is on
          </button>
          <button type="button" className="secondary-button" onClick={onSkipWeekend}>
            No, day off
          </button>
        </div>
      </section>

      <BottomSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="College on a weekend?"
        description="Only mark this if classes are actually happening."
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            Confirm college on <strong>{formatFullDate(dateIso)}</strong>?
          </p>
          <div className="grid gap-2">
            <button
              type="button"
              className="primary-button w-full"
              onClick={() => {
                onConfirmCollege(dateIso);
                setConfirmOpen(false);
              }}
            >
              Yes, sadly college is on
            </button>
            <button type="button" className="secondary-button w-full" onClick={() => setConfirmOpen(false)}>
              Go back
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
