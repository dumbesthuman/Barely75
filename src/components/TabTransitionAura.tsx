import { motion } from "framer-motion";
import type { NavigationTab } from "./BottomNavigation";

const auraByTab: Record<
  NavigationTab,
  { x: string; y: string; scale: number; hue: "green" | "teal" | "mint" }
> = {
  overview: { x: "18%", y: "12%", scale: 1.15, hue: "green" },
  schedule: { x: "52%", y: "38%", scale: 1.25, hue: "teal" },
  subjects: { x: "82%", y: "18%", scale: 1.1, hue: "mint" },
};

const hueColor = (hue: "green" | "teal" | "mint") => {
  switch (hue) {
    case "teal":
      return "color-mix(in srgb, var(--color-primary) 55%, var(--color-success))";
    case "mint":
      return "color-mix(in srgb, var(--color-success) 78%, white)";
    default:
      return "var(--color-success)";
  }
};

interface TabTransitionAuraProps {
  activeTab: NavigationTab;
}

export const TabTransitionAura = ({ activeTab }: TabTransitionAuraProps) => {
  const aura = auraByTab[activeTab];

  return (
    <div className="tab-aura" aria-hidden="true">
      <motion.div
        className="tab-aura-blob tab-aura-blob-primary"
        animate={{
          left: aura.x,
          top: aura.y,
          scale: aura.scale,
          background: `radial-gradient(circle, ${hueColor(aura.hue)} 0%, transparent 68%)`,
        }}
        transition={{ type: "spring", stiffness: 90, damping: 22, mass: 1.1 }}
      />
      <motion.div
        className="tab-aura-blob tab-aura-blob-secondary"
        animate={{
          left: aura.x,
          top: aura.y,
          scale: aura.scale * 0.85,
        }}
        transition={{ type: "spring", stiffness: 70, damping: 24, mass: 1.2 }}
      />
    </div>
  );
};
