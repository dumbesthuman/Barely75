import { motion } from "framer-motion";
import type { NavigationTab } from "./BottomNavigation";
import { BottomNavigation } from "./BottomNavigation";
import { PlusIcon } from "./Icons";

interface BottomDockProps {
  activeTab: NavigationTab;
  hidden?: boolean;
  onNavigate: (tab: NavigationTab) => void;
  onAddSubject: () => void;
}

export const BottomDock = ({ activeTab, hidden = false, onNavigate, onAddSubject }: BottomDockProps) => (
  <div className={`bottom-dock ${hidden ? "is-hidden" : ""}`} aria-hidden={hidden}>
    <motion.button
      type="button"
      className="dock-fab focus-ring"
      onClick={onAddSubject}
      whileTap={{ scale: 0.94 }}
      aria-label="Add subject"
    >
      <PlusIcon className="h-5 w-5" />
    </motion.button>
    <BottomNavigation activeTab={activeTab} onChange={onNavigate} />
  </div>
);
