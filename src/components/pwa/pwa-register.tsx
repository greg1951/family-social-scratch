"use client";

import { useEffect } from "react";

const IS_PWA_ENABLED = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_PWA_ENABLED === "true";

export default function PwaRegister() {
  useEffect(() => {
    if (!IS_PWA_ENABLED || typeof window === "undefined") {
      return;
    }

    if (!window.isSecureContext || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    void navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
      .then(() => {
        if (cancelled) {
          return;
        }
      })
      .catch((error) => {
        console.error("[pwa] service worker registration failed", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}