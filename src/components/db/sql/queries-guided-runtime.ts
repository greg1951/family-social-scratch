import { and, asc, desc, eq, gte, inArray, isNull, lte, notInArray, or } from "drizzle-orm";

import db from "@/components/db/drizzle";
import {
  guidedMemberTourProgress,
  guidedMemberTourStepProgress,
  memberOption,
} from "@/components/db/schema/family-social-schema-tables";
import {
  guidedTourReference,
  guidedTourStepReference,
  memberOptionReference,
} from "@/components/db/schema/global-schema-tables";
import { logDbQueryError } from "@/components/db/sql/db-error-logger";

const TOUR_GUIDE_OPTION_NAME = "Tour Guide";
const FINISHED_STEP_STATUSES = ["completed", "skipped", "dismissed"] as const;

type GuidedStepStatus =
  | "not_started"
  | "in_progress"
  | "viewed"
  | "completed"
  | "skipped"
  | "dismissed";

type GuidedTourStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped"
  | "dismissed";

export type GuidedTourRuntimeStep = {
  stepId: number;
  stepNo: number;
  stepKey: string;
  targetSelector: string;
  targetSelectorPath: string | null;
  target: string;
  snippetTitle: string;
  snippetBody: string;
  placement: string;
  targetPadding: number;
  routePattern: string;
  status: GuidedStepStatus;
};

export type GuidedTourLaunchPayload = {
  memberTourProgressId: number;
  tourId: number;
  tourKey: string;
  tourName: string;
  startIndex: number;
  currentStepNo: number;
  steps: GuidedTourRuntimeStep[];
};

export type GuidedTourLaunchResult =
  | {
      success: true;
      launch: true;
      payload: GuidedTourLaunchPayload;
    }
  | {
      success: true;
      launch: false;
      reason: string;
    }
  | {
      success: false;
      message: string;
    };

export type ResolveGuidedTourLaunchInput = {
  memberId: number;
  familyId: number;
  isFounder: boolean;
  tourKey: string;
  audienceType?: "member" | "founder" | "all" | "support";
};

export type ApplyGuidedTourProgressCommandInput = {
  memberId: number;
  familyId: number;
  memberTourProgressId: number;
  command:
    | "start_tour"
    | "complete_step"
    | "skip_step"
    | "reset_step"
    | "finish_tour"
    | "complete_tour"
    | "dismiss_tour"
    | "heartbeat";
  stepNo?: number;
  neverShowAgain?: boolean;
};

export type GuidedTourMutationResult =
  | { success: true; message: string }
  | { success: false; message: string };

function normalizeTargetSelector(targetSelector: string, targetSelectorPath: string | null): string {
  const pathLikePattern = /[\\/]|\.(tsx?|jsx?|md|sql)$/i;
  const idLikePattern = /^[A-Za-z][A-Za-z0-9_-]*$/;

  const toUsableSelector = (raw: string | null | undefined): string | null => {
    const candidate = raw?.trim() ?? "";

    if (candidate.length === 0) {
      return null;
    }

    if (candidate === "body") {
      return "body";
    }

    if (
      candidate.startsWith("#") ||
      candidate.startsWith(".") ||
      candidate.startsWith("[") ||
      candidate.startsWith(":") ||
      candidate.includes(" ") ||
      candidate.includes(">")
    ) {
      return candidate;
    }

    if (pathLikePattern.test(candidate)) {
      return null;
    }

    if (idLikePattern.test(candidate)) {
      return `#${candidate}`;
    }

    return null;
  };

  return toUsableSelector(targetSelectorPath) ?? toUsableSelector(targetSelector) ?? "body";
}

export async function resolveGuidedTourLaunch(
  input: ResolveGuidedTourLaunchInput
): Promise<GuidedTourLaunchResult> {
  if (input.isFounder) {
    return {
      success: true,
      launch: false,
      reason: "Founder account is not eligible for this tour.",
    };
  }

  try {
    const [tourGuideOption] = await db
      .select({ isSelected: memberOption.isSelected })
      .from(memberOption)
      .innerJoin(memberOptionReference, eq(memberOption.optionId, memberOptionReference.id))
      .where(
        and(
          eq(memberOption.memberId, input.memberId),
          eq(memberOptionReference.optionName, TOUR_GUIDE_OPTION_NAME)
        )
      )
      .limit(1);

    if (!tourGuideOption?.isSelected) {
      return {
        success: true,
        launch: false,
        reason: "Tour Guide option is disabled.",
      };
    }

    const now = new Date();
    const audienceValues = Array.from(new Set(["all", input.audienceType ?? "member"]));

    const [tour] = await db
      .select({
        id: guidedTourReference.id,
        tourKey: guidedTourReference.tourKey,
        tourName: guidedTourReference.tourName,
        versionMajor: guidedTourReference.versionMajor,
        versionMinor: guidedTourReference.versionMinor,
        versionPatch: guidedTourReference.versionPatch,
      })
      .from(guidedTourReference)
      .where(
        and(
          eq(guidedTourReference.tourKey, input.tourKey),
          eq(guidedTourReference.status, "published"),
          inArray(guidedTourReference.audienceType, audienceValues),
          or(isNull(guidedTourReference.startsAt), lte(guidedTourReference.startsAt, now)),
          or(isNull(guidedTourReference.endsAt), gte(guidedTourReference.endsAt, now))
        )
      )
      .orderBy(
        desc(guidedTourReference.versionMajor),
        desc(guidedTourReference.versionMinor),
        desc(guidedTourReference.versionPatch),
        desc(guidedTourReference.id)
      )
      .limit(1);

    if (!tour) {
      return {
        success: true,
        launch: false,
        reason: "No published tour matched the member audience.",
      };
    }

    const tourSteps = await db
      .select({
        id: guidedTourStepReference.id,
        stepNo: guidedTourStepReference.stepNo,
        stepKey: guidedTourStepReference.stepKey,
        targetSelector: guidedTourStepReference.targetSelector,
        targetSelectorPath: guidedTourStepReference.targetSelectorPath,
        snippetTitle: guidedTourStepReference.snippetTitle,
        snippetBody: guidedTourStepReference.snippetBody,
        placement: guidedTourStepReference.placement,
        targetPadding: guidedTourStepReference.highlightPadding,
        routePattern: guidedTourStepReference.routePattern,
      })
      .from(guidedTourStepReference)
      .where(eq(guidedTourStepReference.tourId, tour.id))
      .orderBy(asc(guidedTourStepReference.stepNo), asc(guidedTourStepReference.id));

    if (tourSteps.length === 0) {
      return {
        success: true,
        launch: false,
        reason: "Tour has no steps.",
      };
    }

    await db
      .insert(guidedMemberTourProgress)
      .values({
        memberId: input.memberId,
        familyId: input.familyId,
        tourId: tour.id,
        versionMajor: tour.versionMajor,
        versionMinor: tour.versionMinor,
        versionPatch: tour.versionPatch,
        status: "not_started",
        currentStepNo: 1,
        updatedAt: now,
      })
      .onConflictDoNothing({
        target: [
          guidedMemberTourProgress.memberId,
          guidedMemberTourProgress.familyId,
          guidedMemberTourProgress.tourId,
          guidedMemberTourProgress.versionMajor,
          guidedMemberTourProgress.versionMinor,
          guidedMemberTourProgress.versionPatch,
        ],
      });

    const [progress] = await db
      .select({
        id: guidedMemberTourProgress.id,
        status: guidedMemberTourProgress.status,
        currentStepNo: guidedMemberTourProgress.currentStepNo,
        startedAt: guidedMemberTourProgress.startedAt,
        neverShowAgain: guidedMemberTourProgress.neverShowAgain,
      })
      .from(guidedMemberTourProgress)
      .where(
        and(
          eq(guidedMemberTourProgress.memberId, input.memberId),
          eq(guidedMemberTourProgress.familyId, input.familyId),
          eq(guidedMemberTourProgress.tourId, tour.id),
          eq(guidedMemberTourProgress.versionMajor, tour.versionMajor),
          eq(guidedMemberTourProgress.versionMinor, tour.versionMinor),
          eq(guidedMemberTourProgress.versionPatch, tour.versionPatch)
        )
      )
      .limit(1);

    if (!progress) {
      return {
        success: false,
        message: "Unable to initialize tour progress.",
      };
    }

    if (progress.neverShowAgain) {
      return {
        success: true,
        launch: false,
        reason: "Member has dismissed this tour permanently.",
      };
    }

    for (const step of tourSteps) {
      await db
        .insert(guidedMemberTourStepProgress)
        .values({
          memberTourProgressId: progress.id,
          stepId: step.id,
          stepNo: step.stepNo,
          status: "not_started",
          updatedAt: now,
        })
        .onConflictDoNothing({
          target: [guidedMemberTourStepProgress.memberTourProgressId, guidedMemberTourStepProgress.stepId],
        });
    }

    const stepProgressRows = await db
      .select({
        stepId: guidedTourStepReference.id,
        stepNo: guidedMemberTourStepProgress.stepNo,
        stepKey: guidedTourStepReference.stepKey,
        targetSelector: guidedTourStepReference.targetSelector,
        targetSelectorPath: guidedTourStepReference.targetSelectorPath,
        snippetTitle: guidedTourStepReference.snippetTitle,
        snippetBody: guidedTourStepReference.snippetBody,
        placement: guidedTourStepReference.placement,
        targetPadding: guidedTourStepReference.highlightPadding,
        routePattern: guidedTourStepReference.routePattern,
        status: guidedMemberTourStepProgress.status,
      })
      .from(guidedMemberTourStepProgress)
      .innerJoin(guidedTourStepReference, eq(guidedMemberTourStepProgress.stepId, guidedTourStepReference.id))
      .where(
        and(
          eq(guidedMemberTourStepProgress.memberTourProgressId, progress.id),
          eq(guidedTourStepReference.tourId, tour.id)
        )
      )
      .orderBy(asc(guidedMemberTourStepProgress.stepNo), asc(guidedTourStepReference.id));

    const remainingSteps = stepProgressRows.filter(
      (step) => !FINISHED_STEP_STATUSES.includes(step.status as (typeof FINISHED_STEP_STATUSES)[number])
    );

    if (remainingSteps.length === 0) {
      const completionStepNo = stepProgressRows.at(-1)?.stepNo ?? progress.currentStepNo;

      await db
        .update(guidedMemberTourProgress)
        .set({
          status: "completed",
          currentStepNo: completionStepNo,
          completedAt: now,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(guidedMemberTourProgress.id, progress.id));

      return {
        success: true,
        launch: false,
        reason: "Tour already completed.",
      };
    }

    const currentStepNo = remainingSteps[0].stepNo;

    await db
      .update(guidedMemberTourProgress)
      .set({
        status: "in_progress",
        currentStepNo,
        startedAt: progress.startedAt ?? now,
        lastSeenAt: now,
        updatedAt: now,
      })
      .where(eq(guidedMemberTourProgress.id, progress.id));

    return {
      success: true,
      launch: true,
      payload: {
        memberTourProgressId: progress.id,
        tourId: tour.id,
        tourKey: tour.tourKey,
        tourName: tour.tourName,
        startIndex: 0,
        currentStepNo,
        steps: remainingSteps.map((step) => ({
          stepId: step.stepId,
          stepNo: step.stepNo,
          stepKey: step.stepKey,
          targetSelector: step.targetSelector,
          targetSelectorPath: step.targetSelectorPath,
          target: normalizeTargetSelector(step.targetSelector, step.targetSelectorPath),
          snippetTitle: step.snippetTitle,
          snippetBody: step.snippetBody,
          placement: step.placement,
          targetPadding: step.targetPadding,
          routePattern: step.routePattern,
          status: (step.status as GuidedStepStatus) ?? "not_started",
        })),
      },
    };
  } catch (error) {
    logDbQueryError("guided.resolveGuidedTourLaunch", error, {
      memberId: input.memberId,
      familyId: input.familyId,
      tourKey: input.tourKey,
    });

    return {
      success: false,
      message: "Unable to resolve guided tour launch state.",
    };
  }
}

export async function applyGuidedTourProgressCommand(
  input: ApplyGuidedTourProgressCommandInput
): Promise<GuidedTourMutationResult> {
  try {
    const [progress] = await db
      .select({
        id: guidedMemberTourProgress.id,
        status: guidedMemberTourProgress.status,
        currentStepNo: guidedMemberTourProgress.currentStepNo,
      })
      .from(guidedMemberTourProgress)
      .where(
        and(
          eq(guidedMemberTourProgress.id, input.memberTourProgressId),
          eq(guidedMemberTourProgress.memberId, input.memberId),
          eq(guidedMemberTourProgress.familyId, input.familyId)
        )
      )
      .limit(1);

    if (!progress) {
      return {
        success: false,
        message: "Guided tour progress was not found.",
      };
    }

    const now = new Date();

    if (input.command === "start_tour" || input.command === "heartbeat") {
      await db
        .update(guidedMemberTourProgress)
        .set({
          status: progress.status === "not_started" ? "in_progress" : progress.status,
          startedAt: progress.status === "not_started" ? now : undefined,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(guidedMemberTourProgress.id, progress.id));

      return {
        success: true,
        message: "Tour heartbeat saved.",
      };
    }

    if (input.command === "complete_tour") {
      await db
        .update(guidedMemberTourProgress)
        .set({
          status: "completed",
          completedAt: now,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(guidedMemberTourProgress.id, progress.id));

      return {
        success: true,
        message: "Tour marked complete.",
      };
    }

    if (input.command === "finish_tour") {
      const unfinishedStepStatuses = ["not_started", "in_progress", "viewed"] as const;

      await db
        .update(guidedMemberTourStepProgress)
        .set({
          status: "completed",
          completedAt: now,
          skippedAt: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(guidedMemberTourStepProgress.memberTourProgressId, progress.id),
            inArray(guidedMemberTourStepProgress.status, unfinishedStepStatuses)
          )
        );

      await db
        .update(guidedMemberTourProgress)
        .set({
          status: "completed",
          currentStepNo: input.stepNo ?? progress.currentStepNo,
          completedAt: now,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(guidedMemberTourProgress.id, progress.id));

      return {
        success: true,
        message: "Tour finished.",
      };
    }

    if (input.command === "dismiss_tour") {
      await db
        .update(guidedMemberTourProgress)
        .set({
          status: "dismissed",
          dismissedAt: now,
          neverShowAgain: input.neverShowAgain ?? false,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(guidedMemberTourProgress.id, progress.id));

      return {
        success: true,
        message: "Tour dismissed.",
      };
    }

    if (!input.stepNo || input.stepNo < 1) {
      return {
        success: false,
        message: "A valid step number is required.",
      };
    }

    const nextStepStatus = input.command === "skip_step"
      ? "skipped"
      : input.command === "reset_step"
        ? "not_started"
        : "completed";

    const shouldClearStepProgress = input.command === "reset_step";

    await db
      .update(guidedMemberTourStepProgress)
      .set({
        status: nextStepStatus,
        viewedAt: shouldClearStepProgress ? null : now,
        completedAt: input.command === "complete_step" ? now : null,
        skippedAt: input.command === "skip_step" ? now : null,
        updatedAt: now,
        timeSpentMs: shouldClearStepProgress ? 0 : undefined,
      })
      .where(
        and(
          eq(guidedMemberTourStepProgress.memberTourProgressId, progress.id),
          eq(guidedMemberTourStepProgress.stepNo, input.stepNo)
        )
      );

    if (input.command === "reset_step") {
      await db
        .update(guidedMemberTourProgress)
        .set({
          status: "in_progress",
          currentStepNo: input.stepNo,
          completedAt: null,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(guidedMemberTourProgress.id, progress.id));

      return {
        success: true,
        message: "Tour step reopened.",
      };
    }

    const [nextRemainingStep] = await db
      .select({ stepNo: guidedMemberTourStepProgress.stepNo })
      .from(guidedMemberTourStepProgress)
      .where(
        and(
          eq(guidedMemberTourStepProgress.memberTourProgressId, progress.id),
          notInArray(guidedMemberTourStepProgress.status, [...FINISHED_STEP_STATUSES])
        )
      )
      .orderBy(asc(guidedMemberTourStepProgress.stepNo))
      .limit(1);

    if (!nextRemainingStep) {
      await db
        .update(guidedMemberTourProgress)
        .set({
          status: "completed",
          currentStepNo: input.stepNo,
          completedAt: now,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(guidedMemberTourProgress.id, progress.id));

      return {
        success: true,
        message: "Tour marked complete.",
      };
    }

    await db
      .update(guidedMemberTourProgress)
      .set({
        status: "in_progress",
        currentStepNo: nextRemainingStep.stepNo,
        completedAt: null,
        lastSeenAt: now,
        updatedAt: now,
      })
      .where(eq(guidedMemberTourProgress.id, progress.id));

    return {
      success: true,
      message: "Step progress updated.",
    };
  } catch (error) {
    logDbQueryError("guided.applyGuidedTourProgressCommand", error, {
      memberId: input.memberId,
      familyId: input.familyId,
      memberTourProgressId: input.memberTourProgressId,
      command: input.command,
      stepNo: input.stepNo,
    });
    return {
      success: false,
      message: "Unable to update guided tour progress.",
    };
  }
}
