import { useEffect, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { PlusIcon } from "./Icons";
import { createScheduleSlotsForSubject, findDuplicateSlots, validateTimeRange } from "../utils/attendance";
import type { ScheduleSlot, Subject } from "../types/attendance";

interface DraftSlot {
  id: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  room: string;
}

// Edit sheet supports all days including weekends
const allDayOptions = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const slotFromSchedule = (slot: ScheduleSlot): DraftSlot => ({
  id: slot.id,
  dayOfWeek: slot.dayOfWeek,
  periodNumber: slot.periodNumber,
  startTime: slot.startTime,
  endTime: slot.endTime,
  room: slot.room,
});

const createDraftSlot = (index: number): DraftSlot => ({
  id: `slot-${Date.now()}-${index}`,
  dayOfWeek: 1,
  periodNumber: index + 1,
  startTime: "08:30",
  endTime: "09:20",
  room: "",
});

interface EditSubjectSheetProps {
  open: boolean;
  subject: Subject | null;
  scheduleSlots: ScheduleSlot[];
  onClose: () => void;
  onSave: (payload: {
    subjectId: string;
    patch: Pick<Subject, "name" | "teacher" | "targetAttendance">;
    scheduleSlots: ScheduleSlot[];
  }) => void;
}

export const EditSubjectSheet = ({
  open,
  subject,
  scheduleSlots,
  onClose,
  onSave,
}: EditSubjectSheetProps) => {
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [targetAttendance, setTargetAttendance] = useState(75);
  const [slots, setSlots] = useState<DraftSlot[]>([createDraftSlot(0)]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open || !subject) {
      return;
    }

    setName(subject.name);
    setTeacher(subject.teacher);
    setTargetAttendance(subject.targetAttendance);
    setSlots(
      scheduleSlots.length > 0
        ? scheduleSlots.map(slotFromSchedule)
        : [createDraftSlot(0)],
    );
    setSubmitted(false);
  }, [open, scheduleSlots, subject]);

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  if (!subject) {
    return null;
  }

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
      title="Edit Subject"
      description="Update course details and weekly class slots."
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

          const schedule = createScheduleSlotsForSubject(
            subject.id,
            slots.map((slot) => ({
              dayOfWeek: slot.dayOfWeek,
              periodNumber: slot.periodNumber,
              startTime: slot.startTime,
              endTime: slot.endTime,
              room: slot.room.trim() || "TBD",
            })),
          );

          onSave({
            subjectId: subject.id,
            patch: {
              name: name.trim(),
              teacher: teacher.trim(),
              targetAttendance,
            },
            scheduleSlots: schedule,
          });
          handleClose();
        }}
      >
        <div className="grid gap-3">
          <Field label="Subject name" value={name} onChange={setName} placeholder="Subject name" error={nameError} />
          <Field label="Teacher" value={teacher} onChange={setTeacher} placeholder="Teacher name" error={teacherError} />
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
            <p>When this subject meets each week</p>
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
                      Duplicate day + period — each slot must be unique.
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Day</span>
                      <select
                        className="input-field"
                        value={slot.dayOfWeek}
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
                        {allDayOptions.map((option) => (
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
                    placeholder="Room number"
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
            onClick={() => setSlots((current) => [...current, createDraftSlot(current.length)])}
          >
            <PlusIcon className="h-4 w-4" />
            Add another slot
          </button>
        </section>

        <button
          type="submit"
          className="primary-button w-full"
        >
          Save changes
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
