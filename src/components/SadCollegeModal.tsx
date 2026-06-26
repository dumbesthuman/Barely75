import { motion } from "framer-motion";
import { GENTLE_SPRING } from "../constants/motion";
import { formatFullDate } from "../utils/date";

interface SadCollegeModalProps {
  open: boolean;
  dateIso: string;
  onClose: () => void;
  onAddSubjects: () => void;
}

export const SadCollegeModal = ({ open, dateIso, onClose, onAddSubjects }: SadCollegeModalProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="scrim"
        aria-label="Close"
        onClick={onClose}
      />
      <motion.div
        className="native-card relative z-10 w-full max-w-sm px-6 py-6 text-center"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={GENTLE_SPRING}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sad-college-title"
      >
        <p className="text-4xl" aria-hidden="true">
          😔
        </p>
        <h2 id="sad-college-title" className="mt-4 text-xl font-semibold tracking-tight">
          That&apos;s rough.
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          College on {formatFullDate(dateIso)}? We feel your pain. Weekends were supposed to be sacred.
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
          At least let&apos;s get your subjects on the schedule so you can track attendance.
        </p>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            className="primary-button w-full"
            onClick={() => {
              onAddSubjects();
              onClose();
            }}
          >
            Add subjects for this day
          </button>
          <button type="button" className="secondary-button w-full" onClick={onClose}>
            I&apos;ll survive somehow
          </button>
        </div>
      </motion.div>
    </div>
  );
};
