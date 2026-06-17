'use client';

import { SquareActivity } from 'lucide-react';
import Link from 'next/link';
const iconTileClasses = [
  "relative grid place-items-center h-5 w-5 md:h-8 md:w-8 rounded-2xl border",
  "bg-gradient-to-b from-white/90 to-sky-100/70 shadow-[0_6px_14px_rgba(1,98,151,0.2)]",
  "transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_10px_20px_rgba(1,98,151,0.28)]"].join(" ");
const tooltipClasses = [
  "font-app text-center rounded-full absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap",
  "px-2 py-1 bg-sky-900 text-sky-50 text-[10px] md:text-xs shadow-md",
  "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
].join(" ");


export default function FamilyActivity() {
  return (
    <div className="group relative">
      <div className={ iconTileClasses }>
        <Link href="/family-dashboard">
          <SquareActivity className="h-6 w-6 transition group-hover:scale-105" />
        </Link>
      </div>
      <span className={ tooltipClasses }>
        Family Activity
      </span>
    </div>
  );
}
