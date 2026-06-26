import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type PropsWithChildren,
} from "react";
import { localStorageAdapter, createDebouncedSaver } from "../utils/storage";
import type { AttendanceState } from "../types/attendance";
import { attendanceReducer, type AttendanceAction } from "./attendanceReducer";

const AttendanceStateContext = createContext<AttendanceState | null>(null);
const AttendanceDispatchContext = createContext<Dispatch<AttendanceAction> | null>(null);

export const AttendanceProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(attendanceReducer, undefined, localStorageAdapter.load);

  const debouncedSave = useMemo(
    () => createDebouncedSaver(localStorageAdapter.save),
    [],
  );

  useEffect(() => {
    debouncedSave(state);
  }, [debouncedSave, state]);

  return (
    <AttendanceStateContext.Provider value={state}>
      <AttendanceDispatchContext.Provider value={dispatch}>
        {children}
      </AttendanceDispatchContext.Provider>
    </AttendanceStateContext.Provider>
  );
};

export const useAttendanceState = () => {
  const context = useContext(AttendanceStateContext);
  if (!context) {
    throw new Error("useAttendanceState must be used within AttendanceProvider");
  }
  return context;
};

export const useAttendanceDispatch = () => {
  const context = useContext(AttendanceDispatchContext);
  if (!context) {
    throw new Error("useAttendanceDispatch must be used within AttendanceProvider");
  }
  return context;
};
