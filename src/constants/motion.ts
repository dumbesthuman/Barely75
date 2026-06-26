export const SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 30,
  mass: 0.8,
};

export const GENTLE_SPRING = {
  type: "spring" as const,
  stiffness: 280,
  damping: 28,
  mass: 0.9,
};

export const SHEET_SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 32,
  mass: 0.92,
};

export const QUICK_FADE = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1] as const,
};
