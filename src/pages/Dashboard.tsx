import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AddSubjectSheet } from "../components/AddSubjectSheet";
import { AnalyticsCards } from "../components/AnalyticsCards";
import { AttendanceRing } from "../components/AttendanceRing";
import { BottomNavigation, type NavigationTab } from "../components/BottomNavigation";
import { EditSubjectSheet } from "../components/EditSubjectSheet";
import { FloatingAddSubjectButton } from "../components/FloatingAddSubjectButton";
import { InstallPrompt } from "../components/InstallPrompt";
import { ProgressWidgets } from "../components/ProgressWidgets";
import { PredictionCard } from "../components/PredictionCard";
import { SettingsSheet } from "../components/SettingsSheet";
import { SubjectCards } from "../components/SubjectCards";
import { ScheduleView } from "../components/ScheduleView";
import { SadCollegeModal } from "../components/SadCollegeModal";
import { createEmptySemesterPeriods } from "../constants/seed";
import { GENTLE_SPRING } from "../constants/motion";
import { useAttendance } from "../hooks/useAttendance";
import type { AttendanceState, ScheduleSlot, ThemeMode } from "../types/attendance";
import { formatFullDate } from "../utils/date";
import { vibrateForStatus } from "../utils/haptics";
import { SettingsIcon } from "../components/Icons";

const scheduleFingerprint = (slots: ScheduleSlot[]) =>
  slots
    .map((slot) =>
      [slot.dayOfWeek, slot.periodNumber, slot.startTime, slot.endTime, slot.room].join(":"),
    )
    .sort()
    .join("|");

const themeForDocument = (themeMode: ThemeMode) => {
  if (themeMode !== "system") {
    return themeMode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const isImportableState = (value: unknown): value is AttendanceState => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Partial<AttendanceState>;
  return (
    Array.isArray(state.subjects) &&
    Array.isArray(state.schedule) &&
    Array.isArray(state.periods) &&
    typeof state.settings === "object"
  );
};

export const Dashboard = () => {
  const {
    state,
    dispatch,
    overallMetrics,
    prediction,
    subjectMetrics,
    todayIso,
    getPeriodsForDate,
  } = useAttendance();
  const [activeTab, setActiveTab] = useState<NavigationTab>("overview");
  const [scheduleDate, setScheduleDate] = useState(todayIso);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState<string | null>(null);
  const [weekendAddContext, setWeekendAddContext] = useState<string | null>(null);
  const [sadModalDate, setSadModalDate] = useState<string | null>(null);

  const editingSubject = useMemo(
    () => state.subjects.find((subject) => subject.id === editSubjectId) ?? null,
    [editSubjectId, state.subjects],
  );

  const editingSchedule = useMemo(
    () => (editSubjectId ? state.schedule.filter((slot) => slot.subjectId === editSubjectId) : []),
    [editSubjectId, state.schedule],
  );

  useEffect(() => {
    dispatch({ type: "ensure-period-window", anchorDate: todayIso });
  }, [dispatch, todayIso]);

  useEffect(() => {
    if (activeTab === "schedule") {
      setScheduleDate(todayIso);
    }
  }, [activeTab, todayIso]);

  useEffect(() => {
    const documentTheme = themeForDocument(state.settings.themeMode);
    document.documentElement.dataset.theme = documentTheme;
    document.documentElement.dataset.contrast = state.settings.highContrast ? "high" : "default";
  }, [state.settings.highContrast, state.settings.themeMode]);

  const handleCycle = useCallback(
    (periodId: string, currentStatus: AttendanceState["periods"][number]["status"]) => {
      const nextStatus = currentStatus === "PRESENT" ? "ABSENT" : "PRESENT";
      dispatch({ type: "cycle-period", periodId });
      vibrateForStatus(nextStatus, state.settings.hapticsEnabled);
    },
    [dispatch, state.settings.hapticsEnabled],
  );

  const handleCancel = useCallback(
    (periodId: string) => {
      dispatch({ type: "cancel-period", periodId });
      vibrateForStatus("CANCELLED", state.settings.hapticsEnabled);
    },
    [dispatch, state.settings.hapticsEnabled],
  );

  const handleAdjustTarget = useCallback(
    (subjectId: string, nextTarget: number) => {
      dispatch({ type: "update-subject-target", subjectId, targetAttendance: nextTarget });
    },
    [dispatch],
  );

  const handleThemeChange = useCallback(
    (themeMode: ThemeMode) => {
      dispatch({ type: "update-settings", patch: { themeMode } });
    },
    [dispatch],
  );

  const handleSettingsPatch = useCallback(
    (patch: Partial<AttendanceState["settings"]>) => {
      dispatch({ type: "update-settings", patch });
    },
    [dispatch],
  );

  const handleApplyDefaultTarget = useCallback(() => {
    dispatch({ type: "apply-default-target" });
  }, [dispatch]);

  const handleResetSemester = useCallback(() => {
    dispatch({ type: "reset-semester", startDate: todayIso });
  }, [dispatch, todayIso]);

  const handleDeleteSubject = useCallback(
    (subjectId: string) => {
      dispatch({ type: "delete-subject", subjectId });
    },
    [dispatch],
  );

  const handleLoadSampleData = useCallback(() => {
    dispatch({ type: "load-sample-data", anchorDate: todayIso });
  }, [dispatch, todayIso]);

  const handleClearAllSubjects = useCallback(() => {
    dispatch({ type: "clear-all-subjects" });
  }, [dispatch]);

  const handleConfirmWeekendCollege = useCallback(
    (dateIso: string) => {
      const alreadyMarked = state.weekendCollegeDays.includes(dateIso);
      dispatch({ type: "mark-weekend-college", dateIso, anchorDate: todayIso });
      setScheduleDate(dateIso);
      if (!alreadyMarked) {
        setSadModalDate(dateIso);
      }
    },
    [dispatch, state.weekendCollegeDays, todayIso],
  );

  const handleSaveSubjectEdit = useCallback(
    (payload: {
      subjectId: string;
      patch: { name: string; teacher: string; targetAttendance: number };
      scheduleSlots: ScheduleSlot[];
    }) => {
      dispatch({
        type: "update-subject",
        subjectId: payload.subjectId,
        patch: payload.patch,
      });

      const currentSlots = state.schedule.filter((slot) => slot.subjectId === payload.subjectId);
      if (scheduleFingerprint(currentSlots) !== scheduleFingerprint(payload.scheduleSlots)) {
        dispatch({
          type: "update-subject-schedule",
          subjectId: payload.subjectId,
          scheduleSlots: payload.scheduleSlots,
          anchorDate: todayIso,
        });
      }
    },
    [dispatch, state.schedule, todayIso],
  );

  const exportState = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `attendance-tracker-${todayIso}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importState = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!isImportableState(parsed)) {
        return;
      }

      dispatch({ type: "import-state", state: parsed });
    } catch {
      return;
    }
  };

  const screen = useMemo(() => {
    switch (activeTab) {
      case "schedule":
        return (
          <ScheduleView
            todayIso={todayIso}
            selectedDate={scheduleDate}
            weekendCollegeDays={state.weekendCollegeDays}
            onSelectedDateChange={setScheduleDate}
            onConfirmWeekendCollege={handleConfirmWeekendCollege}
            periods={getPeriodsForDate(scheduleDate)}
            onCycle={handleCycle}
            onCancel={handleCancel}
          />
        );
      case "subjects":
        return (
          <SubjectCards
            subjects={subjectMetrics}
            onAdjustTarget={handleAdjustTarget}
            onEdit={setEditSubjectId}
            onDelete={handleDeleteSubject}
            onAddSubject={() => setAddSubjectOpen(true)}
          />
        );
      case "overview":
      default:
        return state.subjects.length === 0 ? (
          <motion.div
            className="native-card px-5 py-6 text-sm leading-6 text-[var(--color-text-secondary)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={GENTLE_SPRING}
          >
            Add your subjects to see attendance analytics, predictions, and weekly progress here.
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AttendanceRing metrics={overallMetrics} />
            <AnalyticsCards metrics={overallMetrics} />
            <PredictionCard metrics={overallMetrics} prediction={prediction} />
            <ProgressWidgets subjects={subjectMetrics} />
          </div>
        );
    }
  }, [
    activeTab,
    handleAdjustTarget,
    handleCancel,
    handleCycle,
    handleConfirmWeekendCollege,
    handleDeleteSubject,
    overallMetrics,
    prediction,
    scheduleDate,
    getPeriodsForDate,
    state.subjects.length,
    state.weekendCollegeDays,
    subjectMetrics,
    todayIso,
  ]);

  return (
    <MotionConfig reducedMotion={state.settings.reducedMotion ? "always" : "user"}>
      <LayoutGroup>
        <div className="app-shell mx-auto min-h-dvh max-w-[430px] px-4 pb-40 pt-safe-top">
          <header className="flex items-start justify-between gap-4 px-1 pb-5 pt-4">
            <div className="min-w-0">
              <p className="text-sm text-[var(--color-text-secondary)]">{formatFullDate(todayIso)}</p>
              <h1 className="mt-3 max-w-[8ch] text-[clamp(2.6rem,10vw,3.5rem)] font-semibold leading-[0.92] tracking-[-0.04em]">
                Attendance Tracker
              </h1>
              <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--color-text-secondary)]">
                Track attendance, manage your timetable, and share the app with classmates.
              </p>
            </div>
            <button
              type="button"
              className="focus-ring mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open settings"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
          </header>

          <AnimatePresence mode="wait">
            <motion.main
              key={activeTab}
              className="space-y-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={GENTLE_SPRING}
            >
              {activeTab === "overview" ? <InstallPrompt /> : null}
              {screen}
            </motion.main>
          </AnimatePresence>

          <FloatingAddSubjectButton onClick={() => setAddSubjectOpen(true)} />
          <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <SettingsSheet
          open={settingsOpen}
          state={state}
          onClose={() => setSettingsOpen(false)}
          onThemeChange={handleThemeChange}
          onUpdateSettings={handleSettingsPatch}
          onApplyDefaultTarget={handleApplyDefaultTarget}
          onResetSemester={handleResetSemester}
          onLoadSampleData={handleLoadSampleData}
          onClearAllSubjects={handleClearAllSubjects}
          onImportState={(file) => {
            void importState(file);
          }}
          onExportState={exportState}
        />

        <EditSubjectSheet
          open={editSubjectId !== null}
          subject={editingSubject}
          scheduleSlots={editingSchedule}
          onClose={() => setEditSubjectId(null)}
          onSave={handleSaveSubjectEdit}
        />

        <AddSubjectSheet
          open={addSubjectOpen}
          defaultTarget={state.settings.defaultTargetAttendance}
          weekendContext={weekendAddContext ? { dateIso: weekendAddContext } : undefined}
          onClose={() => {
            setAddSubjectOpen(false);
            setWeekendAddContext(null);
          }}
          onAddSubject={({ subject, scheduleSlots }) => {
            dispatch({
              type: "add-subject",
              subject,
              scheduleSlots,
              periods: createEmptySemesterPeriods(scheduleSlots, new Date(`${todayIso}T12:00:00`)),
            });
            dispatch({ type: "ensure-period-window", anchorDate: todayIso });
          }}
        />

        <SadCollegeModal
          open={sadModalDate !== null}
          dateIso={sadModalDate ?? todayIso}
          onClose={() => setSadModalDate(null)}
          onAddSubjects={() => {
            if (sadModalDate) {
              setWeekendAddContext(sadModalDate);
              setAddSubjectOpen(true);
            }
          }}
        />
      </LayoutGroup>
    </MotionConfig>
  );
};
