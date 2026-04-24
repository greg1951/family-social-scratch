import db from "@/components/db/drizzle";
import { and, asc, desc, eq, ilike, inArray, isNull, ne, or } from "drizzle-orm";

import {
  member,
  show,
  showComment,
  showLike,
  showTag,
  showTagReference,
  showTemplate,
} from "../schema/family-social-schema-tables";
import {
  AddShowCommentReturn,
  GetShowDetailReturn,
  SaveShowTemplateInput,
  SaveShowTemplateReturn,
  SaveShowInput,
  SaveShowReturn,
  ShowComment,
  ShowTagOption,
  ShowTagType,
  ShowTemplateRecord,
  ShowTemplateOption,
  ToggleShowLikeReturn,
  TvHomePageDataReturn,
  TvTemplateManagementDataReturn,
  TvShowDetail,
  TvShow,
} from "../types/shows";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "../types/poem-term-validation";
import {
  createFamilyActivityRecord,
  createFamilyReactionActivityRecord,
  FAMILY_ACTIVITY_ACTION_TYPES,
} from "./queries-family-activity";

const SUPPORTED_SHOW_TAG_TYPES: ShowTagType[] = ["genre", "adjective", "channel"];

function createSubmitterName(firstName?: string | null, lastName?: string | null) {
  const names = [firstName, lastName].filter(Boolean);

  if (names.length > 0) {
    return names.join(" ");
  }

  return "Unknown Member";
}

function createDefaultShowTemplateJson() {
  return serializeTipTapDocument({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Show Overview" }] },
      { type: "paragraph" },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Why We Recommend It" }] },
      { type: "paragraph" },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Best Episodes" }] },
      { type: "paragraph" },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Watch Notes" }] },
      { type: "paragraph" },
    ],
  });
}

function toTemplateOption(row: {
  id: number;
  templateName: string;
  isGlobalTemplate: boolean;
  status: string;
  templateJson: string;
  memberId: number | null;
  familyId: number | null;
}): ShowTemplateOption {
  return {
    id: row.id,
    templateName: row.templateName,
    isGlobalTemplate: row.isGlobalTemplate,
    status: row.status,
    templateJson: row.templateJson,
    memberId: row.memberId,
    familyId: row.familyId,
    label: row.isGlobalTemplate ? `${row.templateName} (Global)` : row.templateName,
  };
}

async function ensureGlobalShowTemplate(
  familyId: number,
  memberId: number
): Promise<ShowTemplateOption> {
  const [familyGlobalTemplate] = await db
    .select({
      id: showTemplate.id,
      templateName: showTemplate.templateName,
      isGlobalTemplate: showTemplate.isGlobalTemplate,
      status: showTemplate.status,
      templateJson: showTemplate.templateJson,
      memberId: showTemplate.memberId,
      familyId: showTemplate.familyId,
    })
    .from(showTemplate)
    .where(and(eq(showTemplate.isGlobalTemplate, true), eq(showTemplate.familyId, familyId)))
    .orderBy(asc(showTemplate.id));

  if (familyGlobalTemplate) {
    return toTemplateOption(familyGlobalTemplate);
  }

  const [sharedGlobalTemplate] = await db
    .select({
      id: showTemplate.id,
      templateName: showTemplate.templateName,
      isGlobalTemplate: showTemplate.isGlobalTemplate,
      status: showTemplate.status,
      templateJson: showTemplate.templateJson,
      memberId: showTemplate.memberId,
      familyId: showTemplate.familyId,
    })
    .from(showTemplate)
    .where(and(eq(showTemplate.isGlobalTemplate, true), isNull(showTemplate.familyId)))
    .orderBy(asc(showTemplate.id));

  if (sharedGlobalTemplate) {
    return toTemplateOption(sharedGlobalTemplate);
  }

  const [createdTemplate] = await db
    .insert(showTemplate)
    .values({
      templateName: `__global-tv-${familyId}`,
      isGlobalTemplate: true,
      status: "published",
      templateJson: createDefaultShowTemplateJson(),
      memberId,
      familyId,
    })
    .returning({
      id: showTemplate.id,
      templateName: showTemplate.templateName,
      isGlobalTemplate: showTemplate.isGlobalTemplate,
      status: showTemplate.status,
      templateJson: showTemplate.templateJson,
      memberId: showTemplate.memberId,
      familyId: showTemplate.familyId,
    });

  return toTemplateOption(createdTemplate);
}

async function loadShowTagOptions(): Promise<ShowTagOption[]> {
  const rows = await db
    .select({
      id: showTagReference.id,
      tagName: showTagReference.tagName,
      tagDesc: showTagReference.tagDesc,
      tagType: showTagReference.tagType,
      status: showTagReference.status,
      seqNo: showTagReference.seqNo,
    })
    .from(showTagReference)
    .where(inArray(showTagReference.tagType, SUPPORTED_SHOW_TAG_TYPES))
    .orderBy(asc(showTagReference.tagType), asc(showTagReference.seqNo), asc(showTagReference.tagName));

  return rows.map((row) => ({
    id: row.id,
    tagName: row.tagName,
    tagDesc: row.tagDesc,
    tagType: row.tagType as ShowTagType,
    status: row.status,
    seqNo: row.seqNo,
  }));
}

async function loadShowTemplates(
  familyId: number,
  memberId: number,
  options: {
    includeDraft: boolean;
    includeGlobal: boolean;
    ensureGlobalTemplate?: boolean;
  }
): Promise<ShowTemplateOption[]> {
  const { includeDraft, includeGlobal, ensureGlobalTemplate = false } = options;

  const fallbackTemplate = ensureGlobalTemplate
    ? await ensureGlobalShowTemplate(familyId, memberId)
    : null;

  const whereCondition = includeGlobal
    ? and(
      or(
        eq(showTemplate.familyId, familyId),
        and(eq(showTemplate.isGlobalTemplate, true), isNull(showTemplate.familyId))
      ),
      includeDraft ? undefined : eq(showTemplate.status, "published")
    )
    : and(
      eq(showTemplate.familyId, familyId),
      includeDraft ? undefined : eq(showTemplate.status, "published"),
      eq(showTemplate.isGlobalTemplate, false)
    );

  const rows = await db
    .select({
      id: showTemplate.id,
      templateName: showTemplate.templateName,
      isGlobalTemplate: showTemplate.isGlobalTemplate,
      status: showTemplate.status,
      templateJson: showTemplate.templateJson,
      memberId: showTemplate.memberId,
      familyId: showTemplate.familyId,
    })
    .from(showTemplate)
    .where(whereCondition)
    .orderBy(desc(showTemplate.isGlobalTemplate), asc(showTemplate.templateName));

  const mapById = new Map<number, ShowTemplateOption>();

  if (fallbackTemplate) {
    mapById.set(fallbackTemplate.id, fallbackTemplate);
  }

  for (const row of rows) {
    mapById.set(row.id, toTemplateOption(row));
  }

  return Array.from(mapById.values()).sort((leftTemplate, rightTemplate) => {
    if (leftTemplate.isGlobalTemplate !== rightTemplate.isGlobalTemplate) {
      return leftTemplate.isGlobalTemplate ? -1 : 1;
    }

    return leftTemplate.label.localeCompare(rightTemplate.label);
  });
}

async function loadShowTemplateManagementRecords(
  familyId: number,
  actorMemberId: number,
  actorIsAdmin: boolean
): Promise<ShowTemplateRecord[]> {
  if (actorIsAdmin) {
    await ensureGlobalShowTemplate(familyId, actorMemberId);
  }

  const whereCondition = actorIsAdmin
    ? eq(showTemplate.familyId, familyId)
    : and(eq(showTemplate.familyId, familyId), eq(showTemplate.isGlobalTemplate, false));

  const templateRows = await db
    .select({
      id: showTemplate.id,
      templateName: showTemplate.templateName,
      status: showTemplate.status,
      isGlobalTemplate: showTemplate.isGlobalTemplate,
      templateJson: showTemplate.templateJson,
      memberId: showTemplate.memberId,
      familyId: showTemplate.familyId,
      updatedAt: showTemplate.updatedAt,
    })
    .from(showTemplate)
    .where(whereCondition)
    .orderBy(desc(showTemplate.updatedAt), asc(showTemplate.templateName));

  const memberIds = [...new Set(templateRows.map((row) => row.memberId).filter((memberId) => Number.isInteger(memberId)))] as number[];
  const memberRows = memberIds.length > 0
    ? await db
      .select({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      })
      .from(member)
      .where(inArray(member.id, memberIds))
    : [];

  const memberNameById = new Map(
    memberRows.map((row) => [row.id, createSubmitterName(row.firstName, row.lastName)])
  );

  return templateRows.map((row) => {
    const canEdit = row.isGlobalTemplate
      ? actorIsAdmin
      : row.memberId === actorMemberId;

    return {
      id: row.id,
      templateName: row.templateName,
      status: row.status,
      isGlobalTemplate: row.isGlobalTemplate,
      templateJson: row.templateJson,
      memberId: row.memberId,
      familyId: row.familyId,
      updatedAt: row.updatedAt ?? new Date(),
      ownerName: row.isGlobalTemplate
        ? "Global Template"
        : memberNameById.get(row.memberId ?? 0) ?? `Member #${row.memberId ?? 0}`,
      canEdit,
    };
  });
}

async function loadShows(familyId: number, viewerMemberId?: number): Promise<TvShow[]> {
  const showRows = await db
    .select()
    .from(show)
    .where(and(eq(show.familyId, familyId), ne(show.status, "template")))
    .orderBy(desc(show.updatedAt), asc(show.showTitle));

  if (!showRows || showRows.length === 0) {
    return [];
  }

  const showIds = showRows.map((row) => row.id);

  const [commentRows, likeRows, tagRows] = await Promise.all([
    db
      .select({
        showId: showComment.showId,
        isShowReviewer: showComment.isShowReviewer,
      })
      .from(showComment)
      .where(inArray(showComment.showId, showIds)),
    db
      .select({
        showId: showLike.showId,
        memberId: showLike.memberId,
        likenessDegree: showLike.likenessDegree,
      })
      .from(showLike)
      .where(inArray(showLike.showId, showIds)),
    db
      .select({
        showId: showTag.showId,
        tagId: showTag.tagId,
        tagName: showTagReference.tagName,
        tagType: showTagReference.tagType,
      })
      .from(showTag)
      .innerJoin(showTagReference, eq(showTagReference.id, showTag.tagId))
      .where(inArray(showTag.showId, showIds)),
  ]);

  const memberIds = [...new Set(showRows.map((row) => row.memberId))];
  const memberRows = memberIds.length > 0
    ? await db
      .select({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      })
      .from(member)
      .where(inArray(member.id, memberIds))
    : [];

  const memberNameById = new Map(
    memberRows.map((row) => [row.id, createSubmitterName(row.firstName, row.lastName)])
  );

  const commentCountByShowId = new Map<number, number>();
  const noRatingByShowId = new Map<number, number>();
  const thumbsUpByShowId = new Map<number, number>();
  const loveByShowId = new Map<number, number>();
  const submitterLikeByShowId = new Map<number, number>();
  const viewerLikeByShowId = new Map<number, number>();
  const tagIdsByShowId = new Map<number, number[]>();
  const tagNamesByTypeByShowId = new Map<number, Partial<Record<ShowTagType, string[]>>>();

  for (const commentRow of commentRows) {
    if (commentRow.isShowReviewer) {
      continue;
    }

    commentCountByShowId.set(commentRow.showId, (commentCountByShowId.get(commentRow.showId) ?? 0) + 1);
  }

  for (const likeRow of likeRows) {
    const showRow = showRows.find((candidate) => candidate.id === likeRow.showId);
    const isSubmitterRating = Boolean(showRow && likeRow.memberId === showRow.memberId);

    if (isSubmitterRating) {
      submitterLikeByShowId.set(likeRow.showId, likeRow.likenessDegree);
    }

    if (viewerMemberId && likeRow.memberId === viewerMemberId) {
      viewerLikeByShowId.set(likeRow.showId, likeRow.likenessDegree);
    }

    if (isSubmitterRating) {
      continue;
    }

    if (likeRow.likenessDegree === 1) {
      thumbsUpByShowId.set(likeRow.showId, (thumbsUpByShowId.get(likeRow.showId) ?? 0) + 1);
      continue;
    }

    if (likeRow.likenessDegree === 2) {
      loveByShowId.set(likeRow.showId, (loveByShowId.get(likeRow.showId) ?? 0) + 1);
      continue;
    }

    if (likeRow.likenessDegree === -1) {
      noRatingByShowId.set(likeRow.showId, (noRatingByShowId.get(likeRow.showId) ?? 0) + 1);
    }
  }

  for (const tagRow of tagRows) {
    if (!SUPPORTED_SHOW_TAG_TYPES.includes(tagRow.tagType as ShowTagType)) {
      continue;
    }

    const nextTagIds = tagIdsByShowId.get(tagRow.showId) ?? [];
    nextTagIds.push(tagRow.tagId);
    tagIdsByShowId.set(tagRow.showId, nextTagIds);

    const tagType = tagRow.tagType as ShowTagType;
    const byType = tagNamesByTypeByShowId.get(tagRow.showId) ?? {};
    const nextNames = byType[tagType] ?? [];
    byType[tagType] = [...nextNames, tagRow.tagName];
    tagNamesByTypeByShowId.set(tagRow.showId, byType);
  }

  return showRows.map((row) => ({
    id: row.id,
    showTitle: row.showTitle,
    showCaption: row.showCaption,
    showJson: row.showJson,
    status: row.status,
    showImageUrl: row.showImageUrl,
    showFirstYear: row.showFirstYear,
    showLastYear: row.showLastYear,
    seasonCount: row.seasonCount,
    updatedAt: row.updatedAt ?? new Date(),
    memberId: row.memberId,
    familyId: row.familyId,
    submitterName: memberNameById.get(row.memberId) ?? `Member #${row.memberId}`,
    submitterLikenessDegree: submitterLikeByShowId.get(row.id) ?? null,
    commentCount: commentCountByShowId.get(row.id) ?? 0,
    noRatingCount: noRatingByShowId.get(row.id) ?? 0,
    thumbsUpCount: thumbsUpByShowId.get(row.id) ?? 0,
    loveCount: loveByShowId.get(row.id) ?? 0,
    likedByMember: (viewerLikeByShowId.get(row.id) ?? -1) !== -1,
    likenessDegree: viewerLikeByShowId.get(row.id) ?? null,
    selectedTagIds: tagIdsByShowId.get(row.id) ?? [],
    tagNamesByType: tagNamesByTypeByShowId.get(row.id) ?? {},
  }));
}

async function loadShowDetail(
  familyId: number,
  showId: number,
  viewerMemberId?: number
): Promise<TvShowDetail | null> {
  const showRows = await db
    .select()
    .from(show)
    .where(and(eq(show.familyId, familyId), eq(show.id, showId), ne(show.status, "template")));

  if (!showRows || showRows.length === 0) {
    return null;
  }

  const showRow = showRows[0];

  const [commentRows, likeRows, tagRows] = await Promise.all([
    db
      .select()
      .from(showComment)
      .where(eq(showComment.showId, showId))
      .orderBy(asc(showComment.createdAt)),
    db
      .select({
        memberId: showLike.memberId,
        likenessDegree: showLike.likenessDegree,
      })
      .from(showLike)
      .where(eq(showLike.showId, showId)),
    db
      .select({
        tagId: showTag.tagId,
        tagName: showTagReference.tagName,
        tagType: showTagReference.tagType,
      })
      .from(showTag)
      .innerJoin(showTagReference, eq(showTagReference.id, showTag.tagId))
      .where(eq(showTag.showId, showId)),
  ]);

  const commentMemberIds = [...new Set(commentRows.map((row) => row.memberId).filter((memberId) => Number.isInteger(memberId)))];
  const memberIds = [...new Set([showRow.memberId, ...commentMemberIds])];

  const memberRows = memberIds.length > 0
    ? await db
      .select({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      })
      .from(member)
      .where(inArray(member.id, memberIds))
    : [];

  const memberNameById = new Map(
    memberRows.map((row) => [row.id, createSubmitterName(row.firstName, row.lastName)])
  );

  const submitterLike = likeRows.find((row) => row.memberId === showRow.memberId) ?? null;
  const audienceLikeRows = likeRows.filter((row) => row.memberId !== showRow.memberId);
  const noRatingCount = audienceLikeRows.filter((row) => row.likenessDegree === -1).length;
  const thumbsUpCount = audienceLikeRows.filter((row) => row.likenessDegree === 1).length;
  const loveCount = audienceLikeRows.filter((row) => row.likenessDegree === 2).length;
  const regularCommentRows = commentRows.filter((row) => !row.isShowReviewer);

  const viewerLike = viewerMemberId
    ? likeRows.find((row) => row.memberId === viewerMemberId)
    : null;

  const tagIdsByShowId = new Map<number, number[]>();
  const tagNamesByTypeByShowId = new Map<number, Partial<Record<ShowTagType, string[]>>>();

  for (const tagRow of tagRows) {
    if (!SUPPORTED_SHOW_TAG_TYPES.includes(tagRow.tagType as ShowTagType)) {
      continue;
    }

    const existingTagIds = tagIdsByShowId.get(showId) ?? [];
    existingTagIds.push(tagRow.tagId);
    tagIdsByShowId.set(showId, existingTagIds);

    const tagType = tagRow.tagType as ShowTagType;
    const byType = tagNamesByTypeByShowId.get(showId) ?? {};
    const currentNames = byType[tagType] ?? [];
    byType[tagType] = [...currentNames, tagRow.tagName];
    tagNamesByTypeByShowId.set(showId, byType);
  }

  const showComments: ShowComment[] = regularCommentRows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt ?? new Date(),
    commenterName: memberNameById.get(row.memberId ?? 0) ?? `Member #${row.memberId ?? 0}`,
    text: row.commentJson,
  }));

  return {
    id: showRow.id,
    showTitle: showRow.showTitle,
    showCaption: showRow.showCaption,
    showJson: showRow.showJson,
    status: showRow.status,
    showImageUrl: showRow.showImageUrl,
    showFirstYear: showRow.showFirstYear,
    showLastYear: showRow.showLastYear,
    seasonCount: showRow.seasonCount,
    updatedAt: showRow.updatedAt ?? new Date(),
    memberId: showRow.memberId,
    familyId: showRow.familyId,
    submitterName: memberNameById.get(showRow.memberId) ?? `Member #${showRow.memberId}`,
    submitterLikenessDegree: submitterLike?.likenessDegree ?? null,
    commentCount: regularCommentRows.length,
    noRatingCount,
    thumbsUpCount,
    loveCount,
    likedByMember: Boolean(viewerLike && viewerLike.likenessDegree !== -1),
    likenessDegree: viewerLike?.likenessDegree ?? null,
    selectedTagIds: tagIdsByShowId.get(showId) ?? [],
    tagNamesByType: tagNamesByTypeByShowId.get(showId) ?? {},
    showComments,
  };
}

export async function getTvShowById(
  familyId: number,
  showId: number,
  viewerMemberId?: number
): Promise<{ success: false; message: string } | { success: true; show: TvShow }> {
  const shows = await loadShows(familyId, viewerMemberId);
  const selectedShow = shows.find((showRecord) => showRecord.id === showId);

  if (!selectedShow) {
    return {
      success: false,
      message: `No show was found for id: ${showId}`,
    };
  }

  return {
    success: true,
    show: selectedShow,
  };
}

export async function getTvHomePageData(
  familyId: number,
  memberId: number,
  isAdmin = false
): Promise<TvHomePageDataReturn> {
  try {
    const [shows, showTags, showTemplates] = await Promise.all([
      loadShows(familyId, memberId),
      loadShowTagOptions(),
      loadShowTemplates(familyId, memberId, {
        includeDraft: false,
        includeGlobal: true,
        ensureGlobalTemplate: isAdmin,
      }),
    ]);

    return {
      success: true,
      shows,
      showTags,
      showTemplates,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error loading TV home page data",
    };
  }
}

export async function getTvTemplateManagementData(
  familyId: number,
  memberId: number,
  isAdmin: boolean
): Promise<TvTemplateManagementDataReturn> {
  try {
    const templates = await loadShowTemplateManagementRecords(familyId, memberId, isAdmin);

    return {
      success: true,
      templates,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error loading TV templates",
    };
  }
}

export async function saveShow(
  input: SaveShowInput,
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<SaveShowReturn> {
  const normalizedTitle = input.showTitle.trim();

  if (!normalizedTitle) {
    return {
      success: false,
      message: "Show title is required.",
    };
  }

  const sanitizedTagIds = [...new Set(input.selectedTagIds)].filter((tagId) => Number.isInteger(tagId) && tagId > 0);
  const existingShow = input.id
    ? await db
      .select()
      .from(show)
      .where(and(eq(show.id, input.id), eq(show.familyId, actor.familyId), ne(show.status, "template")))
      .then((rows) => rows[0] ?? null)
    : null;

  if (input.id && !existingShow) {
    return {
      success: false,
      message: `No show was found for id: ${input.id}`,
    };
  }

  if (existingShow && existingShow.memberId !== actor.memberId) {
    return {
      success: false,
      message: "Only the member who created this show can edit it.",
    };
  }

  const templates = await loadShowTemplates(actor.familyId, actor.memberId, {
    includeDraft: true,
    includeGlobal: true,
    ensureGlobalTemplate: true,
  });

  const selectedTemplate = templates.find((template) => template.id === input.templateId);

  if (!selectedTemplate) {
    return {
      success: false,
      message: "A show template must be selected.",
    };
  }

  const submitterLikenessDegree = Number(input.submitterLikenessDegree);
  const hasSubmitterLikenessDegree = [1, 2].includes(submitterLikenessDegree);
  if (!existingShow && !hasSubmitterLikenessDegree) {
    return {
      success: false,
      message: "Select Like or Love for your own show post.",
    };
  }

  const showJsonToStore = input.showJson?.trim() || selectedTemplate.templateJson || serializeTipTapDocument(createEmptyTipTapDocument());

  try {
    const [persistedShow] = input.id
      ? await db
        .update(show)
        .set({
          showTitle: normalizedTitle,
          showCaption: input.showCaption,
          showJson: showJsonToStore,
          status: input.status,
          showImageUrl: input.showImageUrl ?? null,
          showFirstYear: input.showFirstYear,
          showLastYear: input.showLastYear,
          seasonCount: input.seasonCount,
          updatedAt: new Date(),
        })
        .where(and(eq(show.id, input.id), eq(show.familyId, actor.familyId)))
        .returning()
      : await db
        .insert(show)
        .values({
          showTitle: normalizedTitle,
          showCaption: input.showCaption,
          showJson: showJsonToStore,
          status: input.status,
          showImageUrl: input.showImageUrl ?? null,
          showFirstYear: input.showFirstYear,
          showLastYear: input.showLastYear,
          seasonCount: input.seasonCount,
          memberId: actor.memberId,
          familyId: actor.familyId,
        })
        .returning();

    if (!persistedShow) {
      return {
        success: false,
        message: "Could not save show.",
      };
    }

    await db.delete(showTag).where(eq(showTag.showId, persistedShow.id));

    if (sanitizedTagIds.length > 0) {
      await db.insert(showTag).values(
        sanitizedTagIds.map((tagId) => ({
          showId: persistedShow.id,
          tagId,
        }))
      );
    }

    if (!existingShow) {
      await db.insert(showComment).values({
        showId: persistedShow.id,
        memberId: actor.memberId,
        commentJson: "",
        isShowReviewer: true,
      });
    }

    if (hasSubmitterLikenessDegree) {
      await db.delete(showLike).where(and(eq(showLike.showId, persistedShow.id), eq(showLike.memberId, actor.memberId)));

      await db.insert(showLike).values({
        showId: persistedShow.id,
        memberId: actor.memberId,
        likenessDegree: submitterLikenessDegree,
        updatedAt: new Date(),
      });
    }

    if (!existingShow) {
      await createFamilyActivityRecord({
        actionType: FAMILY_ACTIVITY_ACTION_TYPES.POST_CREATED,
        featureName: "TV Junkies",
        postName: normalizedTitle,
        familyId: actor.familyId,
        memberId: actor.memberId,
      });
    }

    const shows = await loadShows(actor.familyId, actor.memberId);
    const savedShow = shows.find((showRecord) => showRecord.id === persistedShow.id);

    if (!savedShow) {
      return {
        success: false,
        message: "Show was saved but could not be reloaded.",
      };
    }

    return {
      success: true,
      show: savedShow,
      message: input.id ? "Show updated." : "Show added.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error saving show",
    };
  }
}

export async function saveShowTemplate(
  input: SaveShowTemplateInput,
  actor: {
    familyId: number;
    memberId: number;
    isAdmin: boolean;
  }
): Promise<SaveShowTemplateReturn> {
  const normalizedName = input.templateName.trim();
  const normalizedStatus = input.status.trim().toLowerCase();
  const normalizedJson = input.templateJson.trim();

  if (!normalizedName) {
    return {
      success: false,
      message: "Enter a template name before saving.",
    };
  }

  if (normalizedStatus !== "draft" && normalizedStatus !== "published") {
    return {
      success: false,
      message: "Template status must be draft or published.",
    };
  }

  const parsedTemplateJson = parseSerializedTipTapDocument(normalizedJson);

  if (!parsedTemplateJson.success) {
    return {
      success: false,
      message: parsedTemplateJson.message,
    };
  }

  const existingTemplate = input.id
    ? await db
      .select()
      .from(showTemplate)
      .where(and(eq(showTemplate.id, input.id), eq(showTemplate.familyId, actor.familyId)))
      .then((rows) => rows[0] ?? null)
    : null;

  if (input.id && !existingTemplate) {
    return {
      success: false,
      message: `No template was found for id: ${input.id}`,
    };
  }

  if (existingTemplate) {
    if (existingTemplate.isGlobalTemplate && !actor.isAdmin) {
      return {
        success: false,
        message: "Only an admin can edit the global template.",
      };
    }

    if (!existingTemplate.isGlobalTemplate && existingTemplate.memberId !== actor.memberId) {
      return {
        success: false,
        message: "You can only edit templates you created.",
      };
    }
  }

  const duplicateRows = await db
    .select({ id: showTemplate.id })
    .from(showTemplate)
    .where(
      input.id
        ? and(
          eq(showTemplate.familyId, actor.familyId),
          ilike(showTemplate.templateName, normalizedName),
          ne(showTemplate.id, input.id)
        )
        : and(eq(showTemplate.familyId, actor.familyId), ilike(showTemplate.templateName, normalizedName))
    );

  if (duplicateRows.length > 0) {
    return {
      success: false,
      message: "A template with this name already exists in your family.",
    };
  }

  try {
    const [savedTemplate] = existingTemplate
      ? await db
        .update(showTemplate)
        .set({
          templateName: normalizedName,
          status: normalizedStatus,
          templateJson: serializeTipTapDocument(parsedTemplateJson.content),
          updatedAt: new Date(),
        })
        .where(eq(showTemplate.id, existingTemplate.id))
        .returning()
      : await db
        .insert(showTemplate)
        .values({
          templateName: normalizedName,
          status: normalizedStatus,
          isGlobalTemplate: false,
          templateJson: serializeTipTapDocument(parsedTemplateJson.content),
          memberId: actor.memberId,
          familyId: actor.familyId,
        })
        .returning();

    const templates = await loadShowTemplateManagementRecords(actor.familyId, actor.memberId, actor.isAdmin);
    const savedTemplateRecord = templates.find((template) => template.id === savedTemplate.id);

    if (!savedTemplateRecord) {
      return {
        success: false,
        message: "Template was saved but could not be reloaded.",
      };
    }

    return {
      success: true,
      template: savedTemplateRecord,
      message: `Template "${savedTemplateRecord.templateName}" saved successfully.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error
        ? `Failed to save template changes: ${error.message}`
        : "Failed to save template changes.",
    };
  }
}

export async function getShowDetail(
  familyId: number,
  showId: number,
  viewerMemberId?: number
): Promise<GetShowDetailReturn> {
  try {
    const showDetail = await loadShowDetail(familyId, showId, viewerMemberId);

    if (!showDetail) {
      return {
        success: false,
        message: "Show not found.",
      };
    }

    return {
      success: true,
      show: showDetail,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to load show detail.",
    };
  }
}

export async function toggleShowLike(
  showId: number,
  likenessDegree: number,
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<ToggleShowLikeReturn> {
  const existingShow = await db
    .select()
    .from(show)
    .where(and(eq(show.familyId, actor.familyId), eq(show.id, showId), ne(show.status, "template")))
    .then((rows) => rows[0] ?? null);

  if (!existingShow) {
    return {
      success: false,
      message: "Show not found.",
    };
  }

  if (existingShow.memberId === actor.memberId) {
    return {
      success: false,
      message: "You cannot react to your own show.",
    };
  }

  if (![1, 2].includes(likenessDegree)) {
    return {
      success: false,
      message: "Invalid like type.",
    };
  }

  try {
    const existingLike = await db
      .select()
      .from(showLike)
      .where(
        and(
          eq(showLike.showId, showId),
          eq(showLike.memberId, actor.memberId)
        )
      )
      .then((rows) => rows[0] ?? null);

    if (existingLike && existingLike.likenessDegree === likenessDegree) {
      await db
        .delete(showLike)
        .where(
          and(
            eq(showLike.showId, showId),
            eq(showLike.memberId, actor.memberId),
            eq(showLike.likenessDegree, likenessDegree)
          )
        );
    } else if (existingLike) {
      await db
        .update(showLike)
        .set({
          likenessDegree,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(showLike.showId, showId),
            eq(showLike.memberId, actor.memberId)
          )
        );
    } else {
      await db
        .insert(showLike)
        .values({
          showId,
          memberId: actor.memberId,
          likenessDegree,
        });
    }

    if (!existingLike || existingLike.likenessDegree !== likenessDegree) {
      await createFamilyReactionActivityRecord({
        reactionType: likenessDegree === 2 ? "love" : "like",
        featureName: "TV Junkies",
        postName: existingShow.showTitle,
        familyId: actor.familyId,
        memberId: actor.memberId,
      });
    }

    const updatedShow = await loadShowDetail(actor.familyId, showId, actor.memberId);

    if (!updatedShow) {
      return {
        success: false,
        message: "Show was updated but could not be reloaded.",
      };
    }

    const actionText = existingLike && existingLike.likenessDegree === likenessDegree
      ? "reaction removed"
      : "reaction added";

    return {
      success: true,
      show: updatedShow,
      message: `Show ${actionText} successfully.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update show reaction.",
    };
  }
}

export async function addShowComment(
  showId: number,
  commentText: string,
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<AddShowCommentReturn> {
  const normalizedComment = commentText.trim();

  if (normalizedComment.length < 2) {
    return {
      success: false,
      message: "Comment must be at least 2 characters.",
    };
  }

  const existingShow = await db
    .select()
    .from(show)
    .where(and(eq(show.familyId, actor.familyId), eq(show.id, showId), ne(show.status, "template")))
    .then((rows) => rows[0] ?? null);

  if (!existingShow) {
    return {
      success: false,
      message: "Show not found.",
    };
  }

  try {
    await db
      .insert(showComment)
      .values({
        showId,
        memberId: actor.memberId,
        commentJson: normalizedComment,
        isShowReviewer: false,
      });

    await createFamilyActivityRecord({
      actionType: FAMILY_ACTIVITY_ACTION_TYPES.COMMENT_CREATED,
      featureName: "TV Junkies",
      postName: existingShow.showTitle,
      familyId: actor.familyId,
      memberId: actor.memberId,
    });

    const updatedShow = await loadShowDetail(actor.familyId, showId, actor.memberId);

    if (!updatedShow) {
      return {
        success: false,
        message: "Comment was added but show could not be reloaded.",
      };
    }

    return {
      success: true,
      show: updatedShow,
      message: "Comment posted successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add comment.",
    };
  }
}
