import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import db from "@/components/db/drizzle";
import {
  guidedTourReference,
  guidedTourStepReference,
} from "@/components/db/schema/global-schema-tables";
import { logDbQueryError } from "@/components/db/sql/db-error-logger";

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

const createGuidedTourInputSchema = z.object({
  tourKey: z.string().trim().min(2, "Tour key is required."),
  tourName: z.string().trim().min(2, "Tour name is required."),
  featureName: z.string().trim().min(2, "Feature name is required."),
  status: z.enum(TOUR_STATUS_OPTIONS),
  audienceType: z.enum(TOUR_AUDIENCE_OPTIONS),
});

const updateGuidedTourInputSchema = createGuidedTourInputSchema.extend({
  id: z.number().int().positive(),
});

const createGuidedTourStepInputSchema = z.object({
  tourId: z.number().int().positive(),
  stepKey: z.string().trim().min(2, "Step key is required."),
  stepNo: z.number().int().min(1, "Step number must be at least 1."),
  routePattern: z.enum(STEP_ROUTE_PATTERN_OPTIONS),
  targetSelector: z.string().trim().min(1, "Target selector is required."),
  targetSelectorPath: z.string().trim().max(500, "Target selector path must be 500 characters or fewer.").optional().nullable(),
  snippetTitle: z.string().trim().min(2, "Snippet title is required."),
  snippetBody: z.string().trim().min(2, "Snippet body is required."),
  placement: z.enum(STEP_PLACEMENT_OPTIONS),
  targetPadding: z.number().int().min(0).max(128).default(8),
});

const updateGuidedTourStepInputSchema = createGuidedTourStepInputSchema.extend({
  id: z.number().int().positive(),
});

export type GuidedTourReferenceItem = {
  id: number;
  tourKey: string;
  tourName: string;
  featureName: string;
  status: (typeof TOUR_STATUS_OPTIONS)[number];
  audienceType: (typeof TOUR_AUDIENCE_OPTIONS)[number];
  updatedAt: Date | null;
};

export type GuidedTourStepReferenceItem = {
  id: number;
  tourId: number;
  stepKey: string;
  stepNo: number;
  routePattern: (typeof STEP_ROUTE_PATTERN_OPTIONS)[number];
  targetSelector: string;
  targetSelectorPath: string | null;
  snippetTitle: string;
  snippetBody: string;
  placement: (typeof STEP_PLACEMENT_OPTIONS)[number];
  targetPadding: number;
  updatedAt: Date | null;
};

export type GuidedTourReferenceWithSteps = GuidedTourReferenceItem & {
  steps: GuidedTourStepReferenceItem[];
};

export type GuidedTourMaintenanceDataResult =
  | {
      success: true;
      tours: GuidedTourReferenceWithSteps[];
    }
  | {
      success: false;
      message: string;
    };

export type GuidedMutationResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

export type CreateGuidedTourInput = z.infer<typeof createGuidedTourInputSchema>;
export type UpdateGuidedTourInput = z.infer<typeof updateGuidedTourInputSchema>;
export type CreateGuidedTourStepInput = z.infer<typeof createGuidedTourStepInputSchema>;
export type UpdateGuidedTourStepInput = z.infer<typeof updateGuidedTourStepInputSchema>;

function toGuidedErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const detail = error.message.toLowerCase();

    if (detail.includes("guided_tour_reference_tour_key_unique")) {
      return "Tour key must be unique.";
    }

    if (detail.includes("guided_tour_step_tour_step_no_uq")) {
      return "Step number must be unique for this tour.";
    }

    if (detail.includes("guided_tour_step_tour_step_key_uq")) {
      return "Step key must be unique for this tour.";
    }
  }

  return fallback;
}

async function loadTours(): Promise<GuidedTourReferenceItem[]> {
  const rows = await db
    .select({
      id: guidedTourReference.id,
      tourKey: guidedTourReference.tourKey,
      tourName: guidedTourReference.tourName,
      featureName: guidedTourReference.featureName,
      status: guidedTourReference.status,
      audienceType: guidedTourReference.audienceType,
      updatedAt: guidedTourReference.updatedAt,
    })
    .from(guidedTourReference)
    .orderBy(asc(guidedTourReference.featureName), asc(guidedTourReference.tourName), asc(guidedTourReference.id));

  return rows.map((row) => ({
    ...row,
    status: (row.status as GuidedTourReferenceItem["status"]) ?? "published",
    audienceType: (row.audienceType as GuidedTourReferenceItem["audienceType"]) ?? "member",
  }));
}

async function loadStepsForTourIds(tourIds: number[]): Promise<GuidedTourStepReferenceItem[]> {
  if (tourIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: guidedTourStepReference.id,
      tourId: guidedTourStepReference.tourId,
      stepKey: guidedTourStepReference.stepKey,
      stepNo: guidedTourStepReference.stepNo,
      routePattern: guidedTourStepReference.routePattern,
      targetSelector: guidedTourStepReference.targetSelector,
      targetSelectorPath: guidedTourStepReference.targetSelectorPath,
      snippetTitle: guidedTourStepReference.snippetTitle,
      snippetBody: guidedTourStepReference.snippetBody,
      placement: guidedTourStepReference.placement,
      targetPadding: guidedTourStepReference.highlightPadding,
      updatedAt: guidedTourStepReference.updatedAt,
    })
    .from(guidedTourStepReference)
    .where(inArray(guidedTourStepReference.tourId, tourIds))
    .orderBy(asc(guidedTourStepReference.tourId), asc(guidedTourStepReference.stepNo), asc(guidedTourStepReference.id));

  return rows.map((row) => ({
    ...row,
    routePattern: (row.routePattern as GuidedTourStepReferenceItem["routePattern"]) ?? "controlled",
    placement: (row.placement as GuidedTourStepReferenceItem["placement"]) ?? "bottom",
    targetPadding: row.targetPadding ?? 8,
  }));
}

export async function getGuidedTourMaintenanceData(): Promise<GuidedTourMaintenanceDataResult> {
  try {
    const tours = await loadTours();
    const steps = await loadStepsForTourIds(tours.map((tour) => tour.id));

    const stepsByTourId = new Map<number, GuidedTourStepReferenceItem[]>();

    for (const step of steps) {
      const current = stepsByTourId.get(step.tourId) ?? [];
      current.push(step);
      stepsByTourId.set(step.tourId, current);
    }

    return {
      success: true,
      tours: tours.map((tour) => ({
        ...tour,
        steps: stepsByTourId.get(tour.id) ?? [],
      })),
    };
  } catch (error) {
    logDbQueryError("guided.getGuidedTourMaintenanceData", error);
    console.error("getGuidedTourMaintenanceData failed", error);
    return {
      success: false,
      message: "Unable to load guided tour references.",
    };
  }
}

export async function createGuidedTourReference(input: CreateGuidedTourInput): Promise<GuidedMutationResult> {
  const parsed = createGuidedTourInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Unable to create guided tour.",
    };
  }

  try {
    await db.insert(guidedTourReference).values({
      tourKey: parsed.data.tourKey,
      tourName: parsed.data.tourName,
      featureName: parsed.data.featureName,
      status: parsed.data.status,
      audienceType: parsed.data.audienceType,
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: "Guided tour created.",
    };
  } catch (error) {
    console.error("createGuidedTourReference failed", error);
    return {
      success: false,
      message: toGuidedErrorMessage(error, "Unable to create guided tour."),
    };
  }
}

export async function updateGuidedTourReference(input: UpdateGuidedTourInput): Promise<GuidedMutationResult> {
  const parsed = updateGuidedTourInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Unable to update guided tour.",
    };
  }

  try {
    const [updated] = await db
      .update(guidedTourReference)
      .set({
        tourKey: parsed.data.tourKey,
        tourName: parsed.data.tourName,
        featureName: parsed.data.featureName,
        status: parsed.data.status,
        audienceType: parsed.data.audienceType,
        updatedAt: new Date(),
      })
      .where(eq(guidedTourReference.id, parsed.data.id))
      .returning({ id: guidedTourReference.id });

    if (!updated) {
      return {
        success: false,
        message: "Guided tour was not found.",
      };
    }

    return {
      success: true,
      message: "Guided tour updated.",
    };
  } catch (error) {
    console.error("updateGuidedTourReference failed", error);
    return {
      success: false,
      message: toGuidedErrorMessage(error, "Unable to update guided tour."),
    };
  }
}

export async function deleteGuidedTourReference(tourId: number): Promise<GuidedMutationResult> {
  if (!Number.isInteger(tourId) || tourId < 1) {
    return {
      success: false,
      message: "Invalid tour id.",
    };
  }

  try {
    const [deleted] = await db
      .delete(guidedTourReference)
      .where(eq(guidedTourReference.id, tourId))
      .returning({ id: guidedTourReference.id });

    if (!deleted) {
      return {
        success: false,
        message: "Guided tour was not found.",
      };
    }

    return {
      success: true,
      message: "Guided tour deleted.",
    };
  } catch (error) {
    console.error("deleteGuidedTourReference failed", error);
    return {
      success: false,
      message: "Unable to delete guided tour.",
    };
  }
}

export async function createGuidedTourStepReference(input: CreateGuidedTourStepInput): Promise<GuidedMutationResult> {
  const parsed = createGuidedTourStepInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Unable to create guided tour step.",
    };
  }

  try {
    const [matchedTour] = await db
      .select({ id: guidedTourReference.id })
      .from(guidedTourReference)
      .where(eq(guidedTourReference.id, parsed.data.tourId))
      .limit(1);

    if (!matchedTour) {
      return {
        success: false,
        message: "Guided tour was not found.",
      };
    }

    await db.insert(guidedTourStepReference).values({
      tourId: parsed.data.tourId,
      stepKey: parsed.data.stepKey,
      stepNo: parsed.data.stepNo,
      routePattern: parsed.data.routePattern,
      targetSelector: parsed.data.targetSelector,
      targetSelectorPath: parsed.data.targetSelectorPath?.trim() || null,
      snippetTitle: parsed.data.snippetTitle,
      snippetBody: parsed.data.snippetBody,
      placement: parsed.data.placement,
      highlightPadding: parsed.data.targetPadding,
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: "Guided tour step created.",
    };
  } catch (error) {
    console.error("createGuidedTourStepReference failed", error);
    return {
      success: false,
      message: toGuidedErrorMessage(error, "Unable to create guided tour step."),
    };
  }
}

export async function updateGuidedTourStepReference(input: UpdateGuidedTourStepInput): Promise<GuidedMutationResult> {
  const parsed = updateGuidedTourStepInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Unable to update guided tour step.",
    };
  }

  try {
    const [updated] = await db
      .update(guidedTourStepReference)
      .set({
        stepKey: parsed.data.stepKey,
        stepNo: parsed.data.stepNo,
        routePattern: parsed.data.routePattern,
        targetSelector: parsed.data.targetSelector,
        targetSelectorPath: parsed.data.targetSelectorPath?.trim() || null,
        snippetTitle: parsed.data.snippetTitle,
        snippetBody: parsed.data.snippetBody,
        placement: parsed.data.placement,
        highlightPadding: parsed.data.targetPadding,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(guidedTourStepReference.id, parsed.data.id),
          eq(guidedTourStepReference.tourId, parsed.data.tourId),
        ),
      )
      .returning({ id: guidedTourStepReference.id });

    if (!updated) {
      return {
        success: false,
        message: "Guided tour step was not found.",
      };
    }

    return {
      success: true,
      message: "Guided tour step updated.",
    };
  } catch (error) {
    console.error("updateGuidedTourStepReference failed", error);
    return {
      success: false,
      message: toGuidedErrorMessage(error, "Unable to update guided tour step."),
    };
  }
}

export async function deleteGuidedTourStepReference(stepId: number): Promise<GuidedMutationResult> {
  if (!Number.isInteger(stepId) || stepId < 1) {
    return {
      success: false,
      message: "Invalid step id.",
    };
  }

  try {
    const [deleted] = await db
      .delete(guidedTourStepReference)
      .where(eq(guidedTourStepReference.id, stepId))
      .returning({ id: guidedTourStepReference.id });

    if (!deleted) {
      return {
        success: false,
        message: "Guided tour step was not found.",
      };
    }

    return {
      success: true,
      message: "Guided tour step deleted.",
    };
  } catch (error) {
    console.error("deleteGuidedTourStepReference failed", error);
    return {
      success: false,
      message: "Unable to delete guided tour step.",
    };
  }
}
