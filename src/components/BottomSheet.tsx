import { AnimatePresence, motion } from "framer-motion";
import type { PropsWithChildren, ReactNode } from "react";
import { QUICK_FADE, SHEET_SPRING } from "../constants/motion";

interface BottomSheetProps extends PropsWithChildren {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  headerAction?: ReactNode;
}

export const BottomSheet = ({
  open,
  title,
  description,
  onClose,
  headerAction,
  children,
}: BottomSheetProps) => (
  <AnimatePresence>
    {open ? (
      <>
        <motion.button
          type="button"
          className="scrim"
          onClick={onClose}
          aria-label="Close sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={QUICK_FADE}
        />
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="sheet-panel"
          initial={{ y: "110%", scale: 0.98 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: "110%", scale: 0.98 }}
          transition={SHEET_SPRING}
        >
          <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-[var(--color-divider)]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
              {description ? (
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
              ) : null}
            </div>
            {headerAction}
          </div>
          <div className="mt-6">{children}</div>
        </motion.section>
      </>
    ) : null}
  </AnimatePresence>
);
