import { AttendanceProvider } from "./store/AttendanceContext";
import { Dashboard } from "./pages/Dashboard";

export default function App() {
  return (
    <AttendanceProvider>
      <Dashboard />
    </AttendanceProvider>
  );
}
