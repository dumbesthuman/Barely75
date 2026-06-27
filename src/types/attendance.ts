export type AttendanceStatus = "PRESENT" | "ABSENT" | "CANCELLED";
export type PeriodStatus = AttendanceStatus | null;
export type ThemeMode = "system" | "light" | "dark";

export interface Subject {
  id: string;
  name: string;
  teacher: string;
  targetAttendance: number;
  color?: string;
}

export interface ScheduleSlot {
  id: string;
  subjectId: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  room: string;
}

export interface Period {
  id: string;
  subjectId: string;
  date: string;
  periodNumber: number;
  status: PeriodStatus;
  note?: string;
}

export interface SettingsState {
  defaultTargetAttendance: number;
  themeMode: ThemeMode;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

/** Represents a semester with a user-defined name and date range */
export interface SemesterInfo {
  id: string;
  name: string;        // e.g. "Semester 5", "Even Sem 2025-26"
  startDate: string;   // ISO date string e.g. "2025-07-01"
  endDate: string;     // ISO date string e.g. "2025-11-30"
}

/** A snapshot of a completed semester stored for historical viewing */
export interface ArchivedSemester {
  semester: SemesterInfo;
  /** Subjects that existed in this semester */
  subjects: Subject[];
  /** Aggregate stats at time of archival */
  stats: {
    conducted: number;
    attended: number;
    absent: number;
    attendanceRate: number;
  };
  /** ISO date when this was archived */
  archivedAt: string;
}

export interface AttendanceState {
  version: number;
  subjects: Subject[];
  schedule: ScheduleSlot[];
  periods: Period[];
  /** ISO dates when the user confirmed college is open on a Saturday or Sunday */
  weekendCollegeDays: string[];
  settings: SettingsState;
  /** Current active semester — null means not yet configured */
  currentSemester: SemesterInfo | null;
  /** Archived past semesters */
  archivedSemesters: ArchivedSemester[];
}

export interface AttendanceMetrics {
  conducted: number;
  attended: number;
  absent: number;
  cancelled: number;
  attendanceRate: number;
  safeBunks: number;
  recoveryClasses: number;
  targetAttendance: number;
}

export interface SubjectWithMetrics {
  subject: Subject;
  metrics: AttendanceMetrics;
  /** Attendance rate per day for the last 30 marked days (sparkline data) */
  sparkline: number[];
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
}
