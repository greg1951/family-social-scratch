import db from "@/components/db/drizzle";
import { familyActivity } from "@/components/db/schema/family-social-schema-tables";

export const FAMILY_ACTIVITY_ACTION_TYPES = {
  POST_CREATED: "POST_CREATED",
  COMMENT_CREATED: "COMMENT_CREATED",
  THREAD_CREATED: "THREAD_CREATED",
  GAME_STARTED: "GAME_STARTED",
} as const;

export type FamilyActivityActionType =
  (typeof FAMILY_ACTIVITY_ACTION_TYPES)[keyof typeof FAMILY_ACTIVITY_ACTION_TYPES];

type CreateFamilyActivityInput = {
  actionType: FamilyActivityActionType;
  featureName: string;
  postName: string;
  familyId: number;
  memberId: number;
};

export async function createFamilyActivityRecord(input: CreateFamilyActivityInput): Promise<void> {
  await db.insert(familyActivity).values({
    actionType: input.actionType,
    featureName: input.featureName,
    postName: input.postName,
    familyId: input.familyId,
    memberId: input.memberId,
  });
}
