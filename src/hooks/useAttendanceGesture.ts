import { useEffect, useEffectEvent, useRef, useState } from "react";
import { LONG_PRESS_DURATION } from "../constants/app";

interface UseAttendanceGestureOptions {
  onTap: () => void;
  onLongPress: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export const useAttendanceGesture = ({
  onTap,
  onLongPress,
  onDelete,
  disabled = false,
}: UseAttendanceGestureOptions) => {
  const [isPressed, setIsPressed] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);

  const timerRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const touchTimeRef = useRef(0);
  const longPressTriggeredRef = useRef(false);
  const pointerStartRef = useRef(0);

  const handleTap = useEffectEvent(onTap);
  const handleLongPress = useEffectEvent(onLongPress);
  const handleDelete = useEffectEvent(() => {
    onDelete?.();
  });

  const clearTracking = useEffectEvent(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    setLongPressProgress(0);
  });

  const updateProgress = useEffectEvent(() => {
    const elapsed = performance.now() - pointerStartRef.current;
    setLongPressProgress(Math.min(1, elapsed / LONG_PRESS_DURATION));
    frameRef.current = window.requestAnimationFrame(updateProgress);
  });

  const startPress = useEffectEvent((source: "touch" | "mouse" | "keyboard") => {
    if (disabled) {
      return;
    }

    if (source === "mouse" && Date.now() - touchTimeRef.current < 800) {
      return;
    }

    if (source === "touch") {
      touchTimeRef.current = Date.now();
    }

    clearTracking();
    longPressTriggeredRef.current = false;
    pointerStartRef.current = performance.now();
    setIsPressed(true);
    frameRef.current = window.requestAnimationFrame(updateProgress);
    timerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setLongPressProgress(1);
      handleLongPress();
    }, LONG_PRESS_DURATION);
  });

  const endPress = useEffectEvent(() => {
    if (disabled || !isPressed) {
      return;
    }

    const didLongPress = longPressTriggeredRef.current;
    clearTracking();
    setIsPressed(false);
    longPressTriggeredRef.current = false;

    if (!didLongPress) {
      handleTap();
    }
  });

  const cancelPress = useEffectEvent(() => {
    clearTracking();
    setIsPressed(false);
    longPressTriggeredRef.current = false;
  });

  useEffect(() => () => clearTracking(), [clearTracking]);

  return {
    isPressed,
    longPressProgress,
    gestureProps: {
      onTouchStart: () => startPress("touch"),
      onTouchEnd: endPress,
      onTouchCancel: cancelPress,
      onMouseDown: () => startPress("mouse"),
      onMouseUp: endPress,
      onMouseLeave: cancelPress,
      onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault();
          handleDelete();
          return;
        }

        if (event.repeat) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          startPress("keyboard");
        }
      },
      onKeyUp: (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          endPress();
        }
      },
    },
  };
};
