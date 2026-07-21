"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ tw, stretch = true }: { tw?: string; stretch?: boolean }) {
  const router = useRouter();

  return (
    <button
      id="back-button"
      type="button"
      onClick={ () => router.back() }
      className={ `flex ${ stretch ? "flex-1" : "w-fit" } items-center justify-between rounded-xl border ${ tw }` }>
      <span className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5" />
          <path d="M12 5l-7 7 7 7" />
        </svg>
        Go Back
      </span>
      {/* <span className="text-[#2f7a95]">Go</span> */ }
    </button>
  );
}
