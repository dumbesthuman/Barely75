import { APP_STATE_VERSION, DEFAULT_SETTINGS } from "../constants/app";
import { createEmptySemesterPeriods, createPeriodsForDate, createSampleState, ensurePeriodWindow } from "../constants/seed";
import type {
  ArchivedSemester,
  AttendanceState,
  PeriodStatus,
  ScheduleSlot,
  SemesterInfo,
  SettingsState,
  Subject,
} from "../types/attendance";
import { cyclePresentAbsent } from "../utils/attendance";
import { getTodayIso } from "../utils/date";

export type AttendanceAction =
  | { type: "cycle-period"; periodId: string }
  | { type: "set-period-status"; periodId: string; status: PeriodStatus }
  | { type: "clear-period"; periodId: string }
  | { type: "cancel-period"; periodId: string }
  | { type: "set-period-note"; periodId: string; note: string }
  | { type: "add-subject"; subject: Subject; scheduleSlots: ScheduleSlot[]; periods: AttendanceState["periods"] }
  | { type: "update-subject"; subjectId: string; patch: Pick<Subject, "name" | "teacher" | "targetAttendance"> }
  | {
      type: "update-subject-schedule";
      subjectId: string;
      scheduleSlots: ScheduleSlot[];
      anchorDate: string;
    }
  | { type: "delete-subject"; subjectId: string }
  | { type: "clear-all-subjects" }
  | { type: "load-sample-data"; anchorDate: string }
  | { type: "update-subject-target"; subjectId: string; targetAttendance: number }
  | { type: "update-settings"; patch: Partial<SettingsState> }
  | { type: "apply-default-target" }
  | { type: "reset-semester"; startDate: string }
  | { type: "ensure-period-window"; anchorDate: string }
  | { type: "mark-weekend-college"; dateIso: string; anchorDate: string }
  | { type: "import-state"; state: AttendanceState }
  | { type: "mark-all-periods-for-date"; dateIso: string; status: PeriodStatus }
  | { type: "set-semester"; semester: SemesterInfo }
  | { type: "update-semester"; patch: Partial<Omit<SemesterInfo, "id">> }
  | { type: "archive-and-start-new-semester"; newSemester: SemesterInfo };

const clampTarget = (value: number) => Math.min(95, Math.max(60, Math.round(value)));

/** Compute aggregate stats for archiving */
const computeArchiveStats = (state: AttendanceState) => {
  const attended = state.periods.filter((p) => p.status === "PRESENT").length;
  const absent = state.periods.filter((p) => p.status === "ABSENT").length;
  const conducted = attended + absent;
  const attendanceRate = conducted === 0 ? 0 : Math.round((attended / conducted) * 1000) / 10;
  return { conducted, attended, absent, attendanceRate };
};

export const attendanceReducer = (
  state: AttendanceState,
  action: AttendanceAction,
): AttendanceState => {
  switch (action.type) {
    case "cycle-period":
      return {
        ...state,
        periods: state.periods.map((period) =>
          period.id === action.periodId
            ? { ...period, status: cyclePresentAbsent(period.status) }
            : period,
        ),
      };
    case "set-period-status":
      return {
        ...state,
        periods: state.periods.map((period) =>
          period.id === action.periodId
            ? { ...period, status: action.status }
            : period,
        ),
      };
    case "clear-period":
      return {
        ...state,
        periods: state.periods.map((period) =>
          period.id === action.periodId
            ? { ...period, status: null, note: undefined }
            : period,
        ),
      };
    case "cancel-period":
      return {
        ...state,
        periods: state.periods.map((period) =>
          period.id === action.periodId
            ? { ...period, status: "CANCELLED" }
            : period,
        ),
      };
    case "set-period-note":
      return {
        ...state,
        periods: state.periods.map((period) =>
          period.id === action.periodId
            ? { ...period, note: action.note || undefined }
            : period,
        ),
      };
    case "mark-all-periods-for-date":
      return {
        ...state,
        periods: state.periods.map((period) =>
          period.date === action.dateIso
            ? { ...period, status: action.status }
            : period,
        ),
      };
    case "add-subject":
      return {
        ...state,
        subjects: [...state.subjects, action.subject],
        schedule: [...state.schedule, ...action.scheduleSlots],
        periods: [...state.periods, ...action.periods].sort((left, right) => {
          if (left.date !== right.date) return left.date.localeCompare(right.date);
          return left.periodNumber - right.periodNumber;
        }),
      };
    case "update-subject":
      return {
        ...state,
        subjects: state.subjects.map((subject) =>
          subject.id === action.subjectId
            ? {
                ...subject,
                name: action.patch.name.trim() || subject.name,
                teacher: action.patch.teacher.trim() || subject.teacher,
                targetAttendance: clampTarget(action.patch.targetAttendance),
              }
            : subject,
        ),
      };
    case "update-subject-schedule": {
      const updatedSchedule = [
        ...state.schedule.filter((slot) => slot.subjectId !== action.subjectId),
        ...action.scheduleSlots,
      ];
      const keptPeriods = state.periods.filter((period) => period.subjectId !== action.subjectId);
      const newPeriods = createEmptySemesterPeriods(
        action.scheduleSlots,
        new Date(`${action.anchorDate}T12:00:00`),
        150,
      );

      return {
        ...state,
        schedule: updatedSchedule,
        periods: ensurePeriodWindow(
          [...keptPeriods, ...newPeriods],
          updatedSchedule,
          action.anchorDate,
          state.weekendCollegeDays,
        ),
      };
    }
    case "delete-subject":
      return {
        ...state,
        subjects: state.subjects.filter((subject) => subject.id !== action.subjectId),
        schedule: state.schedule.filter((slot) => slot.subjectId !== action.subjectId),
        periods: state.periods.filter((period) => period.subjectId !== action.subjectId),
      };
    case "clear-all-subjects":
      return {
        ...state,
        subjects: [],
        schedule: [],
        periods: [],
        weekendCollegeDays: [],
      };
    case "load-sample-data": {
      const sample = createSampleState(new Date(`${action.anchorDate}T12:00:00`));
      return {
        ...state,
        subjects: sample.subjects,
        schedule: sample.schedule,
        periods: ensurePeriodWindow(
          sample.periods,
          sample.schedule,
          action.anchorDate,
          state.weekendCollegeDays,
        ),
        currentSemester: sample.currentSemester,
      };
    }
    case "update-subject-target":
      return {
        ...state,
        subjects: state.subjects.map((subject) =>
          subject.id === action.subjectId
            ? { ...subject, targetAttendance: clampTarget(action.targetAttendance) }
            : subject,
        ),
      };
    case "update-settings":
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.patch,
          defaultTargetAttendance:
            action.patch.defaultTargetAttendance === undefined
              ? state.settings.defaultTargetAttendance
              : clampTarget(action.patch.defaultTargetAttendance),
        },
      };
    case "apply-default-target":
      return {
        ...state,
        subjects: state.subjects.map((subject) => ({
          ...subject,
          targetAttendance: state.settings.defaultTargetAttendance,
        })),
      };

    case "set-semester":
      return {
        ...state,
        currentSemester: action.semester,
      };

    case "update-semester":
      if (!state.currentSemester) return state;
      return {
        ...state,
        currentSemester: {
          ...state.currentSemester,
          ...action.patch,
        },
      };

    case "archive-and-start-new-semester": {
      // Archive current semester with its stats and subjects
      const archived: ArchivedSemester[] = state.currentSemester
        ? [
            ...state.archivedSemesters,
            {
              semester: state.currentSemester,
              subjects: state.subjects,
              stats: computeArchiveStats(state),
              archivedAt: getTodayIso(),
            },
          ]
        : state.archivedSemesters;

      // Start fresh: keep subjects/schedule, clear periods + weekend days
      return {
        version: APP_STATE_VERSION,
        subjects: state.subjects,
        schedule: state.schedule,
        periods: createEmptySemesterPeriods(
          state.schedule,
          new Date(`${action.newSemester.startDate}T12:00:00`),
        ),
        weekendCollegeDays: [],
        settings: state.settings,
        currentSemester: action.newSemester,
        archivedSemesters: archived,
      };
    }

    case "reset-semester":
      return {
        version: APP_STATE_VERSION,
        subjects: state.subjects,
        schedule: state.schedule,
        periods: createEmptySemesterPeriods(state.schedule, new Date(`${action.startDate}T12:00:00`)),
        weekendCollegeDays: [],
        settings: state.settings,
        currentSemester: state.currentSemester,
        archivedSemesters: state.archivedSemesters,
      };

    case "ensure-period-window":
      return {
        ...state,
        periods: ensurePeriodWindow(
          state.periods,
          state.schedule,
          action.anchorDate,
          state.weekendCollegeDays,
        ),
      };

    case "mark-weekend-college": {
      if (state.weekendCollegeDays.includes(action.dateIso)) return state;

      const weekendCollegeDays = [...state.weekendCollegeDays, action.dateIso].sort();
      const newPeriods = createPeriodsForDate(action.dateIso, state.schedule, weekendCollegeDays);
      const existingIds = new Set(state.periods.map((period) => period.id));
      const additions = newPeriods.filter((period) => !existingIds.has(period.id));

      return {
        ...state,
        weekendCollegeDays,
        periods: [...state.periods, ...additions].sort((left, right) => {
          if (left.date !== right.date) return left.date.localeCompare(right.date);
          return left.periodNumber - right.periodNumber;
        }),
      };
    }

    case "import-state":
      return {
        ...action.state,
        weekendCollegeDays: action.state.weekendCollegeDays ?? [],
        currentSemester: action.state.currentSemester ?? null,
        archivedSemesters: action.state.archivedSemesters ?? [],
        settings: {
          ...DEFAULT_SETTINGS,
          ...action.state.settings,
        },
      };

    default:
      return state;
  }
};
