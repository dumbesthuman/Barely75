import { AnimatePresence, motion } from "framer-motion";
import { QUICK_FADE, SPRING } from "../constants/motion";

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const AnimatedNumber = ({
  value,
  suffix,
  decimals = 0,
  className,
}: AnimatedNumberProps) => {
  const formatted = value.toFixed(decimals);

  return (
    <span className={className}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={formatted}
          className="inline-block tabular-nums"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{
            ...SPRING,
            opacity: QUICK_FADE,
          }}
        >
          {formatted}
        </motion.span>
      </AnimatePresence>
      {suffix ? <span>{suffix}</span> : null}
    </span>
  );
};
