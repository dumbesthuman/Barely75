export type AttendanceStatus = "PRESENT" | "ABSENT" | "CANCELLED";
export type PeriodStatus = AttendanceStatus | null;
export type ThemeMode = "system" | "light" | "dark";

export interface Subject {
  id: string;
  name: string;
  teacher: string;
  targetAttendance: number;
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
}

export interface SettingsState {
  defaultTargetAttendance: number;
  themeMode: ThemeMode;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface AttendanceState {
  version: number;
  subjects: Subject[];
  schedule: ScheduleSlot[];
  periods: Period[];
  /** ISO dates when the user confirmed college is open on a Saturday or Sunday */
  weekendCollegeDays: string[];
  settings: SettingsState;
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
}
