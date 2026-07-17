"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, PlusCircle, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  createGuidedTourReferenceAction,
  createGuidedTourStepReferenceAction,
  deleteGuidedTourReferenceAction,
  deleteGuidedTourStepReferenceAction,
  getGuidedTourMaintenanceDataAction,
  updateGuidedTourReferenceAction,
  updateGuidedTourStepReferenceAction,
} from "@/app/(support)/(logged-in)/(guided)/add-guided/actions";
import type {
  GuidedTourReferenceWithSteps,
  GuidedTourStepReferenceItem,
} from "@/components/db/sql/queries-guided";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const TOUR_STATUS_OPTIONS = ["published", "draft"] as const;
const TOUR_AUDIENCE_OPTIONS = ["all", "founder", "member", "support"] as const;
const STEP_ROUTE_PATTERN_OPTIONS = ["uncontrolled", "controlled", "hooks"] as const;
const STEP_PLACEMENT_OPTIONS = [
  "top",
  "top-start",
  "top-end",
  "left",
  "left-start",
  "left-end",
  "bottom",
  "bottom-start",
  "bottom-end",
  "right",
  "right-start",
  "right-end",
  "centered",
] as const;

type TourFormState = {
  id: number | null;
  tourKey: string;
  tourName: string;
  featureName: string;
  status: (typeof TOUR_STATUS_OPTIONS)[number];
  audienceType: (typeof TOUR_AUDIENCE_OPTIONS)[number];
};

type StepFormState = {
  id: number | null;
  stepKey: string;
  stepNo: string;
  routePattern: (typeof STEP_ROUTE_PATTERN_OPTIONS)[number];
  targetSelector: string;
  targetSelectorPath: string;
  snippetTitle: string;
  snippetBody: string;
  placement: (typeof STEP_PLACEMENT_OPTIONS)[number];
  targetPadding: string;
};

function createEmptyTourForm(): TourFormState {
  return {
    id: null,
    tourKey: "",
    tourName: "",
    featureName: "",
    status: "published",
    audienceType: "member",
  };
}

function createEmptyStepForm(nextStepNo = 1): StepFormState {
  return {
    id: null,
    stepKey: "",
    stepNo: String(nextStepNo),
    routePattern: "controlled",
    targetSelector: "",
    targetSelectorPath: "",
    snippetTitle: "",
    snippetBody: "",
    placement: "bottom",
    targetPadding: "8",
  };
}

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function AddGuidedForm() {
  const [tours, setTours] = useState<GuidedTourReferenceWithSteps[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
  const [tourForm, setTourForm] = useState<TourFormState>(createEmptyTourForm);
  const [stepForm, setStepForm] = useState<StepFormState>(createEmptyStepForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTour, setIsSavingTour] = useState(false);
  const [isSavingStep, setIsSavingStep] = useState(false);
  const stepFormRef = useRef<HTMLFormElement | null>(null);

  const selectedTour = useMemo(
    () => tours.find((tour) => tour.id === selectedTourId) ?? null,
    [tours, selectedTourId],
  );

  async function loadMaintenanceData(options?: {
    preserveSelection?: boolean;
    selectTourId?: number;
    selectTourKey?: string;
  }) {
    const result = await getGuidedTourMaintenanceDataAction();

    if (!result.success) {
      toast.error(result.message ?? "Unable to load guided tour maintenance data.");
      setTours([]);
      setSelectedTourId(null);
      setTourForm(createEmptyTourForm());
      setStepForm(createEmptyStepForm());
      setIsLoading(false);
      return;
    }

    const nextTours = result.tours;
    setTours(nextTours);

    const explicitSelectedTour =
      (options?.selectTourId
        ? nextTours.find((tour) => tour.id === options.selectTourId)
        : undefined)
      ?? (options?.selectTourKey
        ? nextTours.find((tour) => tour.tourKey === options.selectTourKey)
        : undefined);

    const preservedSelectedTour = options?.preserveSelection
      ? nextTours.find((tour) => tour.id === selectedTourId)
      : undefined;

    const fallbackTour = nextTours[0];
    const resolvedSelectedTour = explicitSelectedTour ?? preservedSelectedTour ?? fallbackTour ?? null;

    if (!resolvedSelectedTour) {
      setSelectedTourId(null);
      setTourForm(createEmptyTourForm());
      setStepForm(createEmptyStepForm());
      setIsLoading(false);
      return;
    }

    setSelectedTourId(resolvedSelectedTour.id);
    setTourForm({
      id: resolvedSelectedTour.id,
      tourKey: resolvedSelectedTour.tourKey,
      tourName: resolvedSelectedTour.tourName,
      featureName: resolvedSelectedTour.featureName,
      status: resolvedSelectedTour.status,
      audienceType: resolvedSelectedTour.audienceType,
    });

    const nextStepNo = (resolvedSelectedTour.steps.at(-1)?.stepNo ?? 0) + 1;
    setStepForm(createEmptyStepForm(nextStepNo));
    setIsLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadMaintenanceData({ preserveSelection: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectTour(tour: GuidedTourReferenceWithSteps) {
    setSelectedTourId(tour.id);
    setTourForm({
      id: tour.id,
      tourKey: tour.tourKey,
      tourName: tour.tourName,
      featureName: tour.featureName,
      status: tour.status,
      audienceType: tour.audienceType,
    });
    setStepForm(createEmptyStepForm((tour.steps.at(-1)?.stepNo ?? 0) + 1));
  }

  function startNewTour() {
    setSelectedTourId(null);
    setTourForm(createEmptyTourForm());
    setStepForm(createEmptyStepForm());
  }

  async function saveTour() {
    const payload = {
      tourKey: tourForm.tourKey.trim(),
      tourName: tourForm.tourName.trim(),
      featureName: tourForm.featureName.trim(),
      status: tourForm.status,
      audienceType: tourForm.audienceType,
    };

    if (!payload.tourKey || !payload.tourName || !payload.featureName) {
      toast.error("Tour key, name, and feature are required.");
      return;
    }

    setIsSavingTour(true);

    const result = tourForm.id
      ? await updateGuidedTourReferenceAction({ id: tourForm.id, ...payload })
      : await createGuidedTourReferenceAction(payload);

    setIsSavingTour(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    await loadMaintenanceData({
      preserveSelection: true,
      selectTourId: tourForm.id ?? undefined,
      selectTourKey: payload.tourKey,
    });
  }

  async function deleteTour() {
    if (!tourForm.id) {
      return;
    }

    const confirmed = window.confirm("Delete this guided tour and all of its step references?");

    if (!confirmed) {
      return;
    }

    setIsSavingTour(true);
    const result = await deleteGuidedTourReferenceAction(tourForm.id);
    setIsSavingTour(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    await loadMaintenanceData({ preserveSelection: false });
  }

  function editStep(step: GuidedTourStepReferenceItem) {
    setStepForm({
      id: step.id,
      stepKey: step.stepKey,
      stepNo: String(step.stepNo),
      routePattern: step.routePattern,
      targetSelector: step.targetSelector,
      targetSelectorPath: step.targetSelectorPath ?? "",
      snippetTitle: step.snippetTitle,
      snippetBody: step.snippetBody,
      placement: step.placement,
      targetPadding: String(step.targetPadding ?? 8),
    });

    requestAnimationFrame(() => {
      stepFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function prepareNewStep() {
    setStepForm(createEmptyStepForm((selectedTour?.steps.at(-1)?.stepNo ?? 0) + 1));
  }

  async function saveStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTourId) {
      toast.error("Select or create a tour before adding steps.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const submittedStepNo = String(formData.get("stepNo") ?? stepForm.stepNo);
    const submittedStepKey = String(formData.get("stepKey") ?? stepForm.stepKey).trim();
    const submittedTargetSelector = String(formData.get("targetSelector") ?? stepForm.targetSelector).trim();
    const submittedTargetSelectorPath = String(formData.get("targetSelectorPath") ?? stepForm.targetSelectorPath).trim();
    const submittedSnippetTitle = String(formData.get("snippetTitle") ?? stepForm.snippetTitle).trim();
    const submittedSnippetBody = String(formData.get("snippetBody") ?? stepForm.snippetBody).trim();
    const submittedTargetPadding = String(formData.get("targetPadding") ?? stepForm.targetPadding).trim();

    const parsedStepNo = Number.parseInt(submittedStepNo, 10);
    const parsedTargetPadding = Number.parseInt(submittedTargetPadding, 10);

    if (!Number.isInteger(parsedStepNo) || parsedStepNo < 1) {
      toast.error("Step number must be a positive integer.");
      return;
    }

    if (!Number.isInteger(parsedTargetPadding) || parsedTargetPadding < 0) {
      toast.error("Target padding must be a non-negative integer.");
      return;
    }

    const payload = {
      tourId: selectedTourId,
      stepKey: submittedStepKey,
      stepNo: parsedStepNo,
      routePattern: stepForm.routePattern,
      targetSelector: submittedTargetSelector,
      targetSelectorPath: submittedTargetSelectorPath || null,
      snippetTitle: submittedSnippetTitle,
      snippetBody: submittedSnippetBody,
      placement: stepForm.placement,
      targetPadding: parsedTargetPadding,
    };

    setIsSavingStep(true);

    const result = stepForm.id
      ? await updateGuidedTourStepReferenceAction({ id: stepForm.id, ...payload })
      : await createGuidedTourStepReferenceAction(payload);

    setIsSavingStep(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    await loadMaintenanceData({ preserveSelection: true, selectTourId: selectedTourId });

    const nextStepNo = (selectedTour?.steps.at(-1)?.stepNo ?? 0) + 1;
    setStepForm(createEmptyStepForm(nextStepNo));
  }

  async function deleteStep(stepId: number) {
    const confirmed = window.confirm("Delete this step reference?");

    if (!confirmed) {
      return;
    }

    setIsSavingStep(true);
    const result = await deleteGuidedTourStepReferenceAction(stepId);
    setIsSavingStep(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    await loadMaintenanceData({ preserveSelection: true, selectTourId: selectedTourId ?? undefined });
    setStepForm(createEmptyStepForm((selectedTour?.steps.at(-1)?.stepNo ?? 0) + 1));
  }

  if (isLoading) {
    return (
      <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#d8e6ec] bg-white/95 p-10 text-center text-[#35566a] shadow-[0_20px_80px_rgba(19,55,71,0.10)]">
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
          Loading guided tour references...
        </div>
      </section>
    );
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(7,52,70,0.95),rgba(21,97,121,0.92)_50%,rgba(241,170,89,0.92))] px-6 py-8 text-white shadow-[0_28px_80px_-42px_rgba(5,32,50,0.85)] sm:px-8">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#d8f1ff]">Guided Tour Maintenance</p>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Tour Reference Admin</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#e8f8ff]">
            Maintain guided tour metadata and step references used to drive your family schema joyrides.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-[#c8d8df] bg-[#eef5f8] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4f7a8c] transition hover:bg-[#dcedf4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5d8191]"
            >
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Back to Main Page
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-12">
          <aside className="rounded-2xl border border-[#dbe6eb] bg-white/95 p-5 shadow-[0_20px_60px_rgba(19,55,71,0.08)] lg:col-span-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5d8191]">Guided Tours</p>
                <h2 className="mt-1 text-lg font-bold text-[#153445]">Reference List</h2>
              </div>
              <Button
                type="button"
                onClick={startNewTour}
                className="h-9 rounded-xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] px-3 text-xs font-bold text-white"
              >
                <PlusCircle className="mr-1 h-4 w-4" />
                Add Tour
              </Button>
            </div>

            <ul className="space-y-2">
              {tours.length === 0 && (
                <li className="rounded-xl border border-dashed border-[#c9dbe4] bg-[#f8fbfd] px-4 py-6 text-sm text-[#4f6d7a]">
                  No guided tours found. Add your first reference.
                </li>
              )}

              {tours.map((tour) => {
                const selected = selectedTourId === tour.id;

                return (
                  <li key={tour.id}>
                    <button
                      type="button"
                      onClick={() => selectTour(tour)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                        selected
                          ? "border-[#65a9c9] bg-[#eef7fb] shadow-sm"
                          : "border-[#d3e2e9] bg-white hover:border-[#9ec2d4]"
                      }`}
                    >
                      <p className="text-sm font-bold text-[#13384d]">{tour.tourName}</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-[#4f7a8c]">{tour.featureName}</p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#6b8d9d]">
                        <span>{tour.tourKey}</span>
                        <span className="rounded-full bg-[#dceef7] px-2 py-0.5">{tour.status}</span>
                        <span className="rounded-full bg-[#eff6f9] px-2 py-0.5">{tour.steps.length} steps</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="space-y-6 lg:col-span-8">
            <section className="rounded-2xl border border-[#dbe6eb] bg-white/95 p-5 shadow-[0_20px_60px_rgba(19,55,71,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5d8191]">
                {tourForm.id ? "Edit Guided Tour" : "Add Guided Tour"}
              </p>
              <h2 className="mt-2 text-xl font-bold text-[#153445]">
                {tourForm.id ? `Tour #${tourForm.id}` : "Create a New Tour Reference"}
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f7a8c]">Tour Key</span>
                  <Input
                    value={tourForm.tourKey}
                    onChange={(event) => setTourForm((prev) => ({ ...prev, tourKey: event.target.value }))}
                    placeholder="new_member"
                    className="border-[#c8d8df] bg-white text-[#153445]"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f7a8c]">Feature Name</span>
                  <Input
                    value={tourForm.featureName}
                    onChange={(event) => setTourForm((prev) => ({ ...prev, featureName: event.target.value }))}
                    placeholder="member_account"
                    className="border-[#c8d8df] bg-white text-[#153445]"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f7a8c]">Tour Name</span>
                  <Input
                    value={tourForm.tourName}
                    onChange={(event) => setTourForm((prev) => ({ ...prev, tourName: event.target.value }))}
                    placeholder="Getting Started"
                    className="border-[#c8d8df] bg-white text-[#153445]"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f7a8c]">Status</span>
                  <Select
                    value={tourForm.status}
                    onValueChange={(value) =>
                      setTourForm((prev) => ({ ...prev, status: value as TourFormState["status"] }))
                    }
                  >
                    <SelectTrigger className="w-full border-[#c8d8df] bg-white text-[#153445]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOUR_STATUS_OPTIONS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f7a8c]">Audience Type</span>
                  <Select
                    value={tourForm.audienceType}
                    onValueChange={(value) =>
                      setTourForm((prev) => ({ ...prev, audienceType: value as TourFormState["audienceType"] }))
                    }
                  >
                    <SelectTrigger className="w-full border-[#c8d8df] bg-white text-[#153445]">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOUR_AUDIENCE_OPTIONS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={saveTour}
                  disabled={isSavingTour}
                  className="h-10 rounded-xl bg-[#0d6789] px-4 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#0b5874]"
                >
                  {isSavingTour ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                  {tourForm.id ? "Update Tour" : "Create Tour"}
                </Button>

                {tourForm.id && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={deleteTour}
                    disabled={isSavingTour}
                    className="h-10 rounded-xl border-[#d8b8b8] bg-[#fff7f7] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#a33c3c] hover:bg-[#ffecec]"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete Tour
                  </Button>
                )}

                {tourForm.id && (
                  <span className="text-xs text-[#6e8b99]">Last updated {formatDate(selectedTour?.updatedAt ?? null)}</span>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#dbe6eb] bg-white/95 p-5 shadow-[0_20px_60px_rgba(19,55,71,0.08)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5d8191]">Step References</p>
                  <h2 className="mt-1 text-xl font-bold text-[#153445]">
                    {selectedTour ? `${selectedTour.tourName} Steps` : "Select a Tour"}
                  </h2>
                </div>
                {selectedTour && (
                  <Button
                    type="button"
                    onClick={prepareNewStep}
                    variant="outline"
                    className="h-9 rounded-xl border-[#9ac2d4] bg-[#f2f9fd] px-3 text-xs font-bold text-[#135372]"
                  >
                    <PlusCircle className="mr-1 h-4 w-4" />
                    New Step
                  </Button>
                )}
              </div>

              {!selectedTour && (
                <div className="rounded-xl border border-dashed border-[#c9dbe4] bg-[#f8fbfd] px-4 py-6 text-sm text-[#4f6d7a]">
                  Save a tour first, then you can add step references.
                </div>
              )}

              {selectedTour && (
                <>
                  <ul className="mb-5 space-y-2">
                    {selectedTour.steps.length === 0 && (
                      <li className="rounded-xl border border-dashed border-[#c9dbe4] bg-[#f8fbfd] px-4 py-6 text-sm text-[#4f6d7a]">
                        No steps found for this tour.
                      </li>
                    )}

                    {selectedTour.steps.map((step) => (
                      <li
                        key={step.id}
                        className={`flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                          stepForm.id === step.id
                            ? "border-[#65a9c9] bg-[#eef7fb] shadow-sm"
                            : "border-[#d9e7ee] bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => editStep(step)}
                          className="flex-1 text-left"
                        >
                          <p className="text-sm font-bold text-[#153445]">{step.stepNo}. {step.snippetTitle}</p>
                          <p className="text-xs uppercase tracking-[0.12em] text-[#4f7a8c]">{step.stepKey}</p>
                          <p className="text-xs text-[#6f8793]">
                            {step.routePattern} | {step.placement} | {step.targetSelector}
                          </p>
                        </button>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => deleteStep(step.id)}
                            className="h-8 rounded-lg border-[#e0c2c2] bg-[#fff7f7] px-3 text-xs text-[#a33c3c]"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <form
                    onSubmit={saveStep}
                    ref={stepFormRef}
                    className="rounded-xl border border-[#d6e5ec] bg-[#f7fbfd] p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5d8191]">
                      {stepForm.id ? "Edit Step" : "Add Step"}
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f7a8c]">Step Key</span>
                        <Input
                          name="stepKey"
                          value={stepForm.stepKey}
                          onChange={(event) => setStepForm((prev) => ({ ...prev, stepKey: event.target.value }))}
                          placeholder="member_start"
                          className="border-[#c8d8df] bg-white text-[#153445]"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f7a8c]">Step Number</span>
                        <Input
                          name="stepNo"
                          type="number"
                          min={1}
                          value={stepForm.stepNo}
                          onChange={(event) => setStepForm((prev) => ({ ...prev, stepNo: event.target.value }))}
                          className="border-[#c8d8df] bg-white text-[#153445]"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f7a8c]">Route Pattern</span>
                        <Select
                          value={stepForm.routePattern}
                          onValueChange={(value) =>
                            setStepForm((prev) => ({ ...prev, routePattern: value as StepFormState["routePattern"] }))
                          }
                        >
                          <SelectTrigger className="w-full border-[#c8d8df] bg-white text-[#153445]">
                            <SelectValue placeholder="Select route pattern" />
                          </SelectTrigger>
                          <SelectContent>
                            {STEP_ROUTE_PATTERN_OPTIONS.map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f7a8c]">Placement</span>
                        <Select
                          value={stepForm.placement}
                          onValueChange={(value) =>
                            setStepForm((prev) => ({ ...prev, placement: value as StepFormState["placement"] }))
                          }
                        >
                          <SelectTrigger className="w-full border-[#c8d8df] bg-white text-[#153445]">
                            <SelectValue placeholder="Select placement" />
                          </SelectTrigger>
                          <SelectContent>
                            {STEP_PLACEMENT_OPTIONS.map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f7a8c]">Target Padding</span>
                        <Input
                          name="targetPadding"
                          type="number"
                          min={0}
                          value={stepForm.targetPadding}
                          onChange={(event) => setStepForm((prev) => ({ ...prev, targetPadding: event.target.value }))}
                          className="border-[#c8d8df] bg-white text-[#153445]"
                        />
                      </label>

                      <label className="space-y-2 sm:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f7a8c]">Target Selector</span>
                        <Input
                          name="targetSelector"
                          value={stepForm.targetSelector}
                          onChange={(event) => setStepForm((prev) => ({ ...prev, targetSelector: event.target.value }))}
                          placeholder="enter DOM id placeholder"
                          className="border-[#c8d8df] bg-white text-[#153445]"
                        />
                      </label>

                      <label className="space-y-2 sm:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f7a8c]">Target Selector Path</span>
                        <Input
                          name="targetSelectorPath"
                          value={stepForm.targetSelectorPath}
                          onChange={(event) => setStepForm((prev) => ({ ...prev, targetSelectorPath: event.target.value }))}
                          placeholder="Optional note describing where the target placeholder lives"
                          className="border-[#c8d8df] bg-white text-[#153445]"
                        />
                      </label>

                      <label className="space-y-2 sm:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f7a8c]">Snippet Title</span>
                        <Input
                          name="snippetTitle"
                          value={stepForm.snippetTitle}
                          onChange={(event) => setStepForm((prev) => ({ ...prev, snippetTitle: event.target.value }))}
                          placeholder="Member Profile Settings"
                          className="border-[#c8d8df] bg-white text-[#153445]"
                        />
                      </label>

                      <label className="space-y-2 sm:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f7a8c]">Snippet Body</span>
                        <Textarea
                          name="snippetBody"
                          value={stepForm.snippetBody}
                          onChange={(event) => setStepForm((prev) => ({ ...prev, snippetBody: event.target.value }))}
                          placeholder="First things first, let's review and update your member profile."
                          className="min-h-27.5 border-[#c8d8df] bg-white text-[#153445]"
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button
                        type="submit"
                        disabled={isSavingStep}
                        className="h-10 rounded-xl bg-[#0d6789] px-4 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#0b5874]"
                      >
                        {isSavingStep ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                        {stepForm.id ? "Update Step" : "Create Step"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prepareNewStep}
                        className="h-10 rounded-xl border-[#c8d8df] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#4f7a8c]"
                      >
                        Reset Step Form
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </section>
          </div>
        </section>
      </div>
    </section>
  );
}