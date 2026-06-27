import { APP_STATE_VERSION, PERSISTENCE_DEBOUNCE_MS, STORAGE_KEY } from "../constants/app";
import { createEmptyState, ensurePeriodWindow } from "../constants/seed";
import type { AttendanceState } from "../types/attendance";
import { getTodayIso } from "./date";

export interface PersistenceAdapter {
  load: () => AttendanceState;
  save: (state: AttendanceState) => void;
}

const isStateShape = (value: unknown): value is Partial<AttendanceState> => {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<AttendanceState>;
  return (
    typeof state.version === "number" &&
    Array.isArray(state.subjects) &&
    Array.isArray(state.schedule) &&
    Array.isArray(state.periods) &&
    typeof state.settings === "object"
  );
};

/**
 * Migrate state from any previous version to current.
 * Safe to call repeatedly — missing fields get sensible defaults.
 */
const migrateState = (raw: Partial<AttendanceState>): AttendanceState => {
  const empty = createEmptyState();
  return {
    ...empty,
    ...raw,
    version: APP_STATE_VERSION,
    // v4 additions — backfill if missing
    currentSemester: raw.currentSemester ?? null,
    archivedSemesters: raw.archivedSemesters ?? [],
    weekendCollegeDays: raw.weekendCollegeDays ?? [],
    settings: { ...empty.settings, ...(raw.settings ?? {}) },
  };
};

const hydrateState = (state: AttendanceState): AttendanceState => ({
  ...state,
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
      if (!isStateShape(parsed)) {
        return hydrateState(createEmptyState());
      }

      // Migrate older state versions (never wipe data outright)
      if ((parsed.version ?? 0) < APP_STATE_VERSION) {
        return hydrateState(migrateState(parsed));
      }

      return hydrateState(parsed as AttendanceState);
    } catch {
      return hydrateState(createEmptyState());
    }
  },
  save: (state) => {
    if (typeof window === "undefined") return;
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
