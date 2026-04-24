import { count, eq, and, inArray, gte, lte } from "drizzle-orm";
import db from "@/components/db/drizzle";
import { familyActivity, member } from "@/components/db/schema/family-social-schema-tables";

const FEATURE_POST_NAMES = [
  "TV Junkies",
  "Movie Maniacs",
  "Family Foodies",
  "Poetry Cafe",
  "Book Besties",
] as const;

const POST_ACTION_TYPES = [
  "POST_CREATED",
  "COMMENT_CREATED",
  "LIKE_ADDED",
  "LOVE_ADDED",
] as const;

export type FeaturePostsRawRow = {
  featureName: string;
  actionType: string;
  count: number;
};

export type MemberPostsRawRow = {
  firstName: string;
  lastName: string;
  actionType: string;
  count: number;
};

export type ThreadGameRawRow = {
  firstName: string;
  lastName: string;
  actionType: string;
  count: number;
};

type DateRangeFilter = {
  startDate: Date;
  endDate: Date;
};

export async function getFeaturePostsActivity(
  familyId: number,
  dateRange: DateRangeFilter,
): Promise<FeaturePostsRawRow[]> {
  const rows = await db
    .select({
      featureName: familyActivity.featureName,
      actionType: familyActivity.actionType,
      count: count(),
    })
    .from(familyActivity)
    .where(
      and(
        eq(familyActivity.familyId, familyId),
        inArray(familyActivity.featureName, [...FEATURE_POST_NAMES]),
        inArray(familyActivity.actionType, [...POST_ACTION_TYPES]),
        gte(familyActivity.createdAt, dateRange.startDate),
        lte(familyActivity.createdAt, dateRange.endDate),
      ),
    )
    .groupBy(familyActivity.featureName, familyActivity.actionType);

  return rows.map((r) => ({ ...r, count: Number(r.count) }));
}

export async function getMemberPostsActivity(
  familyId: number,
  dateRange: DateRangeFilter,
): Promise<MemberPostsRawRow[]> {
  const rows = await db
    .select({
      firstName: member.firstName,
      lastName: member.lastName,
      actionType: familyActivity.actionType,
      count: count(),
    })
    .from(familyActivity)
    .innerJoin(member, eq(familyActivity.memberId, member.id))
    .where(
      and(
        eq(familyActivity.familyId, familyId),
        inArray(familyActivity.featureName, [...FEATURE_POST_NAMES]),
        inArray(familyActivity.actionType, [...POST_ACTION_TYPES]),
        gte(familyActivity.createdAt, dateRange.startDate),
        lte(familyActivity.createdAt, dateRange.endDate),
      ),
    )
    .groupBy(member.id, member.firstName, member.lastName, familyActivity.actionType);

  return rows.map((r) => ({ ...r, count: Number(r.count) }));
}

export async function getThreadAndGameActivity(familyId: number): Promise<ThreadGameRawRow[]> {
  const rows = await db
    .select({
      firstName: member.firstName,
      lastName: member.lastName,
      actionType: familyActivity.actionType,
      count: count(),
    })
    .from(familyActivity)
    .innerJoin(member, eq(familyActivity.memberId, member.id))
    .where(
      and(
        eq(familyActivity.familyId, familyId),
        inArray(familyActivity.actionType, ["THREAD_CREATED", "GAME_STARTED"]),
      ),
    )
    .groupBy(member.id, member.firstName, member.lastName, familyActivity.actionType);

  return rows.map((r) => ({ ...r, count: Number(r.count) }));
}

export async function getThreadAndGameActivityFamilySummary(
  familyId: number,
  dateRange: DateRangeFilter,
): Promise<{ actionType: string; count: number }[]> {
  const rows = await db
    .select({
      actionType: familyActivity.actionType,
      count: count(),
    })
    .from(familyActivity)
    .where(
      and(
        eq(familyActivity.familyId, familyId),
        inArray(familyActivity.actionType, ["THREAD_CREATED", "GAME_STARTED"]),
        gte(familyActivity.createdAt, dateRange.startDate),
        lte(familyActivity.createdAt, dateRange.endDate),
      ),
    )
    .groupBy(familyActivity.actionType);

  return rows.map((r) => ({ ...r, count: Number(r.count) }));
}

export const FAMILY_ACTIVITY_ACTION_TYPES = {
  POST_CREATED: "POST_CREATED",
  COMMENT_CREATED: "COMMENT_CREATED",
  THREAD_CREATED: "THREAD_CREATED",
  GAME_STARTED: "GAME_STARTED",
  LIKE_ADDED: "LIKE_ADDED",
  LOVE_ADDED: "LOVE_ADDED",
} as const;

export type FamilyActivityActionType =
  (typeof FAMILY_ACTIVITY_ACTION_TYPES)[keyof typeof FAMILY_ACTIVITY_ACTION_TYPES];

export type FamilyActivityReactionType = "like" | "love";

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

export async function createFamilyReactionActivityRecord(input: {
  reactionType: FamilyActivityReactionType;
  featureName: string;
  postName: string;
  familyId: number;
  memberId: number;
}): Promise<void> {
  await createFamilyActivityRecord({
    actionType: input.reactionType === "love"
      ? FAMILY_ACTIVITY_ACTION_TYPES.LOVE_ADDED
      : FAMILY_ACTIVITY_ACTION_TYPES.LIKE_ADDED,
    featureName: input.featureName,
    postName: input.postName,
    familyId: input.familyId,
    memberId: input.memberId,
  });
}
