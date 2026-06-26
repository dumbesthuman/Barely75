import { CalendarIcon, ChartIcon, LayersIcon } from "./Icons";

export type NavigationTab = "overview" | "schedule" | "subjects";

interface BottomNavigationProps {
  activeTab: NavigationTab;
  onChange: (tab: NavigationTab) => void;
}

const tabs = [
  { id: "overview" as const, label: "Overview", icon: ChartIcon },
  { id: "schedule" as const, label: "Schedule", icon: CalendarIcon },
  { id: "subjects" as const, label: "Subjects", icon: LayersIcon },
];

export const BottomNavigation = ({ activeTab, onChange }: BottomNavigationProps) => (
  <nav className="native-nav" aria-label="Primary">
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const active = tab.id === activeTab;

      return (
        <button
          key={tab.id}
          type="button"
          className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[22px] px-2 py-3 text-[0.72rem] ${
            active ? "bg-[var(--color-surface-elevated)]" : ""
          }`}
          onClick={() => onChange(tab.id)}
          aria-current={active ? "page" : undefined}
        >
          <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full">
            <Icon className="h-5 w-5" />
          </span>
          <span className="relative z-10 tracking-[0.04em]">{tab.label}</span>
        </button>
      );
    })}
  </nav>
);
