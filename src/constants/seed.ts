import type {
  AttendanceState,
  Period,
  PeriodStatus,
  ScheduleSlot,
  Subject,
} from "../types/attendance";
import { APP_STATE_VERSION, DEFAULT_SETTINGS, SUBJECT_COLORS } from "./app";

const SUBJECT_SEEDS: Subject[] = [
  {
    id: "algorithms",
    name: "Advanced Algorithms",
    teacher: "Dr. Priya Raman",
    targetAttendance: 78,
    color: SUBJECT_COLORS[0],
  },
  {
    id: "distributed-systems",
    name: "Distributed Systems",
    teacher: "Prof. Neil D'Souza",
    targetAttendance: 75,
    color: SUBJECT_COLORS[1],
  },
  {
    id: "machine-learning",
    name: "Machine Learning",
    teacher: "Dr. Kavya Menon",
    targetAttendance: 80,
    color: SUBJECT_COLORS[2],
  },
  {
    id: "compiler-design",
    name: "Compiler Design",
    teacher: "Prof. Arjun Khanna",
    targetAttendance: 74,
    color: SUBJECT_COLORS[3],
  },
  {
    id: "cloud-computing",
    name: "Cloud Computing",
    teacher: "Dr. Sana Iqbal",
    targetAttendance: 76,
    color: SUBJECT_COLORS[4],
  },
  {
    id: "capstone-lab",
    name: "Capstone Lab",
    teacher: "Mentor Rhea Thomas",
    targetAttendance: 85,
    color: SUBJECT_COLORS[5],
  },
];

const SCHEDULE_SEEDS: Omit<ScheduleSlot, "id">[] = [
  { subjectId: "algorithms", dayOfWeek: 1, periodNumber: 1, startTime: "08:30", endTime: "09:20", room: "CSE-402" },
  { subjectId: "machine-learning", dayOfWeek: 1, periodNumber: 2, startTime: "09:30", endTime: "10:20", room: "AI-201" },
  { subjectId: "compiler-design", dayOfWeek: 1, periodNumber: 4, startTime: "11:20", endTime: "12:10", room: "CSE-305" },
  { subjectId: "capstone-lab", dayOfWeek: 1, periodNumber: 6, startTime: "14:00", endTime: "15:40", room: "Innovation Lab" },
  { subjectId: "distributed-systems", dayOfWeek: 2, periodNumber: 1, startTime: "08:30", endTime: "09:20", room: "NET-110" },
  { subjectId: "cloud-computing", dayOfWeek: 2, periodNumber: 3, startTime: "10:30", endTime: "11:20", room: "CLOUD-5" },
  { subjectId: "machine-learning", dayOfWeek: 2, periodNumber: 5, startTime: "13:00", endTime: "13:50", room: "AI-201" },
  { subjectId: "capstone-lab", dayOfWeek: 2, periodNumber: 6, startTime: "14:00", endTime: "15:40", room: "Innovation Lab" },
  { subjectId: "compiler-design", dayOfWeek: 3, periodNumber: 2, startTime: "09:30", endTime: "10:20", room: "CSE-305" },
  { subjectId: "algorithms", dayOfWeek: 3, periodNumber: 3, startTime: "10:30", endTime: "11:20", room: "CSE-402" },
  { subjectId: "distributed-systems", dayOfWeek: 3, periodNumber: 5, startTime: "13:00", endTime: "13:50", room: "NET-110" },
  { subjectId: "cloud-computing", dayOfWeek: 4, periodNumber: 1, startTime: "08:30", endTime: "09:20", room: "CLOUD-5" },
  { subjectId: "machine-learning", dayOfWeek: 4, periodNumber: 2, startTime: "09:30", endTime: "10:20", room: "AI-201" },
  { subjectId: "capstone-lab", dayOfWeek: 4, periodNumber: 4, startTime: "11:20", endTime: "13:00", room: "Innovation Lab" },
  { subjectId: "algorithms", dayOfWeek: 5, periodNumber: 1, startTime: "08:30", endTime: "09:20", room: "CSE-402" },
  { subjectId: "distributed-systems", dayOfWeek: 5, periodNumber: 2, startTime: "09:30", endTime: "10:20", room: "NET-110" },
  { subjectId: "cloud-computing", dayOfWeek: 5, periodNumber: 4, startTime: "11:20", endTime: "12:10", room: "CLOUD-5" },
  { subjectId: "compiler-design", dayOfWeek: 5, periodNumber: 5, startTime: "13:00", endTime: "13:50", room: "CSE-305" },
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

import { toIsoDate } from "../utils/date";

const toMidday = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);

const isAcademicDay = (date: Date) => {
  const day = date.getDay();
  return day >= 1 && day <= 5;
};

const shouldScheduleDay = (date: Date, weekendCollegeDays: string[]) => {
  const day = date.getDay();
  if (day >= 1 && day <= 5) {
    return true;
  }
  return weekendCollegeDays.includes(toIsoDate(date));
};

export const createPeriodsForDate = (
  dateIso: string,
  schedule: ScheduleSlot[],
  weekendCollegeDays: string[],
) => {
  const date = toMidday(new Date(`${dateIso}T12:00:00`));
  if (!shouldScheduleDay(date, weekendCollegeDays)) {
    return [];
  }

  const daySchedule = schedule.filter((slot) => slot.dayOfWeek === date.getDay());
  return daySchedule.map((slot) => ({
    id: `${dateIso}-${slot.subjectId}-${slot.periodNumber}`,
    subjectId: slot.subjectId,
    date: dateIso,
    periodNumber: slot.periodNumber,
    status: null as PeriodStatus,
  }));
};

export const ensurePeriodWindow = (
  periods: Period[],
  schedule: ScheduleSlot[],
  anchorIso: string,
  weekendCollegeDays: string[] = [],
  pastDays = 150, // extended from 90 to 150 to cover more semester history
  futureDays = 60,
) => {
  const existingIds = new Set(periods.map((period) => period.id));
  const anchor = toMidday(new Date(`${anchorIso}T12:00:00`));
  const additions: Period[] = [];

  for (let offset = -pastDays; offset <= futureDays; offset += 1) {
    const current = new Date(anchor.getTime() + offset * DAY_IN_MS);
    if (!shouldScheduleDay(current, weekendCollegeDays)) {
      continue;
    }

    const dateIso = toIsoDate(current);
    const daySchedule = schedule.filter((slot) => slot.dayOfWeek === current.getDay());

    for (const slot of daySchedule) {
      const id = `${dateIso}-${slot.subjectId}-${slot.periodNumber}`;
      if (existingIds.has(id)) {
        continue;
      }

      existingIds.add(id);
      additions.push({
        id,
        subjectId: slot.subjectId,
        date: dateIso,
        periodNumber: slot.periodNumber,
        status: null,
      });
    }
  }

  if (additions.length === 0) {
    return periods;
  }

  return [...periods, ...additions].sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }
    return left.periodNumber - right.periodNumber;
  });
};

const buildSchedule = () =>
  SCHEDULE_SEEDS.map((slot) => ({
    ...slot,
    id: `${slot.subjectId}-${slot.dayOfWeek}-${slot.periodNumber}`,
  }));

const statusForPeriod = (subjectIndex: number, dayIndex: number, periodNumber: number): PeriodStatus => {
  const fingerprint = (subjectIndex + 1) * 11 + dayIndex * 7 + periodNumber * 13;
  if (fingerprint % 19 === 0) {
    return "CANCELLED";
  }
  if (fingerprint % 5 === 0 || fingerprint % 11 === 0) {
    return "ABSENT";
  }
  return "PRESENT";
};

const buildHistoricalPeriods = (
  schedule: ScheduleSlot[],
  today: Date,
  historyWeeks: number,
) => {
  const startDate = toMidday(today);
  startDate.setDate(startDate.getDate() - historyWeeks * 7);

  const periods: Period[] = [];
  const todayIso = toIsoDate(today);

  for (let cursor = new Date(startDate); cursor <= today; cursor = new Date(cursor.getTime() + DAY_IN_MS)) {
    if (!isAcademicDay(cursor)) {
      continue;
    }

    const dateIso = toIsoDate(cursor);
    const dayOfWeek = cursor.getDay();
    const dailySchedule = schedule.filter((slot) => slot.dayOfWeek === dayOfWeek);

    for (const slot of dailySchedule) {
      const subjectIndex = SUBJECT_SEEDS.findIndex((subject) => subject.id === slot.subjectId);
      const dayIndex = Math.floor((cursor.getTime() - startDate.getTime()) / DAY_IN_MS);
      const status = dateIso === todayIso ? null : statusForPeriod(subjectIndex, dayIndex, slot.periodNumber);

      periods.push({
        id: `${dateIso}-${slot.subjectId}-${slot.periodNumber}`,
        subjectId: slot.subjectId,
        date: dateIso,
        periodNumber: slot.periodNumber,
        status,
      });
    }
  }

  return periods.sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }
    return left.periodNumber - right.periodNumber;
  });
};

export const createEmptyState = (): AttendanceState => ({
  version: APP_STATE_VERSION,
  subjects: [],
  schedule: [],
  periods: [],
  weekendCollegeDays: [],
  settings: DEFAULT_SETTINGS,
});

export const createSampleState = (today = new Date()): AttendanceState => {
  const currentDate = toMidday(today);
  const schedule = buildSchedule();

  return {
    version: APP_STATE_VERSION,
    subjects: SUBJECT_SEEDS,
    schedule,
    periods: buildHistoricalPeriods(schedule, currentDate, 14),
    weekendCollegeDays: [],
    settings: DEFAULT_SETTINGS,
  };
};

/** @deprecated Use createEmptyState or createSampleState */
export const createSeedState = createSampleState;

export const createEmptySemesterPeriods = (
  schedule: ScheduleSlot[],
  startDate: Date,
  days = 35,
) => {
  const periods: Period[] = [];
  const cursor = toMidday(startDate);

  for (let offset = 0; offset < days; offset += 1) {
    const current = new Date(cursor.getTime() + offset * DAY_IN_MS);
    if (!isAcademicDay(current)) {
      continue;
    }

    const daySchedule = schedule.filter((slot) => slot.dayOfWeek === current.getDay());
    const dateIso = toIsoDate(current);

    for (const slot of daySchedule) {
      periods.push({
        id: `${dateIso}-${slot.subjectId}-${slot.periodNumber}`,
        subjectId: slot.subjectId,
        date: dateIso,
        periodNumber: slot.periodNumber,
        status: null,
      });
    }
  }

  return periods;
};
