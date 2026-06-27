import { useEffect, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { PlusIcon } from "./Icons";
import { createScheduleSlotsForSubject, createSubject, findDuplicateSlots, validateTimeRange } from "../utils/attendance";
import type { ScheduleSlot, Subject } from "../types/attendance";
import { formatFullDate, getDayOfWeekIso } from "../utils/date";
import { pickNextSubjectColor } from "../constants/app";

interface AddSubjectSheetProps {
  open: boolean;
  defaultTarget: number;
  weekendContext?: { dateIso: string };
  existingSubjectColors?: (string | undefined)[];
  onClose: () => void;
  onAddSubject: (payload: { subject: Subject; scheduleSlots: ScheduleSlot[] }) => void;
}

interface DraftSlot {
  id: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  room: string;
}

const weekdayOptions = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
];

const weekendOptions = [
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

const createDraftSlot = (index: number, dayOfWeek = 1): DraftSlot => ({
  id: `slot-${index}-${Date.now()}`,
  dayOfWeek,
  periodNumber: index + 1,
  startTime: "08:30",
  endTime: "09:20",
  room: "",
});

export const AddSubjectSheet = ({
  open,
  defaultTarget,
  weekendContext,
  existingSubjectColors = [],
  onClose,
  onAddSubject,
}: AddSubjectSheetProps) => {
  const weekendDay = weekendContext ? getDayOfWeekIso(weekendContext.dateIso) : null;
  const dayOptions =
    weekendDay === null
      ? weekdayOptions
      : weekendOptions.filter((option) => option.value === weekendDay);

  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [targetAttendance, setTargetAttendance] = useState(defaultTarget);
  const [slots, setSlots] = useState<DraftSlot[]>([createDraftSlot(0, weekendDay ?? 1)]);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setName("");
    setTeacher("");
    setTargetAttendance(defaultTarget);
    setSlots([createDraftSlot(0, weekendDay ?? 1)]);
    setSubmitted(false);
  };

  useEffect(() => {
    if (open) {
      setTargetAttendance(defaultTarget);
      setSlots([createDraftSlot(0, weekendDay ?? 1)]);
      setSubmitted(false);
    }
  }, [defaultTarget, open, weekendDay]);

  const handleClose = () => {
    reset();
    onClose();
  };

  // Validation
  const nameError = submitted && name.trim().length === 0 ? "Subject name is required" : null;
  const teacherError = submitted && teacher.trim().length === 0 ? "Teacher name is required" : null;
  const duplicateSlotIds = findDuplicateSlots(slots);
  const slotTimeErrors = slots.map((slot) => validateTimeRange(slot.startTime, slot.endTime));
  const hasErrors =
    nameError !== null ||
    teacherError !== null ||
    duplicateSlotIds.size > 0 ||
    slotTimeErrors.some(Boolean);

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title={weekendContext ? "Add weekend class" : "Add Subject"}
      description={
        weekendContext
          ? `Classes for ${formatFullDate(weekendContext.dateIso)} and future ${weekendDay === 6 ? "Saturdays" : "Sundays"}.`
          : "Create a course and map its weekly class slots."
      }
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);

          if (hasErrors || name.trim().length === 0 || teacher.trim().length === 0) {
            return;
          }

          const color = pickNextSubjectColor(existingSubjectColors);
          const subject = createSubject(name.trim(), teacher.trim(), targetAttendance, color);
          const scheduleSlots = createScheduleSlotsForSubject(
            subject.id,
            slots.map((slot) => ({
              dayOfWeek: slot.dayOfWeek,
              periodNumber: slot.periodNumber,
              startTime: slot.startTime,
              endTime: slot.endTime,
              room: slot.room.trim(),
            })),
          );

          onAddSubject({ subject, scheduleSlots });
          handleClose();
        }}
      >
        <div className="grid gap-3">
          <Field
            label="Subject name"
            value={name}
            onChange={setName}
            placeholder="Human Computer Interaction"
            error={nameError}
          />
          <Field
            label="Teacher"
            value={teacher}
            onChange={setTeacher}
            placeholder="Prof. Aanya Shah"
            error={teacherError}
          />
          <label className="space-y-2">
            <span className="text-sm font-medium">Target attendance</span>
            <span className="ml-2 text-xs text-secondary">(60–95%)</span>
            <input
              className="input-field"
              type="number"
              min={60}
              max={95}
              value={targetAttendance}
              onChange={(event) => setTargetAttendance(Number(event.target.value))}
            />
          </label>
        </div>

        <section className="space-y-3">
          <div className="section-heading">
            <h3>Weekly Slots</h3>
            <p>Add at least one recurring class</p>
          </div>
          <div className="space-y-3">
            {slots.map((slot, index) => {
              const isDuplicate = duplicateSlotIds.has(slot.id);
              const timeError = submitted ? slotTimeErrors[index] : null;

              return (
                <div
                  key={slot.id}
                  className={`native-card grid gap-3 px-4 py-4 ${isDuplicate ? "ring-2 ring-[var(--color-danger)]" : ""}`}
                >
                  {isDuplicate && (
                    <p className="text-xs font-medium text-[var(--color-danger)]">
                      Duplicate day + period combination — each slot must be unique.
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Day</span>
                      <select
                        className="input-field"
                        value={slot.dayOfWeek}
                        disabled={weekendDay !== null}
                        onChange={(event) =>
                          setSlots((current) =>
                            current.map((item) =>
                              item.id === slot.id
                                ? { ...item, dayOfWeek: Number(event.target.value) }
                                : item,
                            ),
                          )
                        }
                      >
                        {dayOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium">Period</span>
                      <span className="ml-2 text-xs text-secondary">(1–8)</span>
                      <input
                        className="input-field"
                        type="number"
                        min={1}
                        max={8}
                        value={slot.periodNumber}
                        onChange={(event) =>
                          setSlots((current) =>
                            current.map((item) =>
                              item.id === slot.id
                                ? { ...item, periodNumber: Number(event.target.value) }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Start</span>
                      <input
                        className="input-field"
                        type="time"
                        value={slot.startTime}
                        onChange={(event) =>
                          setSlots((current) =>
                            current.map((item) =>
                              item.id === slot.id ? { ...item, startTime: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium">End</span>
                      <input
                        className={`input-field ${timeError ? "border-[var(--color-danger)]" : ""}`}
                        type="time"
                        value={slot.endTime}
                        onChange={(event) =>
                          setSlots((current) =>
                            current.map((item) =>
                              item.id === slot.id ? { ...item, endTime: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                  {timeError && (
                    <p className="text-xs font-medium text-[var(--color-danger)]">{timeError}</p>
                  )}

                  <Field
                    label="Room"
                    value={slot.room}
                    onChange={(value) =>
                      setSlots((current) =>
                        current.map((item) => (item.id === slot.id ? { ...item, room: value } : item)),
                      )
                    }
                    placeholder="CSE-101"
                  />

                  {slots.length > 1 ? (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setSlots((current) => current.filter((item) => item.id !== slot.id))}
                    >
                      Remove slot
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="secondary-button w-full"
            onClick={() => setSlots((current) => [...current, createDraftSlot(current.length, weekendDay ?? 1)])}
          >
            <PlusIcon className="h-4 w-4" />
            Add another slot
          </button>
        </section>

        <button
          type="submit"
          className="primary-button w-full"
        >
          Create Subject
        </button>
      </form>
    </BottomSheet>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string | null;
}

const Field = ({ label, value, onChange, placeholder, error }: FieldProps) => (
  <label className="space-y-2">
    <span className="text-sm font-medium">{label}</span>
    <input
      className={`input-field ${error ? "border-[var(--color-danger)]" : ""}`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
    {error ? <p className="text-xs font-medium text-[var(--color-danger)]">{error}</p> : null}
  </label>
);
