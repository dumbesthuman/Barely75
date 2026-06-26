import { motion } from "framer-motion";
import { GENTLE_SPRING, SPRING } from "../constants/motion";
import type { AttendanceMetrics } from "../types/attendance";
import { AnimatedNumber } from "./AnimatedNumber";

interface AttendanceRingProps {
  metrics: AttendanceMetrics;
}

const RADIUS = 76;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const AttendanceRing = ({ metrics }: AttendanceRingProps) => {
  const progress = Math.max(0, Math.min(100, metrics.attendanceRate));
  const dashOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;
  const status = progress >= metrics.targetAttendance ? "Safe" : "Needs Attention";
  const accent = progress >= metrics.targetAttendance ? "var(--color-success)" : "var(--color-danger)";

  return (
    <motion.section
      layout
      className="native-card relative overflow-hidden px-6 py-7"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={GENTLE_SPRING}
    >
      <div className="absolute inset-0 opacity-80" aria-hidden="true">
        <div
          className="absolute inset-x-8 top-0 h-32 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle at center, ${accent}22 0%, transparent 72%)` }}
        />
      </div>
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-secondary">
            Current standing
          </p>
          <h2 className="mt-2 text-[1.9rem] font-semibold leading-[1.02] tracking-tight">
            {status}
          </h2>
        </div>
        <div className="rounded-full bg-[color:var(--color-surface-elevated)] px-3 py-2 text-right">
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-secondary">
            Target
          </p>
          <p className="mt-1 text-base font-semibold tabular-nums">{metrics.targetAttendance}%</p>
        </div>
      </div>

      <div className="relative mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="relative h-44 w-44 shrink-0">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
            <circle
              cx="100"
              cy="100"
              r={RADIUS}
              stroke="var(--color-divider)"
              strokeWidth="14"
              fill="none"
            />
            <motion.circle
              cx="100"
              cy="100"
              r={RADIUS}
              stroke={accent}
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={SPRING}
              strokeDasharray={CIRCUMFERENCE}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatedNumber
              value={progress}
              suffix="%"
              decimals={1}
              className="text-4xl font-semibold tracking-tight"
            />
            <span className="mt-1 text-xs uppercase tracking-[0.24em] text-secondary">
              Attendance
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="mx-auto grid max-w-sm grid-cols-2 gap-3 sm:mx-0">
            <div className="rounded-[22px] bg-[color:var(--color-surface-elevated)] px-4 py-3">
              <p className="text-[0.72rem] uppercase tracking-[0.22em] text-secondary">
                {progress >= metrics.targetAttendance ? "Safe bunks" : "Need next"}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {progress >= metrics.targetAttendance ? metrics.safeBunks : metrics.recoveryClasses}
              </p>
            </div>
            <div className="rounded-[22px] bg-[color:var(--color-surface-elevated)] px-4 py-3">
              <p className="text-[0.72rem] uppercase tracking-[0.22em] text-secondary">
                Missed
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{metrics.absent}</p>
            </div>
          </div>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-secondary sm:mx-0">
            {progress >= metrics.targetAttendance
              ? `You are ${Math.max(0, progress - metrics.targetAttendance).toFixed(1)} points above your target.`
              : `You are ${(metrics.targetAttendance - progress).toFixed(1)} points below your target.`}
          </p>
        </div>
      </div>
    </motion.section>
  );
};
