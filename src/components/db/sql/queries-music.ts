import db from "@/components/db/drizzle";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";

import {
  member,
  discussThread,
  music,
  musicComment,
  musicLike,
  musicLyrics,
  musicTag,
  pwaMutationRequest,
  musicTemplate,
} from "../schema/family-social-schema-tables";
import { musicTagReference } from "../schema/global-schema-tables";
import {
  AddMusicCommentReturn,
  GetMusicDetailReturn,
  MusicComment,
  MusicDetail,
  MusicHomePageDataReturn,
  MusicLyricsRecord,
  MusicRecord,
  MusicTagOption,
  MusicTagType,
  MusicTemplateManagementDataReturn,
  MusicTemplateOption,
  MusicTemplateRecord,
  SaveMusicInput,
  SaveMusicLyricsInput,
  SaveMusicLyricsReturn,
  SaveMusicReturn,
  SaveMusicTemplateInput,
  SaveMusicTemplateReturn,
  ToggleMusicLikeReturn,
} from "../types/music";
import {
  createEmptyTipTapDocument,
  createTextTipTapDocument,
  isTipTapDocumentEmpty,
  normalizeSerializedTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "../types/poem-term-validation";
import {
  createFamilyActivityRecord,
  createFamilyReactionActivityRecord,
  FAMILY_ACTIVITY_ACTION_TYPES,
} from "./queries-family-activity";
import { loadDiscussionThreadSummariesByTargetIds } from './queries-discuss-threads';

const SUPPORTED_MUSIC_TAG_TYPES: MusicTagType[] = ["genre", "subGenre"];
const GLOBAL_TEMPLATE_FAMILY_ID = 1;

export async function deleteMusic(
  musicId: number,
  actor: {
    familyId: number;
    memberId: number;
    isFounder?: boolean;
  }
): Promise<{ success: false; message: string } | { success: true; message: string }> {
  const permissionCheck = actor.isFounder
    ? and(eq(music.id, musicId), eq(music.familyId, actor.familyId))
    : and(eq(music.id, musicId), eq(music.familyId, actor.familyId), eq(music.memberId, actor.memberId));

  const existingMusic = await db
    .select({ id: music.id })
    .from(music)
    .where(permissionCheck)
    .then((rows) => rows[0] ?? null);

  if (!existingMusic) {
    return {
      success: false,
      message: `No music post was found for id: ${ musicId }`,
    };
  }

  try {
    await db
      .delete(discussThread)
      .where(and(eq(discussThread.targetType, "music"), eq(discussThread.targetId, musicId), eq(discussThread.familyId, actor.familyId)));

    await db.delete(music).where(permissionCheck);

    return {
      success: true,
      message: "Music deleted.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error deleting music",
    };
  }
}

function createSubmitterName(firstName?: string | null, lastName?: string | null) {
  const names = [firstName, lastName].filter(Boolean);

  if (names.length > 0) {
    return names.join(" ");
  }

  return "Unknown Member";
}

function createDefaultMusicTemplateJson() {
  return serializeTipTapDocument({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Music Overview" }] },
      { type: "paragraph" },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Why It Resonates" }] },
      { type: "paragraph" },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Favorite Moments" }] },
      { type: "paragraph" },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Family Notes" }] },
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
}): MusicTemplateOption {
  const isFamilyGlobalTemplate = row.isGlobalTemplate && row.familyId === GLOBAL_TEMPLATE_FAMILY_ID;

  return {
    id: row.id,
    templateName: row.templateName,
    isGlobalTemplate: isFamilyGlobalTemplate,
    status: row.status,
    templateJson: row.templateJson,
    memberId: row.memberId,
    familyId: row.familyId,
    label: isFamilyGlobalTemplate ? `${row.templateName} (Global)` : row.templateName,
  };
}

function toLyricsRecord(row: {
  id: number;
  lyricsJson: string;
  status: string;
  updatedAt: Date | null;
  musicId: number;
  memberId: number;
}): MusicLyricsRecord {
  return {
    id: row.id,
    lyricsJson: row.lyricsJson,
    status: row.status,
    updatedAt: row.updatedAt ?? new Date(),
    musicId: row.musicId,
    memberId: row.memberId,
  };
}

async function ensureGlobalMusicTemplate(
  memberId: number,
  canManageGlobalTemplate: boolean
): Promise<MusicTemplateOption | null> {
  const [familyGlobalTemplate] = await db
    .select({
      id: musicTemplate.id,
      templateName: musicTemplate.templateName,
      isGlobalTemplate: musicTemplate.isGlobalTemplate,
      status: musicTemplate.status,
      templateJson: musicTemplate.templateJson,
      memberId: musicTemplate.memberId,
      familyId: musicTemplate.familyId,
    })
    .from(musicTemplate)
    .where(and(eq(musicTemplate.isGlobalTemplate, true), eq(musicTemplate.familyId, GLOBAL_TEMPLATE_FAMILY_ID)))
    .orderBy(asc(musicTemplate.id));

  if (familyGlobalTemplate) {
    return toTemplateOption(familyGlobalTemplate);
  }

  if (!canManageGlobalTemplate) {
    return null;
  }

  const [createdTemplate] = await db
    .insert(musicTemplate)
    .values({
      templateName: `__global-music-${GLOBAL_TEMPLATE_FAMILY_ID}`,
      isGlobalTemplate: true,
      status: "published",
      templateJson: createDefaultMusicTemplateJson(),
      memberId,
      familyId: GLOBAL_TEMPLATE_FAMILY_ID,
    })
    .returning({
      id: musicTemplate.id,
      templateName: musicTemplate.templateName,
      isGlobalTemplate: musicTemplate.isGlobalTemplate,
      status: musicTemplate.status,
      templateJson: musicTemplate.templateJson,
      memberId: musicTemplate.memberId,
      familyId: musicTemplate.familyId,
    });

  return toTemplateOption(createdTemplate);
}

async function loadMusicTagOptions(): Promise<MusicTagOption[]> {
  const rows = await db
    .select({
      id: musicTagReference.id,
      tagName: musicTagReference.tagName,
      tagDesc: musicTagReference.tagDesc,
      tagType: musicTagReference.tagType,
      status: musicTagReference.status,
      seqNo: musicTagReference.seqNo,
    })
    .from(musicTagReference)
    .where(inArray(musicTagReference.tagType, SUPPORTED_MUSIC_TAG_TYPES))
    .orderBy(asc(musicTagReference.tagType), asc(musicTagReference.seqNo), asc(musicTagReference.tagName));

  return rows.map((row) => ({
    id: row.id,
    tagName: row.tagName,
    tagDesc: row.tagDesc,
    tagType: row.tagType as MusicTagType,
    status: row.status,
    seqNo: row.seqNo,
  }));
}

async function loadMusicTemplates(
  familyId: number,
  memberId: number,
  options: {
    includeDraft: boolean;
    includeGlobal: boolean;
    ensureGlobalTemplate?: boolean;
  }
): Promise<MusicTemplateOption[]> {
  const { includeDraft, includeGlobal, ensureGlobalTemplate = false } = options;
  const canManageGlobalTemplate = familyId === GLOBAL_TEMPLATE_FAMILY_ID && ensureGlobalTemplate;

  const fallbackTemplate = ensureGlobalTemplate
    ? await ensureGlobalMusicTemplate(memberId, canManageGlobalTemplate)
    : null;

  const whereCondition = includeGlobal
    ? and(
      or(
        eq(musicTemplate.familyId, familyId),
        and(eq(musicTemplate.isGlobalTemplate, true), eq(musicTemplate.familyId, GLOBAL_TEMPLATE_FAMILY_ID))
      ),
      includeDraft ? undefined : eq(musicTemplate.status, "published")
    )
    : and(
      eq(musicTemplate.familyId, familyId),
      includeDraft ? undefined : eq(musicTemplate.status, "published"),
      eq(musicTemplate.isGlobalTemplate, false)
    );

  const rows = await db
    .select({
      id: musicTemplate.id,
      templateName: musicTemplate.templateName,
      isGlobalTemplate: musicTemplate.isGlobalTemplate,
      status: musicTemplate.status,
      templateJson: musicTemplate.templateJson,
      memberId: musicTemplate.memberId,
      familyId: musicTemplate.familyId,
    })
    .from(musicTemplate)
    .where(whereCondition)
    .orderBy(desc(musicTemplate.isGlobalTemplate), asc(musicTemplate.templateName));

  const mapById = new Map<number, MusicTemplateOption>();

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

async function loadMusicTemplateManagementRecords(
  familyId: number,
  actorMemberId: number,
  actorIsAdmin: boolean
): Promise<MusicTemplateRecord[]> {
  const canManageGlobalTemplate = actorIsAdmin && familyId === GLOBAL_TEMPLATE_FAMILY_ID;

  if (canManageGlobalTemplate) {
    await ensureGlobalMusicTemplate(actorMemberId, true);
  }

  const whereCondition = or(
    eq(musicTemplate.familyId, familyId),
    and(eq(musicTemplate.isGlobalTemplate, true), eq(musicTemplate.familyId, GLOBAL_TEMPLATE_FAMILY_ID))
  );

  const templateRows = await db
    .select({
      id: musicTemplate.id,
      templateName: musicTemplate.templateName,
      status: musicTemplate.status,
      isGlobalTemplate: musicTemplate.isGlobalTemplate,
      templateJson: musicTemplate.templateJson,
      memberId: musicTemplate.memberId,
      familyId: musicTemplate.familyId,
      updatedAt: musicTemplate.updatedAt,
    })
    .from(musicTemplate)
    .where(whereCondition)
    .orderBy(desc(musicTemplate.updatedAt), asc(musicTemplate.templateName));

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
    const isFamilyGlobalTemplate = row.isGlobalTemplate && row.familyId === GLOBAL_TEMPLATE_FAMILY_ID;
    const canEdit = isFamilyGlobalTemplate
      ? canManageGlobalTemplate
      : row.memberId === actorMemberId;

    return {
      id: row.id,
      templateName: row.templateName,
      status: row.status,
      isGlobalTemplate: isFamilyGlobalTemplate,
      templateJson: row.templateJson,
      memberId: row.memberId,
      familyId: row.familyId,
      updatedAt: row.updatedAt ?? new Date(),
      ownerName: isFamilyGlobalTemplate
        ? "Global Template"
        : memberNameById.get(row.memberId ?? 0) ?? `Member #${row.memberId ?? 0}`,
      canEdit,
    };
  });
}

async function loadLyricsByMusicId(musicId: number): Promise<MusicLyricsRecord | null> {
  const [lyricsRow] = await db
    .select({
      id: musicLyrics.id,
      lyricsJson: musicLyrics.lyricsJson,
      status: musicLyrics.status,
      updatedAt: musicLyrics.updatedAt,
      musicId: musicLyrics.musicId,
      memberId: musicLyrics.memberId,
    })
    .from(musicLyrics)
    .where(eq(musicLyrics.musicId, musicId))
    .orderBy(desc(musicLyrics.updatedAt), desc(musicLyrics.id));

  if (!lyricsRow) {
    return null;
  }

  return toLyricsRecord(lyricsRow);
}

async function loadMusics(familyId: number, viewerMemberId?: number): Promise<MusicRecord[]> {
  const musicRows = await db
    .select()
    .from(music)
    .where(eq(music.familyId, familyId))
    .orderBy(desc(music.updatedAt), asc(music.musicTitle));

  if (!musicRows || musicRows.length === 0) {
    return [];
  }

  const musicIds = musicRows.map((row) => row.id);

  const [commentRows, likeRows, tagRows, lyricsRows, discussionThreadsByMusicId] = await Promise.all([
    db
      .select({
        musicId: musicComment.musicId,
        isMusicReviewer: musicComment.isMusicReviewer,
      })
      .from(musicComment)
      .where(inArray(musicComment.musicId, musicIds)),
    db
      .select({
        musicId: musicLike.musicId,
        memberId: musicLike.memberId,
        likenessDegree: musicLike.likenessDegree,
      })
      .from(musicLike)
      .where(inArray(musicLike.musicId, musicIds)),
    db
      .select({
        musicId: musicTag.musicId,
        tagId: musicTag.tagId,
        tagName: musicTagReference.tagName,
        tagType: musicTagReference.tagType,
      })
      .from(musicTag)
      .innerJoin(musicTagReference, eq(musicTagReference.id, musicTag.tagId))
      .where(inArray(musicTag.musicId, musicIds)),
    db
      .select({
        musicId: musicLyrics.musicId,
      })
      .from(musicLyrics)
      .where(inArray(musicLyrics.musicId, musicIds)),
    loadDiscussionThreadSummariesByTargetIds(familyId, 'music', musicIds),
  ]);

  const memberIds = [...new Set(musicRows.map((row) => row.memberId))];
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
  const submitterMemberIdByMusicId = new Map(musicRows.map((row) => [row.id, row.memberId]));

  const commentCountByMusicId = new Map<number, number>();
  const noRatingByMusicId = new Map<number, number>();
  const thumbsUpByMusicId = new Map<number, number>();
  const loveByMusicId = new Map<number, number>();
  const submitterLikeByMusicId = new Map<number, number>();
  const viewerLikeByMusicId = new Map<number, number>();
  const tagIdsByMusicId = new Map<number, number[]>();
  const tagNamesByTypeByMusicId = new Map<number, Partial<Record<MusicTagType, string[]>>>();
  const hasLyricsByMusicId = new Set<number>();

  for (const commentRow of commentRows) {
    if (commentRow.isMusicReviewer) {
      continue;
    }

    commentCountByMusicId.set(commentRow.musicId, (commentCountByMusicId.get(commentRow.musicId) ?? 0) + 1);
  }

  for (const likeRow of likeRows) {
    const submitterMemberId = submitterMemberIdByMusicId.get(likeRow.musicId);

    if (submitterMemberId && likeRow.memberId === submitterMemberId) {
      submitterLikeByMusicId.set(likeRow.musicId, likeRow.likenessDegree);
    } else if (likeRow.likenessDegree === 1) {
      thumbsUpByMusicId.set(likeRow.musicId, (thumbsUpByMusicId.get(likeRow.musicId) ?? 0) + 1);
    } else if (likeRow.likenessDegree === 2) {
      loveByMusicId.set(likeRow.musicId, (loveByMusicId.get(likeRow.musicId) ?? 0) + 1);
    } else if (likeRow.likenessDegree === -1) {
      noRatingByMusicId.set(likeRow.musicId, (noRatingByMusicId.get(likeRow.musicId) ?? 0) + 1);
    }

    if (viewerMemberId && likeRow.memberId === viewerMemberId) {
      viewerLikeByMusicId.set(likeRow.musicId, likeRow.likenessDegree);
    }
  }

  for (const tagRow of tagRows) {
    if (!SUPPORTED_MUSIC_TAG_TYPES.includes(tagRow.tagType as MusicTagType)) {
      continue;
    }

    const nextTagIds = tagIdsByMusicId.get(tagRow.musicId) ?? [];
    nextTagIds.push(tagRow.tagId);
    tagIdsByMusicId.set(tagRow.musicId, nextTagIds);

    const tagType = tagRow.tagType as MusicTagType;
    const byType = tagNamesByTypeByMusicId.get(tagRow.musicId) ?? {};
    const nextNames = byType[tagType] ?? [];
    byType[tagType] = [...nextNames, tagRow.tagName];
    tagNamesByTypeByMusicId.set(tagRow.musicId, byType);
  }

  for (const lyricsRow of lyricsRows) {
    hasLyricsByMusicId.add(lyricsRow.musicId);
  }

  return musicRows.map((row) => ({
    id: row.id,
    musicTitle: row.musicTitle,
    artistName: row.artistName,
    musicJson: row.musicJson,
    status: row.status,
    isSong: row.isSong,
    musicImageUrl: row.musicImageUrl,
    hasLyrics: hasLyricsByMusicId.has(row.id),
    musicDebutYear: row.musicDebutYear,
    updatedAt: row.updatedAt ?? new Date(),
    memberId: row.memberId,
    familyId: row.familyId,
    submitterName: memberNameById.get(row.memberId) ?? `Member #${row.memberId}`,
    submitterLikenessDegree: submitterLikeByMusicId.get(row.id) ?? null,
    commentCount: commentCountByMusicId.get(row.id) ?? 0,
    noRatingCount: noRatingByMusicId.get(row.id) ?? 0,
    thumbsUpCount: thumbsUpByMusicId.get(row.id) ?? 0,
    loveCount: loveByMusicId.get(row.id) ?? 0,
    likedByMember: (viewerLikeByMusicId.get(row.id) ?? -1) !== -1,
    likenessDegree: viewerLikeByMusicId.get(row.id) ?? null,
    selectedTagIds: tagIdsByMusicId.get(row.id) ?? [],
    tagNamesByType: tagNamesByTypeByMusicId.get(row.id) ?? {},
    discussionThreads: discussionThreadsByMusicId.get(row.id) ?? [],
    hasDiscussionThread: (discussionThreadsByMusicId.get(row.id) ?? []).length > 0,
  }));
}

async function loadMusicDetail(
  familyId: number,
  musicId: number,
  viewerMemberId?: number
): Promise<MusicDetail | null> {
  const musicRows = await db
    .select()
    .from(music)
    .where(and(eq(music.familyId, familyId), eq(music.id, musicId)));

  if (!musicRows || musicRows.length === 0) {
    return null;
  }

  const musicRow = musicRows[0];

  const [commentRows, likeRows, tagRows, lyrics, discussionThreadsByMusicId] = await Promise.all([
    db
      .select()
      .from(musicComment)
      .where(eq(musicComment.musicId, musicId))
      .orderBy(asc(musicComment.createdAt)),
    db
      .select({
        memberId: musicLike.memberId,
        likenessDegree: musicLike.likenessDegree,
      })
      .from(musicLike)
      .where(eq(musicLike.musicId, musicId)),
    db
      .select({
        tagId: musicTag.tagId,
        tagName: musicTagReference.tagName,
        tagType: musicTagReference.tagType,
      })
      .from(musicTag)
      .innerJoin(musicTagReference, eq(musicTagReference.id, musicTag.tagId))
      .where(eq(musicTag.musicId, musicId)),
    loadLyricsByMusicId(musicId),
    loadDiscussionThreadSummariesByTargetIds(familyId, 'music', [musicId]),
  ]);

  const commentMemberIds = [...new Set(commentRows.map((row) => row.memberId).filter((memberId) => Number.isInteger(memberId)))];
  const memberIds = [...new Set([musicRow.memberId, ...commentMemberIds])];

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

  const submitterLike = likeRows.find((row) => row.memberId === musicRow.memberId) ?? null;
  const audienceLikeRows = likeRows.filter((row) => row.memberId !== musicRow.memberId);
  const noRatingCount = audienceLikeRows.filter((row) => row.likenessDegree === -1).length;
  const thumbsUpCount = audienceLikeRows.filter((row) => row.likenessDegree === 1).length;
  const loveCount = audienceLikeRows.filter((row) => row.likenessDegree === 2).length;
  const regularCommentRows = commentRows.filter((row) => !row.isMusicReviewer);

  const viewerLike = viewerMemberId
    ? likeRows.find((row) => row.memberId === viewerMemberId)
    : null;

  const tagIdsByMusicId = new Map<number, number[]>();
  const tagNamesByTypeByMusicId = new Map<number, Partial<Record<MusicTagType, string[]>>>();

  for (const tagRow of tagRows) {
    if (!SUPPORTED_MUSIC_TAG_TYPES.includes(tagRow.tagType as MusicTagType)) {
      continue;
    }

    const existingTagIds = tagIdsByMusicId.get(musicId) ?? [];
    existingTagIds.push(tagRow.tagId);
    tagIdsByMusicId.set(musicId, existingTagIds);

    const tagType = tagRow.tagType as MusicTagType;
    const byType = tagNamesByTypeByMusicId.get(musicId) ?? {};
    const currentNames = byType[tagType] ?? [];
    byType[tagType] = [...currentNames, tagRow.tagName];
    tagNamesByTypeByMusicId.set(musicId, byType);
  }

  const musicComments: MusicComment[] = regularCommentRows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt ?? new Date(),
    commenterName: memberNameById.get(row.memberId ?? 0) ?? `Member #${row.memberId ?? 0}`,
    commentJson: normalizeSerializedTipTapDocument(row.commentJson),
  }));

  return {
    id: musicRow.id,
    musicTitle: musicRow.musicTitle,
    artistName: musicRow.artistName,
    musicJson: musicRow.musicJson,
    status: musicRow.status,
    isSong: musicRow.isSong,
    musicImageUrl: musicRow.musicImageUrl,
    hasLyrics: Boolean(lyrics),
    musicDebutYear: musicRow.musicDebutYear,
    updatedAt: musicRow.updatedAt ?? new Date(),
    memberId: musicRow.memberId,
    familyId: musicRow.familyId,
    submitterName: memberNameById.get(musicRow.memberId) ?? `Member #${musicRow.memberId}`,
    submitterLikenessDegree: submitterLike?.likenessDegree ?? null,
    commentCount: regularCommentRows.length,
    noRatingCount,
    thumbsUpCount,
    loveCount,
    likedByMember: Boolean(viewerLike && viewerLike.likenessDegree !== -1),
    likenessDegree: viewerLike?.likenessDegree ?? null,
    selectedTagIds: tagIdsByMusicId.get(musicId) ?? [],
    tagNamesByType: tagNamesByTypeByMusicId.get(musicId) ?? {},
    discussionThreads: discussionThreadsByMusicId.get(musicId) ?? [],
    hasDiscussionThread: (discussionThreadsByMusicId.get(musicId) ?? []).length > 0,
    musicComments,
    lyrics,
  };
}

export async function getMusicById(
  familyId: number,
  musicId: number,
  viewerMemberId?: number
): Promise<{ success: false; message: string } | { success: true; music: MusicRecord }> {
  const musics = await loadMusics(familyId, viewerMemberId);
  const selectedMusic = musics.find((musicRecord) => musicRecord.id === musicId);

  if (!selectedMusic) {
    return {
      success: false,
      message: `No music was found for id: ${musicId}`,
    };
  }

  return {
    success: true,
    music: selectedMusic,
  };
}

export async function getMusicLyricsByMusicId(
  familyId: number,
  musicId: number
): Promise<{ success: false; message: string } | { success: true; lyrics: MusicLyricsRecord | null }> {
  const [musicRow] = await db
    .select({
      id: music.id,
      familyId: music.familyId,
    })
    .from(music)
    .where(and(eq(music.id, musicId), eq(music.familyId, familyId)));

  if (!musicRow) {
    return {
      success: false,
      message: `No music was found for id: ${musicId}`,
    };
  }

  return {
    success: true,
    lyrics: await loadLyricsByMusicId(musicId),
  };
}

export async function getMusicHomePageData(
  familyId: number,
  memberId: number,
  isAdmin = false
): Promise<MusicHomePageDataReturn> {
  try {
    const canManageGlobalTemplate = isAdmin && familyId === GLOBAL_TEMPLATE_FAMILY_ID;

    const [musics, musicTags, musicTemplates] = await Promise.all([
      loadMusics(familyId, memberId),
      loadMusicTagOptions(),
      loadMusicTemplates(familyId, memberId, {
        includeDraft: false,
        includeGlobal: true,
        ensureGlobalTemplate: canManageGlobalTemplate,
      }),
    ]);

    return {
      success: true,
      musics,
      musicTags,
      musicTemplates,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error loading music home page data",
    };
  }
}

export async function getMusicTemplateManagementData(
  familyId: number,
  memberId: number,
  isAdmin: boolean
): Promise<MusicTemplateManagementDataReturn> {
  try {
    const canManageGlobalTemplate = isAdmin && familyId === GLOBAL_TEMPLATE_FAMILY_ID;
    const templates = await loadMusicTemplateManagementRecords(familyId, memberId, canManageGlobalTemplate);

    return {
      success: true,
      templates,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error loading music templates",
    };
  }
}

export async function saveMusic(
  input: SaveMusicInput,
  actor: {
    familyId: number;
    memberId: number;
    isFounder?: boolean;
  }
): Promise<SaveMusicReturn> {
  const normalizedTitle = input.musicTitle.trim();

  if (!normalizedTitle) {
    return {
      success: false,
      message: "Music title is required.",
    };
  }

  const sanitizedTagIds = [...new Set(input.selectedTagIds)].filter((tagId) => Number.isInteger(tagId) && tagId > 0);
  const existingMusic = input.id
    ? await db
      .select()
      .from(music)
      .where(and(eq(music.id, input.id), eq(music.familyId, actor.familyId)))
      .then((rows) => rows[0] ?? null)
    : null;

  if (input.id && !existingMusic) {
    return {
      success: false,
      message: `No music was found for id: ${input.id}`,
    };
  }

  if (existingMusic && existingMusic.memberId !== actor.memberId) {
    if (!actor.isFounder) {
      return {
        success: false,
        message: "Only the member who created this music can edit it.",
      };
    }

    // Founders can only change status to/from archived
    const isArchiveStatusChange =
      input.status === "archived" || 
      (existingMusic.status === "archived" && input.status === "published");

    if (!isArchiveStatusChange) {
      return {
        success: false,
        message: "Only the member who created this music can edit it.",
      };
    }

    // For founders doing archive/unarchive, only update status field
    try {
      const [updatedMusic] = await db
        .update(music)
        .set({ status: input.status })
        .where(eq(music.id, existingMusic.id))
        .returning();

      if (!updatedMusic) {
        return {
          success: false,
          message: `Failed to archive/unarchive music with id: ${input.id}`,
        };
      }

      // Load the full updated music to return
      const musics = await loadMusics(actor.familyId, actor.memberId);
      const fullUpdatedMusic = musics.find((m) => m.id === updatedMusic.id);

      if (!fullUpdatedMusic) {
        return {
          success: false,
          message: `Failed to load updated music with id: ${input.id}`,
        };
      }

      return {
        success: true,
        music: fullUpdatedMusic,
        message: updatedMusic.status === "archived" ? "Music archived." : "Music unarchived.",
      };
    } catch (error) {
      console.error("Error archiving music:", error);
      return {
        success: false,
        message: "An error occurred while archiving the music.",
      };
    }
  }

  const templates = await loadMusicTemplates(actor.familyId, actor.memberId, {
    includeDraft: true,
    includeGlobal: true,
    ensureGlobalTemplate: true,
  });

  const selectedTemplate = templates.find((template) => template.id === input.templateId);

  if (!selectedTemplate) {
    return {
      success: false,
      message: "A music template must be selected.",
    };
  }

  const submitterLikenessDegree = Number(input.submitterLikenessDegree);
  const hasSubmitterLikenessDegree = [1, 2].includes(submitterLikenessDegree);
  if (!existingMusic && !hasSubmitterLikenessDegree) {
    return {
      success: false,
      message: "Select Like or Love for your own music post.",
    };
  }

  const normalizedMusicJson = input.musicJson?.trim();
  const parsedMusicJson = normalizedMusicJson ? parseSerializedTipTapDocument(normalizedMusicJson) : null;
  const musicJsonToStore = parsedMusicJson?.success
    ? normalizedMusicJson
    : selectedTemplate.templateJson || serializeTipTapDocument(createEmptyTipTapDocument());

  try {
    const [persistedMusic] = input.id
      ? await db
        .update(music)
        .set({
          musicTitle: normalizedTitle,
          artistName: input.artistName,
          musicJson: musicJsonToStore,
          status: input.status,
          isSong: input.isSong,
          musicImageUrl: input.musicImageUrl ?? null,
          musicDebutYear: input.musicDebutYear,
          updatedAt: new Date(),
        })
        .where(and(eq(music.id, input.id), eq(music.familyId, actor.familyId)))
        .returning()
      : await db
        .insert(music)
        .values({
          musicTitle: normalizedTitle,
          artistName: input.artistName,
          musicJson: musicJsonToStore,
          status: input.status,
          isSong: input.isSong,
          musicImageUrl: input.musicImageUrl ?? null,
          musicDebutYear: input.musicDebutYear,
          memberId: actor.memberId,
          familyId: actor.familyId,
        })
        .returning();

    if (!persistedMusic) {
      return {
        success: false,
        message: "Could not save music.",
      };
    }

    await db.delete(musicTag).where(eq(musicTag.musicId, persistedMusic.id));

    if (sanitizedTagIds.length > 0) {
      await db.insert(musicTag).values(
        sanitizedTagIds.map((tagId) => ({
          musicId: persistedMusic.id,
          tagId,
        }))
      );
    }

    if (!existingMusic) {
      await db.insert(musicComment).values({
        musicId: persistedMusic.id,
        memberId: actor.memberId,
        commentJson: serializeTipTapDocument(createEmptyTipTapDocument()),
        isMusicReviewer: true,
      });
    }

    if (hasSubmitterLikenessDegree) {
      await db.delete(musicLike).where(and(eq(musicLike.musicId, persistedMusic.id), eq(musicLike.memberId, actor.memberId)));

      await db.insert(musicLike).values({
        musicId: persistedMusic.id,
        memberId: actor.memberId,
        likenessDegree: submitterLikenessDegree,
        updatedAt: new Date(),
      });
    }

    if (!existingMusic) {
      await createFamilyActivityRecord({
        actionType: FAMILY_ACTIVITY_ACTION_TYPES.POST_CREATED,
        featureName: "Music Salon",
        postName: normalizedTitle,
        familyId: actor.familyId,
        memberId: actor.memberId,
      });
    }

    const musics = await loadMusics(actor.familyId, actor.memberId);
    const savedMusic = musics.find((musicRecord) => musicRecord.id === persistedMusic.id);

    if (!savedMusic) {
      return {
        success: false,
        message: "Music was saved but could not be reloaded.",
      };
    }

    return {
      success: true,
      music: savedMusic,
      message: input.id ? "Music updated." : "Music added.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error saving music",
    };
  }
}

export async function saveMusicTemplate(
  input: SaveMusicTemplateInput,
  actor: {
    familyId: number;
    memberId: number;
    isAdmin: boolean;
  }
): Promise<SaveMusicTemplateReturn> {
  const canManageGlobalTemplate = actor.isAdmin && actor.familyId === GLOBAL_TEMPLATE_FAMILY_ID;
  const normalizedName = input.templateName.trim();
  const normalizedStatus = input.status.trim().toLowerCase();
  const normalizedJson = input.templateJson.trim();

  if (!normalizedName) {
    return {
      success: false,
      message: "Template name is required.",
    };
  }

  if (!["draft", "published"].includes(normalizedStatus)) {
    return {
      success: false,
      message: "Template status must be draft or published.",
    };
  }

  const jsonResult = parseSerializedTipTapDocument(normalizedJson);

  if (!jsonResult.success) {
    return {
      success: false,
      message: "Template content must be valid TipTap JSON.",
    };
  }

  const existingTemplate = input.id
    ? await db
      .select()
      .from(musicTemplate)
      .where(eq(musicTemplate.id, input.id))
      .then((rows) => rows[0] ?? null)
    : null;

  if (input.id && !existingTemplate) {
    return {
      success: false,
      message: `No music template was found for id: ${input.id}`,
    };
  }

  if (existingTemplate) {
    const isFamilyGlobalTemplate = existingTemplate.isGlobalTemplate && existingTemplate.familyId === GLOBAL_TEMPLATE_FAMILY_ID;
    const canEditExisting = isFamilyGlobalTemplate
      ? canManageGlobalTemplate && existingTemplate.familyId === GLOBAL_TEMPLATE_FAMILY_ID
      : existingTemplate.memberId === actor.memberId && existingTemplate.familyId === actor.familyId;

    if (!canEditExisting) {
      return {
        success: false,
        message: "You cannot edit this music template.",
      };
    }
  }

  try {
    const [persistedTemplate] = input.id
      ? await db
        .update(musicTemplate)
        .set({
          templateName: normalizedName,
          status: normalizedStatus,
          templateJson: normalizedJson,
          updatedAt: new Date(),
        })
        .where(eq(musicTemplate.id, input.id))
        .returning()
      : await db
        .insert(musicTemplate)
        .values({
          templateName: normalizedName,
          status: normalizedStatus,
          templateJson: normalizedJson,
          isGlobalTemplate: false,
          memberId: actor.memberId,
          familyId: actor.familyId,
        })
        .returning();

    if (!persistedTemplate) {
      return {
        success: false,
        message: "Could not save music template.",
      };
    }

    const templates = await loadMusicTemplateManagementRecords(actor.familyId, actor.memberId, canManageGlobalTemplate);
    const savedTemplate = templates.find((template) => template.id === persistedTemplate.id);

    if (!savedTemplate) {
      return {
        success: false,
        message: "Music template was saved but could not be reloaded.",
      };
    }

    return {
      success: true,
      template: savedTemplate,
      message: input.id ? "Music template updated." : "Music template added.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error saving music template",
    };
  }
}

export async function saveMusicLyrics(
  input: SaveMusicLyricsInput,
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<SaveMusicLyricsReturn> {
  const parsedLyrics = parseSerializedTipTapDocument(input.lyricsJson.trim());

  if (!parsedLyrics.success) {
    return {
      success: false,
      message: "Lyrics content must be valid TipTap JSON.",
    };
  }

  if (!["draft", "published"].includes(input.status)) {
    return {
      success: false,
      message: "Lyrics status must be draft or published.",
    };
  }

  const [musicRow] = await db
    .select({
      id: music.id,
      familyId: music.familyId,
      isSong: music.isSong,
      memberId: music.memberId,
    })
    .from(music)
    .where(and(eq(music.id, input.musicId), eq(music.familyId, actor.familyId)));

  if (!musicRow) {
    return {
      success: false,
      message: `No music was found for id: ${input.musicId}`,
    };
  }

  if (!musicRow.isSong) {
    return {
      success: false,
      message: "Lyrics can only be added for songs.",
    };
  }

  try {
    const [existingLyrics] = await db
      .select()
      .from(musicLyrics)
      .where(eq(musicLyrics.musicId, input.musicId))
      .orderBy(desc(musicLyrics.updatedAt), desc(musicLyrics.id));

    if (existingLyrics && existingLyrics.memberId !== actor.memberId) {
      return {
        success: false,
        message: "Only the member who created these lyrics can edit them.",
      };
    }

    if (!existingLyrics && musicRow.memberId !== actor.memberId) {
      return {
        success: false,
        message: "Only the member who created this music can add lyrics.",
      };
    }

    const [savedRow] = existingLyrics
      ? await db
        .update(musicLyrics)
        .set({
          lyricsJson: input.lyricsJson.trim(),
          status: input.status,
          memberId: actor.memberId,
          updatedAt: new Date(),
        })
        .where(eq(musicLyrics.id, existingLyrics.id))
        .returning({
          id: musicLyrics.id,
          lyricsJson: musicLyrics.lyricsJson,
          status: musicLyrics.status,
          updatedAt: musicLyrics.updatedAt,
          musicId: musicLyrics.musicId,
          memberId: musicLyrics.memberId,
        })
      : await db
        .insert(musicLyrics)
        .values({
          lyricsJson: input.lyricsJson.trim(),
          status: input.status,
          musicId: input.musicId,
          memberId: actor.memberId,
          updatedAt: new Date(),
        })
        .returning({
          id: musicLyrics.id,
          lyricsJson: musicLyrics.lyricsJson,
          status: musicLyrics.status,
          updatedAt: musicLyrics.updatedAt,
          musicId: musicLyrics.musicId,
          memberId: musicLyrics.memberId,
        });

    if (!savedRow) {
      return {
        success: false,
        message: "Could not save lyrics.",
      };
    }

    return {
      success: true,
      lyrics: toLyricsRecord(savedRow),
      message: existingLyrics ? "Lyrics updated." : "Lyrics added.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error saving lyrics",
    };
  }
}

export async function getMusicDetail(
  familyId: number,
  musicId: number,
  viewerMemberId?: number
): Promise<GetMusicDetailReturn> {
  try {
    const selectedMusic = await loadMusicDetail(familyId, musicId, viewerMemberId);

    if (!selectedMusic) {
      return {
        success: false,
        message: `No music was found for id: ${musicId}`,
      };
    }

    return {
      success: true,
      music: selectedMusic,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error loading music detail",
    };
  }
}

export async function toggleMusicLike(
  musicId: number,
  likenessDegree: number,
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<ToggleMusicLikeReturn> {
  if (![-1, 1, 2].includes(likenessDegree)) {
    return {
      success: false,
      message: "Music reactions must be thumbs down, thumbs up, or love.",
    };
  }

  const selectedMusic = await loadMusicDetail(actor.familyId, musicId, actor.memberId);

  if (!selectedMusic) {
    return {
      success: false,
      message: `No music was found for id: ${musicId}`,
    };
  }

  if (selectedMusic.memberId === actor.memberId) {
    return {
      success: false,
      message: "You cannot react to your own music.",
    };
  }

  try {
    await db.delete(musicLike).where(and(eq(musicLike.musicId, musicId), eq(musicLike.memberId, actor.memberId)));
    await db.insert(musicLike).values({
      musicId,
      memberId: actor.memberId,
      likenessDegree,
      updatedAt: new Date(),
    });

    if (likenessDegree === 1 || likenessDegree === 2) {
      await createFamilyReactionActivityRecord({
        reactionType: likenessDegree === 2 ? "love" : "like",
        featureName: "Music Salon",
        postName: selectedMusic.musicTitle,
        familyId: actor.familyId,
        memberId: actor.memberId,
      });
    }

    const updatedMusic = await loadMusicDetail(actor.familyId, musicId, actor.memberId);

    if (!updatedMusic) {
      return {
        success: false,
        message: "Music reaction was saved but the music could not be reloaded.",
      };
    }

    return {
      success: true,
      music: updatedMusic,
      message: likenessDegree === -1 ? "Thumbs down saved." : likenessDegree === 1 ? "Thumbs up saved." : "Love saved.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error saving music reaction",
    };
  }
}

export async function addMusicComment(
  input: {
    musicId: number;
    commentText: string;
    clientRequestId?: string;
  },
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<AddMusicCommentReturn> {
  const normalizedComment = input.commentText.trim();

  const parsedComment = parseSerializedTipTapDocument(normalizedComment);
  const commentJson = parsedComment.success
    ? serializeTipTapDocument(parsedComment.content)
    : serializeTipTapDocument(createTextTipTapDocument(normalizedComment));

  if (parsedComment.success && isTipTapDocumentEmpty(parsedComment.content)) {
    return {
      success: false,
      message: "Comment cannot be empty.",
    };
  }

  if (!parsedComment.success && !normalizedComment) {
    return {
      success: false,
      message: "Comment text is required.",
    };
  }

  const selectedMusic = await loadMusicDetail(actor.familyId, input.musicId, actor.memberId);

  if (!selectedMusic) {
    return {
      success: false,
      message: `No music was found for id: ${input.musicId}`,
    };
  }

  try {
    const duplicateRequest = input.clientRequestId
      ? await db
        .insert(pwaMutationRequest)
        .values({
          requestKey: input.clientRequestId,
          mutationName: 'music.addMusicComment',
          entityType: 'music',
          entityId: input.musicId,
          familyId: actor.familyId,
          memberId: actor.memberId,
        })
        .onConflictDoNothing({ target: pwaMutationRequest.requestKey })
        .returning({ id: pwaMutationRequest.id })
      : [{ id: 0 }];

    if (input.clientRequestId && duplicateRequest.length === 0) {
      const existingUpdatedMusic = await loadMusicDetail(actor.familyId, input.musicId, actor.memberId);

      if (!existingUpdatedMusic) {
        return {
          success: false,
          message: 'Music comment was already submitted, but the music could not be reloaded.',
        };
      }

      return {
        success: true,
        music: existingUpdatedMusic,
        message: 'Comment already synced.',
      };
    }

    await db.insert(musicComment).values({
      musicId: input.musicId,
      memberId: actor.memberId,
      commentJson,
      isMusicReviewer: false,
      createdAt: new Date(),
    });

    const updatedMusic = await loadMusicDetail(actor.familyId, input.musicId, actor.memberId);

    if (!updatedMusic) {
      return {
        success: false,
        message: "Music comment was saved but the music could not be reloaded.",
      };
    }

    return {
      success: true,
      music: updatedMusic,
      message: "Music comment added.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error saving music comment",
    };
  }
}
