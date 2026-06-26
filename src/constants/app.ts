import type { SettingsState } from "../types/attendance";

export const APP_NAME = "Attendance Tracker";
export const APP_STATE_VERSION = 3;
export const STORAGE_KEY = "attendance-tracker.state";
export const LONG_PRESS_DURATION = 500;
export const PERSISTENCE_DEBOUNCE_MS = 250;

export const DEFAULT_SETTINGS: SettingsState = {
  defaultTargetAttendance: 75,
  themeMode: "system",
  hapticsEnabled: true,
  reducedMotion: false,
  highContrast: false,
};
