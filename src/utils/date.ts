const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});

const compactDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTodayIso = () => toIsoDate(new Date());

export const parseIsoDate = (value: string) => new Date(`${value}T12:00:00`);

export const addDaysToIso = (value: string, days: number) => {
  const next = parseIsoDate(value);
  next.setDate(next.getDate() + days);
  return toIsoDate(next);
};

export const compareIsoDates = (left: string, right: string) =>
  left === right ? 0 : left < right ? -1 : 1;

export const getDayOffsetLabel = (value: string, todayIso = getTodayIso()) => {
  const diff = Math.round(
    (parseIsoDate(value).getTime() - parseIsoDate(todayIso).getTime()) / DAY_IN_MS,
  );

  if (diff === 0) {
    return "Today";
  }
  if (diff === -1) {
    return "Yesterday";
  }
  if (diff === 1) {
    return "Tomorrow";
  }
  if (diff < -1) {
    return `${Math.abs(diff)} days ago`;
  }
  return `In ${diff} days`;
};

export const isWeekendIso = (value: string) => {
  const day = parseIsoDate(value).getDay();
  return day === 0 || day === 6;
};

export const getDayOfWeekIso = (value: string) => parseIsoDate(value).getDay();

export const isNavigableScheduleDay = (value: string, weekendCollegeDays: string[]) => {
  if (!isWeekendIso(value)) {
    return true;
  }
  return weekendCollegeDays.includes(value);
};

export const findNextSchedulableDay = (
  dateIso: string,
  direction: -1 | 1,
  weekendCollegeDays: string[],
) => {
  let cursor = dateIso;
  for (let step = 0; step < 14; step += 1) {
    cursor = addDaysToIso(cursor, direction);
    if (isNavigableScheduleDay(cursor, weekendCollegeDays)) {
      return cursor;
    }
  }
  return addDaysToIso(dateIso, direction);
};

export const getNearestWeekendDates = (anchorIso: string) => {
  const anchor = parseIsoDate(anchorIso);
  const saturday = new Date(anchor);
  const sunday = new Date(anchor);
  const day = anchor.getDay();

  if (day === 6) {
    saturday.setDate(anchor.getDate());
    sunday.setDate(anchor.getDate() + 1);
  } else if (day === 0) {
    saturday.setDate(anchor.getDate() - 1);
    sunday.setDate(anchor.getDate());
  } else {
    const daysUntilSaturday = (6 - day + 7) % 7 || 7;
    saturday.setDate(anchor.getDate() + daysUntilSaturday);
    sunday.setDate(saturday.getDate() + 1);
  }

  return {
    saturday: toIsoDate(saturday),
    sunday: toIsoDate(sunday),
  };
};

export const formatFullDate = (value: string) => dateFormatter.format(parseIsoDate(value));
export const formatCompactDate = (value: string) =>
  compactDateFormatter.format(parseIsoDate(value));

export const formatWeekday = (value: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(parseIsoDate(value));

export const formatTimeRange = (startTime: string, endTime: string) => {
  const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
  const [endHour = 0, endMinute = 0] = endTime.split(":").map(Number);

  const start = new Date();
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date();
  end.setHours(endHour, endMinute, 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).formatRange(start, end);
};
