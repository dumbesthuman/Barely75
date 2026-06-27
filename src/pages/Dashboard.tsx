import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AddSubjectSheet } from "../components/AddSubjectSheet";
import { AnalyticsCards } from "../components/AnalyticsCards";
import { AttendanceRing } from "../components/AttendanceRing";
import { BottomDock } from "../components/BottomDock";
import type { NavigationTab } from "../components/BottomNavigation";
import { EditSubjectSheet } from "../components/EditSubjectSheet";
import { InstallPrompt } from "../components/InstallPrompt";
import { TabTransitionAura } from "../components/TabTransitionAura";
import { ProgressWidgets } from "../components/ProgressWidgets";
import { PredictionCard } from "../components/PredictionCard";
import { SettingsSheet } from "../components/SettingsSheet";
import { SubjectCards } from "../components/SubjectCards";
import { ScheduleView } from "../components/ScheduleView";
import { SadCollegeModal } from "../components/SadCollegeModal";
import { ToastContainer } from "../components/ToastContainer";
import { createEmptySemesterPeriods } from "../constants/seed";
import { APP_NAME, THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "../constants/app";
import { GENTLE_SPRING } from "../constants/motion";
import { useAttendance } from "../hooks/useAttendance";
import { useAppBackNavigation } from "../hooks/useAppBackNavigation";
import { useToast } from "../hooks/useToast";
import type { AttendanceState, PeriodStatus, ScheduleSlot, ThemeMode } from "../types/attendance";
import { formatFullDate } from "../utils/date";
import { vibrateClear, vibrateForStatus } from "../utils/haptics";
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
    streakData,
  } = useAttendance();
  const [activeTab, setActiveTab] = useState<NavigationTab>("overview");
  const [scheduleDate, setScheduleDate] = useState(todayIso);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState<string | null>(null);
  const [weekendAddContext, setWeekendAddContext] = useState<string | null>(null);
  const [sadModalDate, setSadModalDate] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

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

    const themeColor = documentTheme === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
    document.querySelector('meta[name="theme-color"]:not([media])')?.remove();
    let themeMeta = document.querySelector('meta[name="theme-color"][data-app-theme]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.setAttribute("name", "theme-color");
      themeMeta.setAttribute("data-app-theme", "true");
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute("content", themeColor);
  }, [state.settings.highContrast, state.settings.themeMode]);

  const handleCycle = useCallback(
    (periodId: string, currentStatus: AttendanceState["periods"][number]["status"]) => {
      const nextStatus = currentStatus === "PRESENT" ? "ABSENT" : "PRESENT";
      vibrateForStatus(nextStatus, state.settings.hapticsEnabled);
      dispatch({ type: "cycle-period", periodId });
    },
    [dispatch, state.settings.hapticsEnabled],
  );

  const handleClear = useCallback(
    (periodId: string) => {
      vibrateClear(state.settings.hapticsEnabled);
      dispatch({ type: "clear-period", periodId });
    },
    [dispatch, state.settings.hapticsEnabled],
  );

  const handleSetNote = useCallback(
    (periodId: string, note: string) => {
      dispatch({ type: "set-period-note", periodId, note });
    },
    [dispatch],
  );

  const handleBulkMark = useCallback(
    (dateIso: string, status: PeriodStatus) => {
      dispatch({ type: "mark-all-periods-for-date", dateIso, status });
      if (status === "PRESENT") addToast("All classes marked present ✓", "success");
      else if (status === "ABSENT") addToast("All classes marked absent", "info");
      else addToast("All marks cleared", "info");
    },
    [dispatch, addToast],
  );

  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const closeAddSubject = useCallback(() => {
    setAddSubjectOpen(false);
    setWeekendAddContext(null);
  }, []);
  const closeEditSubject = useCallback(() => setEditSubjectId(null), []);
  const closeSadModal = useCallback(() => setSadModalDate(null), []);

  const { navigateTab, pushLayer, closeWithHistory } = useAppBackNavigation({
    state: {
      activeTab,
      settingsOpen,
      addSubjectOpen,
      editSubjectId,
      sadModalDate,
    },
    setActiveTab,
    closeSettings,
    closeAddSubject,
    closeEditSubject,
    closeSadModal,
  });

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
    addToast("Default target applied to all subjects", "success");
  }, [dispatch, addToast]);

  const handleResetSemester = useCallback(() => {
    dispatch({ type: "reset-semester", startDate: todayIso });
    addToast("Semester reset — all records cleared", "info");
  }, [dispatch, todayIso, addToast]);

  const handleDeleteSubject = useCallback(
    (subjectId: string) => {
      const subject = state.subjects.find((s) => s.id === subjectId);
      dispatch({ type: "delete-subject", subjectId });
      if (subject) addToast(`${subject.name} deleted`, "info");
    },
    [dispatch, state.subjects, addToast],
  );

  const handleLoadSampleData = useCallback(() => {
    dispatch({ type: "load-sample-data", anchorDate: todayIso });
    addToast("Demo timetable loaded!", "success");
  }, [dispatch, todayIso, addToast]);

  const handleClearAllSubjects = useCallback(() => {
    dispatch({ type: "clear-all-subjects" });
    addToast("All subjects cleared", "info");
  }, [dispatch, addToast]);

  const handleSkipWeekend = useCallback(() => {
    setScheduleDate(todayIso);
  }, [todayIso]);

  const handleConfirmWeekendCollege = useCallback(
    (dateIso: string) => {
      const alreadyMarked = state.weekendCollegeDays.includes(dateIso);
      dispatch({ type: "mark-weekend-college", dateIso, anchorDate: todayIso });
      setScheduleDate(dateIso);
      if (!alreadyMarked) {
        setSadModalDate(dateIso);
        pushLayer();
      }
    },
    [dispatch, pushLayer, state.weekendCollegeDays, todayIso],
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
      addToast("Subject updated", "success");
    },
    [dispatch, state.schedule, todayIso, addToast],
  );

  const exportState = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `attendance-tracker-${todayIso}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    addToast("Data exported successfully!", "success");
  };

  const importState = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!isImportableState(parsed)) {
        addToast("Invalid file — couldn't import data", "error");
        return;
      }

      dispatch({ type: "import-state", state: parsed });
      addToast("Data imported successfully!", "success");
    } catch {
      addToast("Failed to read file — is it valid JSON?", "error");
    }
  };

  // Existing subject colors for auto-color picking
  const existingSubjectColors = useMemo(
    () => state.subjects.map((s) => s.color),
    [state.subjects],
  );

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
            onSkipWeekend={handleSkipWeekend}
            periods={getPeriodsForDate(scheduleDate)}
            onCycle={handleCycle}
            onClear={handleClear}
            onSetNote={handleSetNote}
            onBulkMark={handleBulkMark}
          />
        );
      case "subjects":
        return (
          <SubjectCards
            subjects={subjectMetrics}
            onAdjustTarget={handleAdjustTarget}
            onEdit={(subjectId) => {
              pushLayer();
              setEditSubjectId(subjectId);
            }}
            onDelete={handleDeleteSubject}
            onAddSubject={() => {
              pushLayer();
              setAddSubjectOpen(true);
            }}
          />
        );
      case "overview":
      default:
        return state.subjects.length === 0 ? (
          <motion.div
            className="native-card px-5 py-6 text-sm leading-6 text-secondary"
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
            <ProgressWidgets subjects={subjectMetrics} streakData={streakData} />
          </div>
        );
    }
  }, [
    activeTab,
    handleAdjustTarget,
    handleClear,
    handleCycle,
    handleSetNote,
    handleBulkMark,
    handleConfirmWeekendCollege,
    handleSkipWeekend,
    handleDeleteSubject,
    overallMetrics,
    prediction,
    pushLayer,
    scheduleDate,
    getPeriodsForDate,
    state.subjects.length,
    state.weekendCollegeDays,
    subjectMetrics,
    streakData,
    todayIso,
  ]);

  const sheetOpen =
    settingsOpen || addSubjectOpen || editSubjectId !== null || sadModalDate !== null;

  return (
    <MotionConfig reducedMotion={state.settings.reducedMotion ? "always" : "user"}>
      <div className="app-root mx-auto w-full min-h-dvh max-w-layout">
        <TabTransitionAura activeTab={activeTab} />
        <div className="app-shell px-4">
          <header className="flex items-start justify-between gap-4 px-1 pb-5 pt-3">
            <div className="min-w-0">
              <p className="text-sm text-secondary">{formatFullDate(todayIso)}</p>
              <h1 className="mt-3 max-w-[8ch] text-[clamp(2.6rem,10vw,3.5rem)] font-bold leading-[0.92] tracking-[-0.04em]" style={{ fontFamily: "var(--font-display)" }}>
                {APP_NAME}
              </h1>
              <p className="mt-3 max-w-xs text-sm leading-6 text-secondary">
                Track attendance, manage your timetable, and share the app with classmates.
              </p>
            </div>
            <button
              type="button"
              className="focus-ring mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-primary"
              onClick={() => {
                pushLayer();
                setSettingsOpen(true);
              }}
              aria-label="Open settings"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
          </header>

          <AnimatePresence mode="wait">
            <motion.main
              key={activeTab}
              className="app-main space-y-4"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === "overview" ? <InstallPrompt /> : null}
              {screen}
            </motion.main>
          </AnimatePresence>
        </div>

        <BottomDock
          hidden={sheetOpen}
          activeTab={activeTab}
          onNavigate={navigateTab}
          onAddSubject={() => {
            pushLayer();
            setAddSubjectOpen(true);
          }}
        />

        <SettingsSheet
          open={settingsOpen}
          state={state}
          onClose={() => closeWithHistory(closeSettings)}
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
          onClose={() => closeWithHistory(closeEditSubject)}
          onSave={handleSaveSubjectEdit}
        />

        <AddSubjectSheet
          open={addSubjectOpen}
          defaultTarget={state.settings.defaultTargetAttendance}
          weekendContext={weekendAddContext ? { dateIso: weekendAddContext } : undefined}
          existingSubjectColors={existingSubjectColors}
          onClose={() => closeWithHistory(closeAddSubject)}
          onAddSubject={({ subject, scheduleSlots }) => {
            dispatch({
              type: "add-subject",
              subject,
              scheduleSlots,
              periods: createEmptySemesterPeriods(scheduleSlots, new Date(`${todayIso}T12:00:00`)),
            });
            dispatch({ type: "ensure-period-window", anchorDate: todayIso });
            addToast(`${subject.name} added!`, "success");
          }}
        />

        <SadCollegeModal
          open={sadModalDate !== null}
          dateIso={sadModalDate ?? todayIso}
          onClose={() => closeWithHistory(closeSadModal)}
          onAddSubjects={() => {
            if (sadModalDate) {
              setWeekendAddContext(sadModalDate);
              pushLayer();
              setAddSubjectOpen(true);
            }
          }}
        />

        {/* Toast notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </MotionConfig>
  );
};
