import { useEffect, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { PlusIcon } from "./Icons";
import { createScheduleSlotsForSubject } from "../utils/attendance";
import type { ScheduleSlot, Subject } from "../types/attendance";

interface DraftSlot {
  id: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  room: string;
}

const dayOptions = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
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
  }, [open, scheduleSlots, subject]);

  const handleClose = () => {
    onClose();
  };

  if (!subject) {
    return null;
  }

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title="Edit Subject"
      description="Update course details and weekly class slots."
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
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
          <Field label="Subject name" value={name} onChange={setName} placeholder="Subject name" />
          <Field label="Teacher" value={teacher} onChange={setTeacher} placeholder="Teacher name" />
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
            <p>When this subject meets each week</p>
          </div>
          <div className="space-y-3">
            {slots.map((slot) => (
              <div key={slot.id} className="native-card grid gap-3 px-4 py-4">
                <div className="grid grid-cols-2 gap-3">
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
            ))}
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
          disabled={name.trim().length === 0 || teacher.trim().length === 0 || slots.length === 0}
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
