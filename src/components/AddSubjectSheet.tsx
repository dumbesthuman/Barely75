import { useEffect, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { PlusIcon } from "./Icons";
import { createScheduleSlotsForSubject, createSubject } from "../utils/attendance";
import type { ScheduleSlot, Subject } from "../types/attendance";
import { formatFullDate, getDayOfWeekIso } from "../utils/date";

interface AddSubjectSheetProps {
  open: boolean;
  defaultTarget: number;
  weekendContext?: { dateIso: string };
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
  id: `slot-${index}`,
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

  const reset = () => {
    setName("");
    setTeacher("");
    setTargetAttendance(defaultTarget);
    setSlots([createDraftSlot(0, weekendDay ?? 1)]);
  };

  useEffect(() => {
    if (open) {
      setTargetAttendance(defaultTarget);
      setSlots([createDraftSlot(0, weekendDay ?? 1)]);
    }
  }, [defaultTarget, open, weekendDay]);

  const handleClose = () => {
    reset();
    onClose();
  };

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
        onSubmit={(event) => {
          event.preventDefault();
          const subject = createSubject(name.trim(), teacher.trim(), targetAttendance);
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
          />
          <Field
            label="Teacher"
            value={teacher}
            onChange={setTeacher}
            placeholder="Prof. Aanya Shah"
          />
          <label className="space-y-2">
            <span className="text-sm font-medium">Target attendance</span>
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
            {slots.map((slot, index) => (
              <div key={slot.id} className="native-card grid gap-3 px-4 py-4">
                <div className="grid grid-cols-2 gap-3">
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

                <div className="grid grid-cols-2 gap-3">
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
                      className="input-field"
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
            ))}
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
          disabled={name.trim().length === 0 || teacher.trim().length === 0 || slots.length === 0}
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
}

const Field = ({ label, value, onChange, placeholder }: FieldProps) => (
  <label className="space-y-2">
    <span className="text-sm font-medium">{label}</span>
    <input
      className="input-field"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  </label>
);
