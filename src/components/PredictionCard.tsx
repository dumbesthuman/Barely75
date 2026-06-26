import { motion } from "framer-motion";
import { GENTLE_SPRING } from "../constants/motion";
import type { AttendanceMetrics } from "../types/attendance";
import { SparkIcon } from "./Icons";

interface PredictionCardProps {
  metrics: AttendanceMetrics;
  prediction: string;
}

export const PredictionCard = ({ metrics, prediction }: PredictionCardProps) => {
  const accent = metrics.attendanceRate >= metrics.targetAttendance ? "var(--color-success)" : "var(--color-danger)";

  return (
    <motion.section
      layout
      className="native-card overflow-hidden px-5 py-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={GENTLE_SPRING}
    >
      <div
        className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: `${accent}18`, color: accent }}
      >
        <SparkIcon className="h-5 w-5" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-secondary">Prediction</p>
        <p className="text-lg font-medium leading-7">{prediction}</p>
      </div>
    </motion.section>
  );
};
