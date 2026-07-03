"use client";

import { useEffect } from "react";

import { getPwaQueueUpdatedEventName, getQueuedMutationCount, isBrowserOnline } from "@/lib/pwa-background-sync";

function logPwaStatus(reason: string) {
  const isOnline = isBrowserOnline();
  const queuedCount = getQueuedMutationCount();

  if (!isOnline) {
    console.warn(`[pwa] ${reason}: offline mode; queued mutations=${queuedCount}`);
    return;
  }

  if (queuedCount > 0) {
    console.warn(`[pwa] ${reason}: sync pending; queued mutations=${queuedCount}`);
    return;
  }

  console.log(`[pwa] ${reason}: all changes synced`);
}

export default function SyncStatusConsole() {
  useEffect(() => {
    const refreshStatus = (reason: string) => () => {
      logPwaStatus(reason);
    };

    const onLoad = refreshStatus("status check");
    const onOnline = refreshStatus("network online");
    const onOffline = refreshStatus("network offline");
    const onQueueUpdated = refreshStatus("queue updated");

    onLoad();

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener(getPwaQueueUpdatedEventName(), onQueueUpdated);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(getPwaQueueUpdatedEventName(), onQueueUpdated);
    };
  }, []);

  return null;
}
