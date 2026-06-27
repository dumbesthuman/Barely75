import { AnimatePresence, motion } from "framer-motion";
import type { Toast } from "../hooks/useToast";

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const toastColors = {
  success: { bg: "var(--color-success)", text: "white" },
  error: { bg: "var(--color-danger)", text: "white" },
  info: { bg: "var(--color-text-primary)", text: "var(--color-surface)" },
};

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => (
  <div
    className="toast-container"
    aria-live="polite"
    aria-label="Notifications"
  >
    <AnimatePresence mode="popLayout">
      {toasts.map((toast) => {
        const colors = toastColors[toast.type];
        return (
          <motion.button
            key={toast.id}
            type="button"
            className="toast-item"
            style={{ backgroundColor: colors.bg, color: colors.text }}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={() => onRemove(toast.id)}
            aria-label={`Dismiss: ${toast.message}`}
          >
            {toast.message}
          </motion.button>
        );
      })}
    </AnimatePresence>
  </div>
);
