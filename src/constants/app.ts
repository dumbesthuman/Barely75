import type { SettingsState } from "../types/attendance";

export const APP_NAME = "Barely 75";
export const THEME_COLOR_LIGHT = "#f2eee7";
export const THEME_COLOR_DARK = "#1a1b22";
export const APP_STATE_VERSION = 3;
export const STORAGE_KEY = "attendance-tracker.state";
export const LONG_PRESS_DURATION = 1500; // reduced from 3s for better UX
export const PERSISTENCE_DEBOUNCE_MS = 250;

export const DEFAULT_SETTINGS: SettingsState = {
  defaultTargetAttendance: 75,
  themeMode: "system",
  hapticsEnabled: true,
  reducedMotion: false,
  highContrast: false,
};

/** Subject color palette — vibrant, accessible, distinct */
export const SUBJECT_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f97316", // orange
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#ef4444", // red
  "#84cc16", // lime
] as const;

/** Pick next unused color from the palette given existing subject colors */
export const pickNextSubjectColor = (existingColors: (string | undefined)[]): string => {
  const used = new Set(existingColors.filter(Boolean));
  const next = SUBJECT_COLORS.find((c) => !used.has(c));
  return next ?? SUBJECT_COLORS[existingColors.length % SUBJECT_COLORS.length]!;
};
