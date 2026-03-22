"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={ () => router.back() }
      className="flex min-w-[13rem] flex-1 items-center justify-between rounded-xl border border-[#d8eef7] bg-white/75 px-3 py-2 text-sm font-semibold text-[#10364a] transition hover:-translate-y-0.5 hover:bg-[#dff6ff]"
    >
      <span className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5" />
          <path d="M12 5l-7 7 7 7" />
        </svg>
        Go Back
      </span>
      <span className="text-[#2f7a95]">Go</span>
    </button>
  );
}
