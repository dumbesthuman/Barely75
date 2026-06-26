import { useEffect, useState } from "react";
import { APP_NAME } from "../constants/app";
import { DownloadIcon } from "./Icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone);

const isIosSafari = () => {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
};

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return window.localStorage.getItem("attendance-tracker.install-dismissed") === "1";
  });

  useEffect(() => {
    if (isStandalone() || dismissed) {
      return;
    }

    if (isIosSafari()) {
      setVisible(true);
      return;
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [dismissed]);

  if (!visible) {
    return null;
  }

  const dismiss = () => {
    window.localStorage.setItem("attendance-tracker.install-dismissed", "1");
    setDismissed(true);
    setVisible(false);
  };

  return (
    <section className="install-banner native-card px-4 py-4" aria-live="polite">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-primary)] text-white">
          <DownloadIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">Install on your phone</p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
            {deferredPrompt
              ? `Add ${APP_NAME} to your home screen for offline access and a full-screen app experience.`
              : "On iPhone or iPad, tap Share in Safari, then choose Add to Home Screen."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {deferredPrompt ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  void deferredPrompt.prompt().then(() => deferredPrompt.userChoice);
                }}
              >
                Install app
              </button>
            ) : null}
            <button type="button" className="secondary-button" onClick={dismiss}>
              Not now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
