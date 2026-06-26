import { useEffect, useRef } from "react";
import type { NavigationTab } from "../components/BottomNavigation";

interface AppBackState {
  activeTab: NavigationTab;
  settingsOpen: boolean;
  addSubjectOpen: boolean;
  editSubjectId: string | null;
  sadModalDate: string | null;
}

interface UseAppBackNavigationOptions {
  state: AppBackState;
  setActiveTab: (tab: NavigationTab) => void;
  closeSettings: () => void;
  closeAddSubject: () => void;
  closeEditSubject: () => void;
  closeSadModal: () => void;
}

export const useAppBackNavigation = ({
  state,
  setActiveTab,
  closeSettings,
  closeAddSubject,
  closeEditSubject,
  closeSadModal,
}: UseAppBackNavigationOptions) => {
  const stateRef = useRef(state);
  const skipPopRef = useRef(false);
  const initializedRef = useRef(false);

  stateRef.current = state;

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    window.history.replaceState({ barely75: "root" }, "");
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    const onPopState = () => {
      if (skipPopRef.current) {
        skipPopRef.current = false;
        return;
      }

      const current = stateRef.current;

      if (current.sadModalDate) {
        closeSadModal();
        return;
      }

      if (current.addSubjectOpen) {
        closeAddSubject();
        return;
      }

      if (current.editSubjectId) {
        closeEditSubject();
        return;
      }

      if (current.settingsOpen) {
        closeSettings();
        return;
      }

      if (current.activeTab !== "overview") {
        setActiveTab("overview");
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [closeAddSubject, closeEditSubject, closeSadModal, closeSettings, setActiveTab]);

  const pushLayer = () => {
    window.history.pushState({ barely75: "layer" }, "");
  };

  const goBackHistory = () => {
    if (window.history.state?.barely75 && window.history.state.barely75 !== "root") {
      skipPopRef.current = true;
      window.history.back();
    }
  };

  const navigateTab = (tab: NavigationTab) => {
    const current = stateRef.current;
    const wasOverview = current.activeTab === "overview";
    const goingOverview = tab === "overview";

    if (!goingOverview && wasOverview) {
      pushLayer();
    } else if (goingOverview && !wasOverview) {
      goBackHistory();
    }

    setActiveTab(tab);
  };

  const closeWithHistory = (close: () => void) => {
    close();
    goBackHistory();
  };

  return {
    navigateTab,
    pushLayer,
    closeWithHistory,
  };
};
