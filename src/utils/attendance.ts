import type {
  AttendanceMetrics,
  AttendanceState,
  AttendanceStatus,
  Period,
  PeriodStatus,
  ScheduleSlot,
  Subject,
  SubjectWithMetrics,
} from "../types/attendance";

const roundPercentage = (value: number) => Math.round(value * 10) / 10;

export const cycleStatus = (status: PeriodStatus): PeriodStatus => {
  if (status === "PRESENT") {
    return "ABSENT";
  }
  return "PRESENT";
};

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

export const buildSubjectMetrics = (state: AttendanceState): SubjectWithMetrics[] =>
  state.subjects.map((subject) => ({
    subject,
    metrics: buildMetrics(
      state.periods.filter((period) => period.subjectId === subject.id),
      subject.targetAttendance,
    ),
  }));

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
      return "You’re holding the line. One more absence would put you at risk.";
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
): Subject => ({
  id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${crypto.randomUUID().slice(0, 8)}`,
  name,
  teacher,
  targetAttendance,
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
