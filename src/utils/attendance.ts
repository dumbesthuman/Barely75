import type {
  AttendanceMetrics,
  AttendanceState,
  AttendanceStatus,
  Period,
  PeriodStatus,
  ScheduleSlot,
  StreakData,
  Subject,
  SubjectWithMetrics,
} from "../types/attendance";

const roundPercentage = (value: number) => Math.round(value * 10) / 10;

export const cyclePresentAbsent = (status: PeriodStatus): PeriodStatus => {
  if (status === "PRESENT") {
    return "ABSENT";
  }
  if (status === "ABSENT") {
    return "PRESENT";
  }
  return "PRESENT";
};

/** @deprecated Use cyclePresentAbsent */
export const cycleStatus = cyclePresentAbsent;

export const buildMetrics = (
  periods: Period[],
  targetAttendance: number,
): AttendanceMetrics => {
  const attended = periods.filter((period) => period.status === "PRESENT").length;
  const absent = periods.filter((period) => period.status === "ABSENT").length;
  const cancelled = periods.filter((period) => period.status === "CANCELLED").length;
  const conducted = attended + absent;
  const attendanceRate = conducted === 0 ? 0 : roundPercentage((attended / conducted) * 100);
  const ratio = targetAttendance / 100;

  const safeBunks =
    conducted === 0 || attendanceRate < targetAttendance
      ? 0
      : Math.max(0, Math.floor((attended - ratio * conducted) / ratio));

  const recoveryClasses =
    attendanceRate >= targetAttendance
      ? 0
      : Math.max(0, Math.ceil(((ratio * conducted) - attended) / (1 - ratio || 1)));

  return {
    conducted,
    attended,
    absent,
    cancelled,
    attendanceRate,
    safeBunks,
    recoveryClasses,
    targetAttendance,
  };
};

export const buildOverallMetrics = (state: AttendanceState) =>
  buildMetrics(
    state.periods,
    state.subjects.length === 0
      ? state.settings.defaultTargetAttendance
      : roundPercentage(
          state.subjects.reduce((sum, subject) => sum + subject.targetAttendance, 0) /
            state.subjects.length,
        ),
  );

/**
 * Build sparkline data for a subject: attendance rate per day (last N days with marked classes).
 * Returns an array of 0–100 values.
 */
const buildSparkline = (periods: Period[], maxPoints = 30): number[] => {
  // Group periods by date, only those with at least one marked class
  const byDate = new Map<string, { attended: number; conducted: number }>();
  for (const p of periods) {
    if (p.status === "PRESENT" || p.status === "ABSENT") {
      const entry = byDate.get(p.date) ?? { attended: 0, conducted: 0 };
      entry.conducted += 1;
      if (p.status === "PRESENT") entry.attended += 1;
      byDate.set(p.date, entry);
    }
  }

  // Sort dates ascending, take last maxPoints
  const sortedDates = Array.from(byDate.keys()).sort();
  const recent = sortedDates.slice(-maxPoints);

  return recent.map((date) => {
    const entry = byDate.get(date)!;
    return roundPercentage((entry.attended / entry.conducted) * 100);
  });
};

export const buildSubjectMetrics = (state: AttendanceState): SubjectWithMetrics[] =>
  state.subjects.map((subject) => {
    const subjectPeriods = state.periods.filter((period) => period.subjectId === subject.id);
    return {
      subject,
      metrics: buildMetrics(subjectPeriods, subject.targetAttendance),
      sparkline: buildSparkline(subjectPeriods),
    };
  });

export const buildPeriodsForDate = (
  state: AttendanceState,
  dateIso: string,
): Array<Period & { subject: Subject; slot: ScheduleSlot }> => {
  const subjectById = new Map(state.subjects.map((subject) => [subject.id, subject]));
  const slotByKey = new Map(
    state.schedule.map((slot) => [`${slot.subjectId}-${slot.periodNumber}`, slot]),
  );

  return state.periods
    .filter((period) => period.date === dateIso)
    .map((period) => {
      const subject = subjectById.get(period.subjectId);
      const slot = slotByKey.get(`${period.subjectId}-${period.periodNumber}`);

      if (!subject || !slot) {
        return null;
      }

      return {
        ...period,
        subject,
        slot,
      };
    })
    .filter((period): period is Period & { subject: Subject; slot: ScheduleSlot } => period !== null)
    .sort((left, right) => left.periodNumber - right.periodNumber);
};

export const buildTodayPeriods = (state: AttendanceState, todayIso: string) =>
  buildPeriodsForDate(state, todayIso);

export const getPredictionMessage = (metrics: AttendanceMetrics) => {
  if (metrics.attendanceRate >= metrics.targetAttendance) {
    if (metrics.safeBunks === 0) {
      return "You're holding the line. One more absence would put you at risk.";
    }
    return `You can safely bunk ${metrics.safeBunks} class${metrics.safeBunks === 1 ? "" : "es"}.`;
  }

  if (metrics.conducted === 0) {
    return "Mark your first class to unlock predictions.";
  }

  return `Attend the next ${metrics.recoveryClasses} class${metrics.recoveryClasses === 1 ? "" : "es"} to recover.`;
};

export const getStatusLabel = (status: PeriodStatus) => {
  switch (status) {
    case "PRESENT":
      return "Present";
    case "ABSENT":
      return "Absent";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Unmarked";
  }
};

export const getStatusAccent = (status: PeriodStatus) => {
  switch (status) {
    case "PRESENT":
      return "var(--color-success)";
    case "ABSENT":
      return "var(--color-danger)";
    case "CANCELLED":
      return "var(--color-neutral)";
    default:
      return "var(--color-surface-elevated)";
  }
};

export const createSubject = (
  name: string,
  teacher: string,
  targetAttendance: number,
  color?: string,
): Subject => ({
  id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${crypto.randomUUID().slice(0, 8)}`,
  name,
  teacher,
  targetAttendance,
  color,
});

export const createScheduleSlotsForSubject = (
  subjectId: string,
  weeklyMoments: Array<{ dayOfWeek: number; periodNumber: number; startTime: string; endTime: string; room: string }>,
): ScheduleSlot[] =>
  weeklyMoments.map((slot) => ({
    ...slot,
    subjectId,
    id: `${subjectId}-${slot.dayOfWeek}-${slot.periodNumber}`,
  }));

export const isAttendanceStatus = (value: unknown): value is AttendanceStatus =>
  value === "PRESENT" || value === "ABSENT" || value === "CANCELLED";

/**
 * Build streak data from all periods.
 * A streak day = any calendar day with at least one PRESENT or ABSENT period.
 */
export const buildStreakData = (periods: Period[], todayIso: string): StreakData => {
  // Get unique dates that had at least one conducted class (not all null/cancelled)
  const conductedDates = new Set(
    periods
      .filter((p) => p.status === "PRESENT" || p.status === "ABSENT")
      .map((p) => p.date),
  );

  const sortedDates = Array.from(conductedDates).sort();
  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate streaks (consecutive days with classes marked)
  let longestStreak = 1;
  let currentRun = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(`${sortedDates[i - 1]}T12:00:00`);
    const curr = new Date(`${sortedDates[i]!}T12:00:00`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    // Allow up to 3-day gap for weekends
    if (diffDays <= 3) {
      currentRun += 1;
      longestStreak = Math.max(longestStreak, currentRun);
    } else {
      currentRun = 1;
    }
  }

  // Current streak: count backward from today
  const lastDate = sortedDates[sortedDates.length - 1]!;
  const lastDateMs = new Date(`${lastDate}T12:00:00`).getTime();
  const todayMs = new Date(`${todayIso}T12:00:00`).getTime();
  const daysSinceLast = Math.round((todayMs - lastDateMs) / (1000 * 60 * 60 * 24));

  // If last marked date is more than 3 days ago, streak is broken
  let currentStreak = 0;
  if (daysSinceLast <= 3) {
    currentStreak = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const prev = new Date(`${sortedDates[i]!}T12:00:00`);
      const next = new Date(`${sortedDates[i + 1]!}T12:00:00`);
      const diff = Math.round((next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diff <= 3) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
};

/**
 * Validate that startTime < endTime. Returns null if valid, error string if invalid.
 */
export const validateTimeRange = (startTime: string, endTime: string): string | null => {
  if (!startTime || !endTime) return null;
  const [sh = 0, sm = 0] = startTime.split(":").map(Number);
  const [eh = 0, em = 0] = endTime.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  if (endMinutes <= startMinutes) {
    return "End time must be after start time";
  }
  return null;
};

/**
 * Check for duplicate day+period combinations within a slot list.
 * Returns array of duplicate slot IDs.
 */
export const findDuplicateSlots = (
  slots: Array<{ id: string; dayOfWeek: number; periodNumber: number }>,
): Set<string> => {
  const seen = new Map<string, string>();
  const duplicates = new Set<string>();
  for (const slot of slots) {
    const key = `${slot.dayOfWeek}-${slot.periodNumber}`;
    const existing = seen.get(key);
    if (existing) {
      duplicates.add(slot.id);
      duplicates.add(existing);
    } else {
      seen.set(key, slot.id);
    }
  }
  return duplicates;
};
