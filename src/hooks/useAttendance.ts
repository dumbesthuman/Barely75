import { useMemo } from "react";
import { useAttendanceDispatch, useAttendanceState } from "../store/AttendanceContext";
import {
  buildOverallMetrics,
  buildPeriodsForDate,
  buildSubjectMetrics,
  buildTodayPeriods,
  getPredictionMessage,
} from "../utils/attendance";
import { getTodayIso } from "../utils/date";

export const useAttendance = () => {
  const state = useAttendanceState();
  const dispatch = useAttendanceDispatch();

  const todayIso = getTodayIso();

  const overallMetrics = useMemo(() => buildOverallMetrics(state), [state]);
  const subjectMetrics = useMemo(() => buildSubjectMetrics(state), [state]);
  const todayPeriods = useMemo(() => buildTodayPeriods(state, todayIso), [state, todayIso]);
  const prediction = useMemo(() => getPredictionMessage(overallMetrics), [overallMetrics]);

  const getPeriodsForDate = useMemo(
    () => (dateIso: string) => buildPeriodsForDate(state, dateIso),
    [state],
  );

  return {
    state,
    dispatch,
    todayIso,
    overallMetrics,
    subjectMetrics,
    todayPeriods,
    getPeriodsForDate,
    prediction,
  };
};
