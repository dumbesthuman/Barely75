import type { AttendanceStatus } from "../types/attendance";

const HAPTIC_DURATION: Record<AttendanceStatus, number> = {
  PRESENT: 10,
  ABSENT: 15,
  CANCELLED: 25,
};

export const vibrateForStatus = (status: AttendanceStatus, enabled: boolean) => {
  if (!enabled || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }

  navigator.vibrate(HAPTIC_DURATION[status]);
};
