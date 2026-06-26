import type { SettingsState } from "../types/attendance";

export const APP_NAME = "Barely 75";
export const THEME_COLOR_LIGHT = "#f2eee7";
export const THEME_COLOR_DARK = "#1a1b22";
export const APP_STATE_VERSION = 3;
export const STORAGE_KEY = "attendance-tracker.state";
export const LONG_PRESS_DURATION = 3000; // hold for 3 seconds to reset on macOS
export const PERSISTENCE_DEBOUNCE_MS = 250;

export const DEFAULT_SETTINGS: SettingsState = {
  defaultTargetAttendance: 75,
  themeMode: "system",
  hapticsEnabled: true,
  reducedMotion: false,
  highContrast: false,
};
