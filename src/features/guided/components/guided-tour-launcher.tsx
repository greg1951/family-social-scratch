"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ACTIONS, EVENTS, Joyride, STATUS, type EventData, type Step } from "react-joyride";

import {
  applyGuidedTourProgressCommandAction,
  getGuidedTourLaunchPlanAction,
} from "@/app/(main)/guided-tour/actions";
import type { GuidedTourLaunchPayload } from "@/components/db/sql/queries-guided-runtime";
import GuidedTourTooltip, { getGuidedTourTheme } from "./guided-tour-tooltip";

function normalizePlacement(value: string): Step["placement"] {
  type JoyridePlacement = Exclude<Step["placement"], undefined>;

  if (value === "centered") {
    return "center";
  }

  const validPlacements: JoyridePlacement[] = [
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
    "center",
  ];

  const isPlacement = (candidate: string): candidate is JoyridePlacement =>
    validPlacements.includes(candidate as JoyridePlacement);

  if (isPlacement(value)) {
    return value;
  }

  return "bottom";
}

function canResolveTarget(selector: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  try {
    return !!document.querySelector(selector);
  } catch {
    return false;
  }
}

function findNextResolvableStepIndex(steps: GuidedTourLaunchPayload["steps"], fromIndex: number): number {
  for (let index = fromIndex; index < steps.length; index += 1) {
    if (canResolveTarget(steps[index].target)) {
      return index;
    }
  }

  return -1;
}

function renderGuidedTourContent(step: GuidedTourLaunchPayload["steps"][number]): ReactNode {
  return <div dangerouslySetInnerHTML={{ __html: step.snippetBody }} />;
}

type GuidedTourStepData = {
  tourKey: string;
  onSkipStep: () => void;
  onFinishTour: () => void;
};

type GuidedTourLauncherProps = {
  initialPayload?: GuidedTourLaunchPayload | null;
  tourKey?: string;
};

export default function GuidedTourLauncher({ initialPayload, tourKey = "new_member" }: GuidedTourLauncherProps) {
  const [launchPayload, setLaunchPayload] = useState<GuidedTourLaunchPayload | null>(null);
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const terminalStateHandledRef = useRef(false);

  const joyrideSteps = useMemo<Step[]>(() => {
    if (!launchPayload) {
      return [];
    }

    const tourTheme = getGuidedTourTheme(launchPayload.tourKey);

    return launchPayload.steps.map((step, index) => ({
      target: step.target,
      title: step.snippetTitle,
      content: renderGuidedTourContent(step),
      placement: normalizePlacement(step.placement),
      spotlightPadding: step.targetPadding,
      styles: tourTheme.styles,
      data: {
        tourKey: launchPayload.tourKey,
        onSkipStep: () => {
          void applyGuidedTourProgressCommandAction({
            memberTourProgressId: launchPayload.memberTourProgressId,
            command: "skip_step",
            stepNo: step.stepNo,
          });

          const nextIndex = Math.min(index + 1, launchPayload.steps.length - 1);

          if (nextIndex === index) {
            setRun(false);
            return;
          }

          setStepIndex(nextIndex);
        },
        onFinishTour: () => {
          void applyGuidedTourProgressCommandAction({
            memberTourProgressId: launchPayload.memberTourProgressId,
            command: "finish_tour",
            stepNo: step.stepNo,
          });

          terminalStateHandledRef.current = true;
          setRun(false);
        },
      } satisfies GuidedTourStepData,
      skipBeacon: true,
    }));
  }, [launchPayload]);

  useEffect(() => {
    let isCancelled = false;

    async function loadLaunchPlan() {
      const loadCurrentTourLaunchPlan = () => getGuidedTourLaunchPlanAction(tourKey);

      if (initialPayload !== undefined) {
        // Reconcile with a fresh resolver call to avoid stale route-cache payloads
        // relaunching a tour that is already completed.
        setIsLoading(true);
        const refreshedResult = await loadCurrentTourLaunchPlan();

        if (isCancelled) {
          return;
        }

        if (!refreshedResult.success || !refreshedResult.launch) {
          setRun(false);
          setLaunchPayload(null);
          setStepIndex(0);
          setIsLoading(false);
          return;
        }

        terminalStateHandledRef.current = false;
        setLaunchPayload(refreshedResult.payload);
        setStepIndex(refreshedResult.payload.startIndex);
        setRun(true);
        setIsLoading(false);
        return;
      }

        setIsLoading(true);
        const result = await loadCurrentTourLaunchPlan();

      if (isCancelled) {
        return;
      }

      if (!result.success || !result.launch) {
        setRun(false);
        setLaunchPayload(null);
        setStepIndex(0);
        setIsLoading(false);
        return;
      }

      terminalStateHandledRef.current = false;
      setLaunchPayload(result.payload);
      setStepIndex(result.payload.startIndex);
      setRun(true);
      setIsLoading(false);
    }

    void loadLaunchPlan();

    return () => {
      isCancelled = true;
    };
  }, [initialPayload, tourKey]);

  const handleCallback = (data: EventData) => {
    if (!launchPayload || joyrideSteps.length === 0) {
      return;
    }

    if (data.type === EVENTS.STEP_AFTER) {
      const activeStep = launchPayload.steps[data.index];
      if (!activeStep) {
        return;
      }

      if (data.action === ACTIONS.PREV) {
        const previousStep = launchPayload.steps[data.index - 1];

        if (previousStep) {
          void applyGuidedTourProgressCommandAction({
            memberTourProgressId: launchPayload.memberTourProgressId,
            command: "reset_step",
            stepNo: previousStep.stepNo,
          });
        }

        setStepIndex(Math.max(data.index - 1, 0));
        return;
      }

      if (data.action === ACTIONS.NEXT) {
        void applyGuidedTourProgressCommandAction({
          memberTourProgressId: launchPayload.memberTourProgressId,
          command: "complete_step",
          stepNo: activeStep.stepNo,
        });

        const nextIndex = Math.min(data.index + 1, joyrideSteps.length - 1);
        setStepIndex(nextIndex);
      }

      return;
    }

    if (data.type === EVENTS.TARGET_NOT_FOUND) {
      const unresolvedStep = launchPayload.steps[data.index];
      const nextResolvableStepIndex = findNextResolvableStepIndex(launchPayload.steps, data.index + 1);

      if (unresolvedStep && nextResolvableStepIndex >= 0) {
        // Treat cross-page target transitions as completed when the user has
        // already progressed to a later resolvable step on the current page.
        void applyGuidedTourProgressCommandAction({
          memberTourProgressId: launchPayload.memberTourProgressId,
          command: "complete_step",
          stepNo: unresolvedStep.stepNo,
        });

        setStepIndex(nextResolvableStepIndex);
        return;
      }

      // Pause when no current-page target can be resolved. The next route/page
      // mount will reconcile with fresh launch state and resume there.
      setRun(false);
      setStepIndex(Math.max(data.index, 0));
      return;
    }

    if (data.status === STATUS.FINISHED) {
      setRun(false);
      if (!terminalStateHandledRef.current) {
        terminalStateHandledRef.current = true;
        void applyGuidedTourProgressCommandAction({
          memberTourProgressId: launchPayload.memberTourProgressId,
          command: "complete_tour",
        });
      }
      return;
    }

  };

  if (isLoading || joyrideSteps.length === 0) {
    return null;
  }

  return (
    <Joyride
      onEvent={handleCallback}
      continuous
      tooltipComponent={GuidedTourTooltip}
      options={{
        buttons: ["back", "close", "primary", "skip"],
        hideOverlay: true,
        blockTargetInteraction: false,
        overlayClickAction: false,
        showProgress: false,
        targetWaitTimeout: 4000,
        zIndex: 1100,
      }}
      run={run}
      stepIndex={stepIndex}
      steps={joyrideSteps}
    />
  );
}
