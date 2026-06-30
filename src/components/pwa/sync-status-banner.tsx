"use client";

import { useEffect, useState } from "react";

import { getPwaQueueUpdatedEventName, getQueuedMutationCount, isBrowserOnline, requestPwaSyncNow } from "@/lib/pwa-background-sync";

function getBannerCopy(isOnline: boolean, queuedCount: number) {
  if (!isOnline) {
    return {
      title: "Offline mode",
      message: queuedCount > 0
        ? `${ queuedCount } change${ queuedCount === 1 ? " is" : "s are" } queued locally and will sync when you reconnect.`
        : "New text updates will be queued locally until your connection returns.",
      className: "border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,250,235,0.98),rgba(255,241,204,0.94))] text-[#7a4b00]",
    };
  }

  if (queuedCount > 0) {
    return {
      title: "Sync pending",
      message: `${ queuedCount } queued change${ queuedCount === 1 ? " is" : "s are" } waiting to finish syncing.`,
      className: "border-sky-200/80 bg-[linear-gradient(135deg,rgba(239,250,255,0.98),rgba(215,244,255,0.94))] text-[#0c4b66]",
    };
  }

  return {
    title: "All changes synced",
    message: "You are online and there are no queued PWA changes right now.",
    className: "border-emerald-200/80 bg-[linear-gradient(135deg,rgba(240,255,247,0.98),rgba(221,249,235,0.94))] text-[#0f5b3d]",
  };
}

export default function SyncStatusBanner() {
  const [isOnline, setIsOnline] = useState(() => isBrowserOnline());
  const [queuedCount, setQueuedCount] = useState(() => getQueuedMutationCount());

  useEffect(() => {
    const refreshState = () => {
      setIsOnline(isBrowserOnline());
      setQueuedCount(getQueuedMutationCount());
    };

    refreshState();

    window.addEventListener("online", refreshState);
    window.addEventListener("offline", refreshState);
    window.addEventListener(getPwaQueueUpdatedEventName(), refreshState);

    return () => {
      window.removeEventListener("online", refreshState);
      window.removeEventListener("offline", refreshState);
      window.removeEventListener(getPwaQueueUpdatedEventName(), refreshState);
    };
  }, []);

  const banner = getBannerCopy(isOnline, queuedCount);

  return (
    <section className={ `rounded-[1.35rem] border px-4 py-3 shadow-[0_14px_35px_-28px_rgba(16,54,74,0.55)] backdrop-blur ${ banner.className }` }>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em]">
            { banner.title }
          </p>
          <p className="mt-1 text-sm leading-6">
            { banner.message }
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-current/20 bg-white/65 px-3 py-1.5 text-xs font-semibold transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={ !isOnline || queuedCount === 0 }
          onClick={ requestPwaSyncNow }
        >
          Sync now
        </button>
      </div>
    </section>
  );
}