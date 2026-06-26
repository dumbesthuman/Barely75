import { motion } from "framer-motion";
import type { SubjectWithMetrics } from "../types/attendance";
import { GENTLE_SPRING } from "../constants/motion";

interface ProgressWidgetsProps {
  subjects: SubjectWithMetrics[];
}

export const ProgressWidgets = ({ subjects }: ProgressWidgetsProps) => {
  const sortedByRate = [...subjects].sort(
    (left, right) => right.metrics.attendanceRate - left.metrics.attendanceRate,
  );
  const leader = sortedByRate[0];
  const risk = [...subjects].sort(
    (left, right) => left.metrics.attendanceRate - right.metrics.attendanceRate,
  )[0];
  const totalMissed = subjects.reduce((sum, item) => sum + item.metrics.absent, 0);

  const widgets = [
    {
      label: "Top performer",
      value: leader ? `${leader.metrics.attendanceRate.toFixed(1)}%` : "0%",
      copy: leader ? leader.subject.name : "No subjects yet",
    },
    {
      label: "Most at risk",
      value: risk ? `${risk.metrics.attendanceRate.toFixed(1)}%` : "0%",
      copy: risk ? risk.subject.name : "No subjects yet",
    },
    {
      label: "Missed so far",
      value: `${totalMissed}`,
      copy: totalMissed === 1 ? "One class missed" : `${totalMissed} classes missed`,
    },
  ];

  return (
    <section className="space-y-3">
      <div className="section-heading">
        <h2>Progress Widgets</h2>
        <p>Live highlights across the semester</p>
      </div>

      <div className="grid gap-3">
        {widgets.map((widget, index) => (
          <motion.article
            key={widget.label}
            className="native-card px-5 py-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...GENTLE_SPRING, delay: index * 0.03 }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-secondary">
                  {widget.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{widget.value}</p>
              </div>
              <p className="max-w-none text-sm leading-6 text-secondary sm:max-w-32 sm:text-right">
                {widget.copy}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};
