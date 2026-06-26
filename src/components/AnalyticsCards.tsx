import { motion } from "framer-motion";
import { GENTLE_SPRING } from "../constants/motion";
import type { AttendanceMetrics } from "../types/attendance";
import { AnimatedNumber } from "./AnimatedNumber";

interface AnalyticsCardsProps {
  metrics: AttendanceMetrics;
}

const cards = (metrics: AttendanceMetrics) => [
  { label: "Conducted", value: metrics.conducted, caption: "Present + absent" },
  { label: "Attended", value: metrics.attended, caption: "Marked present" },
  {
    label: metrics.attendanceRate >= metrics.targetAttendance ? "Safe bunks" : "Recovery",
    value: metrics.attendanceRate >= metrics.targetAttendance ? metrics.safeBunks : metrics.recoveryClasses,
    caption:
      metrics.attendanceRate >= metrics.targetAttendance ? "Classes you can skip" : "Classes to recover",
  },
  { label: "Missed", value: metrics.absent, caption: "Marked absent" },
];

export const AnalyticsCards = ({ metrics }: AnalyticsCardsProps) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4">
    {cards(metrics).map((card, index) => (
      <motion.article
        key={card.label}
        layout
        className="native-card px-4 py-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...GENTLE_SPRING, delay: index * 0.04 }}
      >
        <p className="text-xs uppercase tracking-[0.22em] text-secondary">
          {card.label}
        </p>
        <AnimatedNumber value={card.value} className="mt-3 text-[2rem] font-semibold tracking-tight" />
        <p className="mt-2 text-sm leading-5 text-secondary">{card.caption}</p>
      </motion.article>
    ))}
  </div>
);
