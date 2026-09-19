"use client";

import { Search } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type FilterDateScope = "everything" | "date-range";

export type FilterSidebarPalette = {
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarBorder: string;
  label: string;
  muted: string;
  inputBorder: string;
  inputText: string;
  chipBorder: string;
  chipText: string;
  chipHoverBackground: string;
  checkBorder: string;
  checkboxText: string;
  accent: string;
  accentHoverBackground: string;
  triggerBorder: string;
  triggerBackground: string;
  triggerText: string;
  triggerHoverBackground: string;
};

export function FilterSidebarProvider({
  palette,
  children,
}: {
  palette: FilterSidebarPalette;
  children: ReactNode;
}) {
  return (
    <SidebarProvider
      defaultOpen={ false }
      style={ {
        "--sidebar-width": "20rem",
        "--sidebar": palette.sidebarBackground,
        "--sidebar-foreground": palette.sidebarForeground,
        "--sidebar-border": palette.sidebarBorder,
        "--ffs-label": palette.label,
        "--ffs-muted": palette.muted,
        "--ffs-input-border": palette.inputBorder,
        "--ffs-input-text": palette.inputText,
        "--ffs-chip-border": palette.chipBorder,
        "--ffs-chip-text": palette.chipText,
        "--ffs-chip-hover": palette.chipHoverBackground,
        "--ffs-check-border": palette.checkBorder,
        "--ffs-check-text": palette.checkboxText,
        "--ffs-accent": palette.accent,
        "--ffs-accent-hover": palette.accentHoverBackground,
        "--ffs-trigger-border": palette.triggerBorder,
        "--ffs-trigger-bg": palette.triggerBackground,
        "--ffs-trigger-text": palette.triggerText,
        "--ffs-trigger-hover": palette.triggerHoverBackground,
      } as CSSProperties }
    >
      { children }
    </SidebarProvider>
  );
}

export function FilterSidebar({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-(--ffs-label)">{ title }</p>
          <SidebarTrigger
            className="size-7 shrink-0 rounded-full text-(--ffs-chip-text) hover:bg-(--ffs-chip-hover) hover:text-(--ffs-chip-text)"
            aria-label="Close filters"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-3 py-4">{ children }</SidebarContent>
    </Sidebar>
  );
}

export function FilterSidebarTrigger({ ariaLabel }: { ariaLabel: string }) {
  return (
    <SidebarTrigger
      className="h-8 w-8 shrink-0 rounded-full border border-(--ffs-trigger-border) bg-(--ffs-trigger-bg) text-(--ffs-trigger-text) hover:bg-(--ffs-trigger-hover) hover:text-(--ffs-trigger-text)"
      aria-label={ ariaLabel }
    />
  );
}

export function FilterSidebarGroup({
  label,
  className,
  id,
  children,
}: {
  label: string;
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <SidebarGroup id={ id } className="p-0">
      <SidebarGroupLabel className="text-[0.62rem] font-bold uppercase tracking-[0.26em] text-(--ffs-label)">
        { label }
      </SidebarGroupLabel>
      <SidebarGroupContent className={ cn("text-sm", className) }>{ children }</SidebarGroupContent>
    </SidebarGroup>
  );
}

export function FilterSidebarSearch({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <FilterSidebarGroup label="Search">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-(--ffs-muted)" />
        <Input
          type="search"
          value={ value }
          onChange={ (event) => onChange(event.target.value) }
          placeholder={ placeholder }
          className="h-9 w-full rounded-full border-(--ffs-input-border) bg-white pl-10 pr-3 text-xs text-(--ffs-input-text) shadow-sm sm:h-10 sm:text-sm"
          aria-label={ ariaLabel }
        />
      </div>
    </FilterSidebarGroup>
  );
}

export function FilterSidebarRadio({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-(--ffs-chip-border) bg-white px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-(--ffs-chip-text) transition hover:bg-(--ffs-chip-hover)">
      <input
        type="radio"
        name={ name }
        value={ value }
        checked={ checked }
        onChange={ onChange }
        className="size-3.5 border-(--ffs-check-border) text-(--ffs-accent)"
      />
      { children }
    </label>
  );
}

export function FilterSidebarCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-(--ffs-input-border) bg-white px-3 py-1.5 text-xs font-semibold text-(--ffs-check-text)">
      <input
        type="checkbox"
        checked={ checked }
        onChange={ (event) => onChange(event.target.checked) }
        className="size-3.5 border-(--ffs-check-border) text-(--ffs-accent)"
      />
      { children }
    </label>
  );
}

export function FilterSidebarDateScope({
  radioName,
  dateScope,
  onDateScopeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  isDateRangeScope,
  hasPendingChanges,
  onApply,
}: {
  radioName: string;
  dateScope: FilterDateScope;
  onDateScopeChange: (scope: FilterDateScope) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  isDateRangeScope: boolean;
  hasPendingChanges: boolean;
  onApply: () => void;
}) {
  return (
    <FilterSidebarGroup label="Date Scope" className="space-y-2 text-(--ffs-muted)">
      <div className="flex flex-wrap gap-2">
        <FilterSidebarRadio
          name={ radioName }
          value="everything"
          checked={ dateScope === "everything" }
          onChange={ () => onDateScopeChange("everything") }
        >
          Everything
        </FilterSidebarRadio>
        <FilterSidebarRadio
          name={ radioName }
          value="date-range"
          checked={ dateScope === "date-range" }
          onChange={ () => onDateScopeChange("date-range") }
        >
          Date Range
        </FilterSidebarRadio>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-(--ffs-muted)">Start Date</label>
        <Input
          type="date"
          value={ startDate }
          max={ endDate || undefined }
          onChange={ (event) => onStartDateChange(event.target.value) }
          disabled={ !isDateRangeScope }
          className="h-8 rounded-xl border-(--ffs-input-border) bg-white px-2 text-[11px] text-(--ffs-input-text) disabled:opacity-60 sm:h-9 sm:text-xs"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-(--ffs-muted)">End Date</label>
        <Input
          type="date"
          value={ endDate }
          min={ startDate || undefined }
          onChange={ (event) => onEndDateChange(event.target.value) }
          disabled={ !isDateRangeScope }
          className="h-8 rounded-xl border-(--ffs-input-border) bg-white px-2 text-[11px] text-(--ffs-input-text) disabled:opacity-60 sm:h-9 sm:text-xs"
        />
      </div>
      <Button
        type="button"
        onClick={ onApply }
        disabled={ !isDateRangeScope || !hasPendingChanges }
        className="h-8 w-full rounded-xl bg-(--ffs-accent) px-3 text-xs font-semibold text-white hover:bg-(--ffs-accent-hover) disabled:opacity-50 sm:h-9"
      >
        Apply
      </Button>
    </FilterSidebarGroup>
  );
}
