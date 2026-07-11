"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EditPostIconProps = {
  tooltip: string;
  children: ReactNode;
  tooltipClassName?: string;
};

const tooltipClasses = [
  "font-app pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-full",
  "bg-[#14384d] px-2 py-1 text-[10px] text-[#ecf9ff] shadow-md md:text-xs",
  "opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0",
].join(" ");

export default function EditPostIcon({ tooltip, children, tooltipClassName }: EditPostIconProps) {
  return (
    <span className="group relative inline-flex">
      { children }
      <span className={ cn(tooltipClasses, tooltipClassName) } aria-hidden="true">
        { tooltip }
      </span>
    </span>
  );
}
