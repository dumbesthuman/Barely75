import type { AttendanceStatus } from "../types/attendance";

const HAPTIC_PATTERNS: Record<AttendanceStatus, number | number[]> = {
  PRESENT: [0, 45],
  ABSENT: [0, 35, 40, 55],
  CANCELLED: [0, 30, 35, 30, 35, 70],
};

const canVibrate = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.vibrate === "function" &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const vibrateForStatus = (status: AttendanceStatus, enabled: boolean) => {
  if (!enabled || !canVibrate()) {
    return;
  }

  try {
    navigator.vibrate(HAPTIC_PATTERNS[status]);
  } catch {
    return;
  }
};

export const vibrateTap = (enabled: boolean) => {
  if (!enabled || !canVibrate()) {
    return;
  }

  try {
    navigator.vibrate(20);
  } catch {
    return;
  }
};

export const vibrateClear = (enabled: boolean) => {
  if (!enabled || !canVibrate()) {
    return;
  }

  try {
    navigator.vibrate(15);
  } catch {
    return;
  }
};

export const supportsHaptics = () => canVibrate();
