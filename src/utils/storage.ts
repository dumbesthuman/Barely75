import { APP_STATE_VERSION, PERSISTENCE_DEBOUNCE_MS, STORAGE_KEY } from "../constants/app";
import { createEmptyState, ensurePeriodWindow } from "../constants/seed";
import type { AttendanceState } from "../types/attendance";
import { getTodayIso } from "./date";

export interface PersistenceAdapter {
  load: () => AttendanceState;
  save: (state: AttendanceState) => void;
}

const isStateShape = (value: unknown): value is AttendanceState => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Partial<AttendanceState>;
  return (
    typeof state.version === "number" &&
    Array.isArray(state.subjects) &&
    Array.isArray(state.schedule) &&
    Array.isArray(state.periods) &&
    typeof state.settings === "object"
  );
};

const hydrateState = (state: AttendanceState): AttendanceState => ({
  ...state,
  weekendCollegeDays: state.weekendCollegeDays ?? [],
  periods: ensurePeriodWindow(
    state.periods,
    state.schedule,
    getTodayIso(),
    state.weekendCollegeDays ?? [],
  ),
});

export const localStorageAdapter: PersistenceAdapter = {
  load: () => {
    if (typeof window === "undefined") {
      return hydrateState(createEmptyState());
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return hydrateState(createEmptyState());
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!isStateShape(parsed) || parsed.version !== APP_STATE_VERSION) {
        return hydrateState(createEmptyState());
      }

      return hydrateState(parsed);
    } catch {
      return hydrateState(createEmptyState());
    }
  },
  save: (state) => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
};

export const createDebouncedSaver = (save: (state: AttendanceState) => void) => {
  let timeoutId: number | undefined;

  return (state: AttendanceState) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => save(state), PERSISTENCE_DEBOUNCE_MS);
  };
};
