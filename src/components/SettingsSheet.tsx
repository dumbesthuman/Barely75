import { useRef } from "react";
import { BottomSheet } from "./BottomSheet";
import { DownloadIcon, RefreshIcon, TrashIcon, UploadIcon } from "./Icons";
import { ShareAppLink } from "./ShareAppLink";
import type { AttendanceState, ThemeMode } from "../types/attendance";
import { supportsHaptics } from "../utils/haptics";

interface SettingsSheetProps {
  open: boolean;
  state: AttendanceState;
  onClose: () => void;
  onThemeChange: (themeMode: ThemeMode) => void;
  onUpdateSettings: (patch: Partial<AttendanceState["settings"]>) => void;
  onApplyDefaultTarget: () => void;
  onResetSemester: () => void;
  onLoadSampleData: () => void;
  onClearAllSubjects: () => void;
  onImportState: (file: File) => void;
  onExportState: () => void;
}

const themeOptions: Array<{ value: ThemeMode; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export const SettingsSheet = ({
  open,
  state,
  onClose,
  onThemeChange,
  onUpdateSettings,
  onApplyDefaultTarget,
  onResetSemester,
  onLoadSampleData,
  onClearAllSubjects,
  onImportState,
  onExportState,
}: SettingsSheetProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Settings"
      description="Tune targets, appearance, and device behavior."
    >
      <div className="space-y-6">
        <ShareAppLink />

        <section className="space-y-3">
          <div className="section-heading">
            <h3>Target Attendance</h3>
            <p>Default threshold for new subjects</p>
          </div>
          <div className="native-card px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-secondary">Default target</span>
              <span className="text-lg font-semibold tabular-nums">
                {state.settings.defaultTargetAttendance}%
              </span>
            </div>
            <input
              className="mt-4 w-full accent-primary"
              type="range"
              min={60}
              max={95}
              step={1}
              value={state.settings.defaultTargetAttendance}
              onChange={(event) =>
                onUpdateSettings({ defaultTargetAttendance: Number(event.target.value) })
              }
              aria-label="Default attendance target"
            />
            <p className="mt-1 text-xs text-secondary">Range: 60% – 95%</p>
            <button type="button" className="secondary-button mt-4 w-full" onClick={onApplyDefaultTarget}>
              Apply to all subjects
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="section-heading">
            <h3>Theme</h3>
            <p>Optimized for calm contrast and deep blacks</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`toggle-chip ${state.settings.themeMode === option.value ? "is-active" : ""}`}
                onClick={() => onThemeChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="section-heading">
            <h3>Accessibility</h3>
            <p>Device-friendly controls for motion and contrast</p>
          </div>
          <div className="space-y-3">
            <ToggleRow
              label="Haptics"
              description={
                supportsHaptics()
                  ? "Vibrate when attendance status changes (Android)."
                  : "Haptics need Android — not supported on this device."
              }
              checked={state.settings.hapticsEnabled}
              onChange={(value) => onUpdateSettings({ hapticsEnabled: value })}
            />
            <ToggleRow
              label="Reduced motion"
              description="Dial animations down for comfort."
              checked={state.settings.reducedMotion}
              onChange={(value) => onUpdateSettings({ reducedMotion: value })}
            />
            <ToggleRow
              label="High contrast"
              description="Strengthen text and divider contrast."
              checked={state.settings.highContrast}
              onChange={(value) => onUpdateSettings({ highContrast: value })}
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="section-heading">
            <h3>Data</h3>
            <p>Keep your semester portable and recoverable</p>
          </div>
          <div className="grid gap-3">
            <button type="button" className="secondary-button" onClick={onExportState}>
              <DownloadIcon className="h-4 w-4" />
              Export JSON
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon className="h-4 w-4" />
              Import JSON
            </button>
            {/* Semester reset — now with confirmation dialog */}
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                if (
                  window.confirm(
                    "Reset semester? This will clear all attendance records and weekend markings, but keep your subjects and schedule. This cannot be undone.",
                  )
                ) {
                  onResetSemester();
                }
              }}
            >
              <RefreshIcon className="h-4 w-4" />
              Semester reset
            </button>
            {state.subjects.length === 0 ? (
              <button type="button" className="secondary-button" onClick={onLoadSampleData}>
                Load demo timetable
              </button>
            ) : (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Replace all current subjects with the demo timetable? Your attendance records will be reset.",
                    )
                  ) {
                    onLoadSampleData();
                  }
                }}
              >
                Replace with demo timetable
              </button>
            )}
            {state.subjects.length > 0 ? (
              <button
                type="button"
                className="secondary-button text-[var(--color-danger)]"
                onClick={() => {
                  if (
                    window.confirm(
                      "Remove all subjects and attendance records? This cannot be undone.",
                    )
                  ) {
                    onClearAllSubjects();
                  }
                }}
              >
                <TrashIcon className="h-4 w-4" />
                Clear all subjects
              </button>
            ) : null}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onImportState(file);
              }
              event.target.value = "";
            }}
          />
        </section>
      </div>
    </BottomSheet>
  );
};

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

const ToggleRow = ({ label, description, checked, onChange }: ToggleRowProps) => (
  <label className="native-card flex cursor-pointer items-center justify-between gap-4 px-4 py-4">
    <div>
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-sm leading-6 text-secondary">{description}</p>
    </div>
    <span
      className={`toggle-switch ${checked ? "is-active" : ""}`}
      onClick={(event) => {
        event.preventDefault();
        onChange(!checked);
      }}
    >
      <span className="toggle-knob" />
    </span>
  </label>
);
