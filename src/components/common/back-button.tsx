"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ tw, stretch = true }: { tw?: string; stretch?: boolean }) {
  const router = useRouter();

  return (
    <button
      id="back-button"
      type="button"
      onClick={ () => router.back() }
      title="Back"
      className={ `flex ${ stretch ? "w-fit sm:w-full" : "w-fit" } items-center justify-center gap-2 rounded-xl border ${ tw }` }>
      <ArrowLeft className="h-4 w-4 shrink-0" />
      <span className="hidden md:inline">Back</span>
    </button>
  );
}
