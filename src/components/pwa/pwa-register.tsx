"use client";

import { useEffect } from "react";

const IS_PWA_ENABLED = process.env.NEXT_PUBLIC_PWA_ENABLED === "true";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!window.isSecureContext || !("serviceWorker" in navigator)) {
      return;
    }

    if (!IS_PWA_ENABLED) {
      // Ensure stale registrations from prior local runs do not keep serving offline fallback.
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch((error) => {
          console.error("[pwa] failed to unregister service workers", error);
        });

      if ("caches" in window) {
        void caches
          .keys()
          .then((cacheNames) =>
            Promise.all(
              cacheNames
                .filter((cacheName) => cacheName.startsWith("family-social-precache-"))
                .map((cacheName) => caches.delete(cacheName))
            )
          )
          .catch((error) => {
            console.error("[pwa] failed to clear precache", error);
          });
      }

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