"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !(window as typeof window & { MSStream?: unknown }).MSStream;
  });
  const [isStandalone] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  });
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone || isDismissed) {
    return null;
  }

  if (isIOS) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-[1.5rem] border border-sky-200/70 bg-white/80 px-4 py-4 shadow-[0_16px_40px_-28px_rgba(16,54,74,0.45)] backdrop-blur md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2f7a95]">
              Install on iPhone
            </p>
            <p className="mt-2 text-sm text-[#10364a]">
              Tap Share in Safari, then choose Add to Home Screen so this app opens like a native app.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#10364a] transition hover:bg-sky-50"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss install instructions"
          >
            Dismiss
          </button>
        </div>
      </section>
    );
  }

  if (!deferredPrompt) {
    return null;
  }

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome !== "accepted") {
      setIsDismissed(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <section className="mx-auto w-full max-w-3xl rounded-[1.5rem] border border-sky-200/70 bg-white/80 px-4 py-4 shadow-[0_16px_40px_-28px_rgba(16,54,74,0.45)] backdrop-blur md:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2f7a95]">
            Install app
          </p>
          <p className="mt-2 text-sm text-[#10364a]">
            Add Family Social to your home screen for faster access and a more app-like experience.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#10364a] transition hover:bg-sky-50"
            onClick={() => setIsDismissed(true)}
          >
            Later
          </button>
          <button
            type="button"
            className="rounded-full bg-[#005472] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#0a6a90]"
            onClick={ handleInstall }
          >
            Install
          </button>
        </div>
      </div>
    </section>
  );
}