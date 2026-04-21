import db from "@/components/db/drizzle";
import { and, asc, desc, eq, inArray, isNull, ne, or } from "drizzle-orm";

import {
  member,
  movie,
  movieComment,
  movieLike,
  movieTag,
  movieTagReference,
  movieTemplate,
} from "../schema/family-social-schema-tables";
import {
  AddMovieCommentReturn,
  GetMovieDetailReturn,
  MovieComment,
  MovieDetail,
  MovieHomePageDataReturn,
  MovieRecord,
  MovieTagOption,
  MovieTagType,
  MovieTemplateManagementDataReturn,
  MovieTemplateOption,
  MovieTemplateRecord,
  SaveMovieInput,
  SaveMovieReturn,
  SaveMovieTemplateInput,
  SaveMovieTemplateReturn,
  ToggleMovieLikeReturn,
} from "../types/movies";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "../types/poem-term-validation";

const SUPPORTED_MOVIE_TAG_TYPES: MovieTagType[] = ["genre", "adjective", "channel"];

function createSubmitterName(firstName?: string | null, lastName?: string | null) {
  const names = [firstName, lastName].filter(Boolean);

  if (names.length > 0) {
    return names.join(" ");
  }

  return "Unknown Member";
}

function createDefaultMovieTemplateJson() {
  return serializeTipTapDocument({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Movie Overview" }] },
      { type: "paragraph" },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Why We Recommend It" }] },
      { type: "paragraph" },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Favorite Scenes" }] },
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
}): MovieTemplateOption {
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

async function ensureGlobalMovieTemplate(
  familyId: number,
  memberId: number
): Promise<MovieTemplateOption> {
  const [familyGlobalTemplate] = await db
    .select({
      id: movieTemplate.id,
      templateName: movieTemplate.templateName,
      isGlobalTemplate: movieTemplate.isGlobalTemplate,
      status: movieTemplate.status,
      templateJson: movieTemplate.templateJson,
      memberId: movieTemplate.memberId,
      familyId: movieTemplate.familyId,
    })
    .from(movieTemplate)
    .where(and(eq(movieTemplate.isGlobalTemplate, true), eq(movieTemplate.familyId, familyId)))
    .orderBy(asc(movieTemplate.id));

  if (familyGlobalTemplate) {
    return toTemplateOption(familyGlobalTemplate);
  }

  const [sharedGlobalTemplate] = await db
    .select({
      id: movieTemplate.id,
      templateName: movieTemplate.templateName,
      isGlobalTemplate: movieTemplate.isGlobalTemplate,
      status: movieTemplate.status,
      templateJson: movieTemplate.templateJson,
      memberId: movieTemplate.memberId,
      familyId: movieTemplate.familyId,
    })
    .from(movieTemplate)
    .where(and(eq(movieTemplate.isGlobalTemplate, true), isNull(movieTemplate.familyId)))
    .orderBy(asc(movieTemplate.id));

  if (sharedGlobalTemplate) {
    return toTemplateOption(sharedGlobalTemplate);
  }

  const [createdTemplate] = await db
    .insert(movieTemplate)
    .values({
      templateName: `__global-movie-${familyId}`,
      isGlobalTemplate: true,
      status: "published",
      templateJson: createDefaultMovieTemplateJson(),
      memberId,
      familyId,
    })
    .returning({
      id: movieTemplate.id,
      templateName: movieTemplate.templateName,
      isGlobalTemplate: movieTemplate.isGlobalTemplate,
      status: movieTemplate.status,
      templateJson: movieTemplate.templateJson,
      memberId: movieTemplate.memberId,
      familyId: movieTemplate.familyId,
    });

  return toTemplateOption(createdTemplate);
}

async function loadMovieTagOptions(): Promise<MovieTagOption[]> {
  const rows = await db
    .select({
      id: movieTagReference.id,
      tagName: movieTagReference.tagName,
      tagDesc: movieTagReference.tagDesc,
      tagType: movieTagReference.tagType,
      status: movieTagReference.status,
      seqNo: movieTagReference.seqNo,
    })
    .from(movieTagReference)
    .where(inArray(movieTagReference.tagType, SUPPORTED_MOVIE_TAG_TYPES))
    .orderBy(asc(movieTagReference.tagType), asc(movieTagReference.seqNo), asc(movieTagReference.tagName));

  return rows.map((row) => ({
    id: row.id,
    tagName: row.tagName,
    tagDesc: row.tagDesc,
    tagType: row.tagType as MovieTagType,
    status: row.status,
    seqNo: row.seqNo,
  }));
}

async function loadMovieTemplates(
  familyId: number,
  memberId: number,
  options: {
    includeDraft: boolean;
    includeGlobal: boolean;
    ensureGlobalTemplate?: boolean;
  }
): Promise<MovieTemplateOption[]> {
  const { includeDraft, includeGlobal, ensureGlobalTemplate = false } = options;

  const fallbackTemplate = ensureGlobalTemplate
    ? await ensureGlobalMovieTemplate(familyId, memberId)
    : null;

  const whereCondition = includeGlobal
    ? and(
      or(
        eq(movieTemplate.familyId, familyId),
        and(eq(movieTemplate.isGlobalTemplate, true), isNull(movieTemplate.familyId))
      ),
      includeDraft ? undefined : eq(movieTemplate.status, "published")
    )
    : and(
      eq(movieTemplate.familyId, familyId),
      includeDraft ? undefined : eq(movieTemplate.status, "published"),
      eq(movieTemplate.isGlobalTemplate, false)
    );

  const rows = await db
    .select({
      id: movieTemplate.id,
      templateName: movieTemplate.templateName,
      isGlobalTemplate: movieTemplate.isGlobalTemplate,
      status: movieTemplate.status,
      templateJson: movieTemplate.templateJson,
      memberId: movieTemplate.memberId,
      familyId: movieTemplate.familyId,
    })
    .from(movieTemplate)
    .where(whereCondition)
    .orderBy(desc(movieTemplate.isGlobalTemplate), asc(movieTemplate.templateName));

  const mapById = new Map<number, MovieTemplateOption>();

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

async function loadMovieTemplateManagementRecords(
  familyId: number,
  actorMemberId: number,
  actorIsAdmin: boolean
): Promise<MovieTemplateRecord[]> {
  if (actorIsAdmin) {
    await ensureGlobalMovieTemplate(familyId, actorMemberId);
  }

  const whereCondition = actorIsAdmin
    ? eq(movieTemplate.familyId, familyId)
    : and(eq(movieTemplate.familyId, familyId), eq(movieTemplate.isGlobalTemplate, false));

  const templateRows = await db
    .select({
      id: movieTemplate.id,
      templateName: movieTemplate.templateName,
      status: movieTemplate.status,
      isGlobalTemplate: movieTemplate.isGlobalTemplate,
      templateJson: movieTemplate.templateJson,
      memberId: movieTemplate.memberId,
      familyId: movieTemplate.familyId,
      updatedAt: movieTemplate.updatedAt,
    })
    .from(movieTemplate)
    .where(whereCondition)
    .orderBy(desc(movieTemplate.updatedAt), asc(movieTemplate.templateName));

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

async function loadMovies(familyId: number, viewerMemberId?: number): Promise<MovieRecord[]> {
  const movieRows = await db
    .select()
    .from(movie)
    .where(eq(movie.familyId, familyId))
    .orderBy(desc(movie.updatedAt), asc(movie.movieTitle));

  if (!movieRows || movieRows.length === 0) {
    return [];
  }

  const movieIds = movieRows.map((row) => row.id);

  const [commentRows, likeRows, tagRows] = await Promise.all([
    db
      .select({
        movieId: movieComment.movieId,
      })
      .from(movieComment)
      .where(inArray(movieComment.movieId, movieIds)),
    db
      .select({
        movieId: movieLike.movieId,
        memberId: movieLike.memberId,
        likenessDegree: movieLike.likenessDegree,
      })
      .from(movieLike)
      .where(inArray(movieLike.movieId, movieIds)),
    db
      .select({
        movieId: movieTag.movieId,
        tagId: movieTag.tagId,
        tagName: movieTagReference.tagName,
        tagType: movieTagReference.tagType,
      })
      .from(movieTag)
      .innerJoin(movieTagReference, eq(movieTagReference.id, movieTag.tagId))
      .where(inArray(movieTag.movieId, movieIds)),
  ]);

  const memberIds = [...new Set(movieRows.map((row) => row.memberId))];
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

  const commentCountByMovieId = new Map<number, number>();
  const noRatingByMovieId = new Map<number, number>();
  const thumbsUpByMovieId = new Map<number, number>();
  const loveByMovieId = new Map<number, number>();
  const viewerLikeByMovieId = new Map<number, number>();
  const tagIdsByMovieId = new Map<number, number[]>();
  const tagNamesByTypeByMovieId = new Map<number, Partial<Record<MovieTagType, string[]>>>();

  for (const commentRow of commentRows) {
    commentCountByMovieId.set(commentRow.movieId, (commentCountByMovieId.get(commentRow.movieId) ?? 0) + 1);
  }

  for (const likeRow of likeRows) {
    if (likeRow.likenessDegree === 1) {
      thumbsUpByMovieId.set(likeRow.movieId, (thumbsUpByMovieId.get(likeRow.movieId) ?? 0) + 1);
      continue;
    }

    if (likeRow.likenessDegree === 2) {
      loveByMovieId.set(likeRow.movieId, (loveByMovieId.get(likeRow.movieId) ?? 0) + 1);
      continue;
    }

    if (likeRow.likenessDegree === -1) {
      noRatingByMovieId.set(likeRow.movieId, (noRatingByMovieId.get(likeRow.movieId) ?? 0) + 1);
    }

    if (viewerMemberId && likeRow.memberId === viewerMemberId) {
      viewerLikeByMovieId.set(likeRow.movieId, likeRow.likenessDegree);
    }
  }

  for (const tagRow of tagRows) {
    if (!SUPPORTED_MOVIE_TAG_TYPES.includes(tagRow.tagType as MovieTagType)) {
      continue;
    }

    const nextTagIds = tagIdsByMovieId.get(tagRow.movieId) ?? [];
    nextTagIds.push(tagRow.tagId);
    tagIdsByMovieId.set(tagRow.movieId, nextTagIds);

    const tagType = tagRow.tagType as MovieTagType;
    const byType = tagNamesByTypeByMovieId.get(tagRow.movieId) ?? {};
    const nextNames = byType[tagType] ?? [];
    byType[tagType] = [...nextNames, tagRow.tagName];
    tagNamesByTypeByMovieId.set(tagRow.movieId, byType);
  }

  return movieRows.map((row) => ({
    id: row.id,
    movieTitle: row.movieTitle,
    movieCaption: row.movieCaption,
    movieJson: row.movieJson,
    status: row.status,
    movieImageUrl: row.movieImageUrl,
    movieDebutYear: row.movieDebutYear,
    updatedAt: row.updatedAt ?? new Date(),
    memberId: row.memberId,
    familyId: row.familyId,
    submitterName: memberNameById.get(row.memberId) ?? `Member #${row.memberId}`,
    commentCount: commentCountByMovieId.get(row.id) ?? 0,
    noRatingCount: noRatingByMovieId.get(row.id) ?? 0,
    thumbsUpCount: thumbsUpByMovieId.get(row.id) ?? 0,
    loveCount: loveByMovieId.get(row.id) ?? 0,
    likedByMember: (viewerLikeByMovieId.get(row.id) ?? -1) !== -1,
    likenessDegree: viewerLikeByMovieId.get(row.id) ?? null,
    selectedTagIds: tagIdsByMovieId.get(row.id) ?? [],
    tagNamesByType: tagNamesByTypeByMovieId.get(row.id) ?? {},
  }));
}

async function loadMovieDetail(
  familyId: number,
  movieId: number,
  viewerMemberId?: number
): Promise<MovieDetail | null> {
  const movieRows = await db
    .select()
    .from(movie)
    .where(and(eq(movie.familyId, familyId), eq(movie.id, movieId)));

  if (!movieRows || movieRows.length === 0) {
    return null;
  }

  const movieRow = movieRows[0];

  const [commentRows, likeRows, tagRows] = await Promise.all([
    db
      .select()
      .from(movieComment)
      .where(eq(movieComment.movieId, movieId))
      .orderBy(asc(movieComment.createdAt)),
    db
      .select({
        memberId: movieLike.memberId,
        likenessDegree: movieLike.likenessDegree,
      })
      .from(movieLike)
      .where(eq(movieLike.movieId, movieId)),
    db
      .select({
        tagId: movieTag.tagId,
        tagName: movieTagReference.tagName,
        tagType: movieTagReference.tagType,
      })
      .from(movieTag)
      .innerJoin(movieTagReference, eq(movieTagReference.id, movieTag.tagId))
      .where(eq(movieTag.movieId, movieId)),
  ]);

  const commentMemberIds = [...new Set(commentRows.map((row) => row.memberId).filter((memberId) => Number.isInteger(memberId)))];
  const memberIds = [...new Set([movieRow.memberId, ...commentMemberIds])];

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

  const noRatingCount = likeRows.filter((row) => row.likenessDegree === -1).length;
  const thumbsUpCount = likeRows.filter((row) => row.likenessDegree === 1).length;
  const loveCount = likeRows.filter((row) => row.likenessDegree === 2).length;

  const viewerLike = viewerMemberId
    ? likeRows.find((row) => row.memberId === viewerMemberId)
    : null;

  const tagIdsByMovieId = new Map<number, number[]>();
  const tagNamesByTypeByMovieId = new Map<number, Partial<Record<MovieTagType, string[]>>>();

  for (const tagRow of tagRows) {
    if (!SUPPORTED_MOVIE_TAG_TYPES.includes(tagRow.tagType as MovieTagType)) {
      continue;
    }

    const existingTagIds = tagIdsByMovieId.get(movieId) ?? [];
    existingTagIds.push(tagRow.tagId);
    tagIdsByMovieId.set(movieId, existingTagIds);

    const tagType = tagRow.tagType as MovieTagType;
    const byType = tagNamesByTypeByMovieId.get(movieId) ?? {};
    const currentNames = byType[tagType] ?? [];
    byType[tagType] = [...currentNames, tagRow.tagName];
    tagNamesByTypeByMovieId.set(movieId, byType);
  }

  const movieComments: MovieComment[] = commentRows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt ?? new Date(),
    commenterName: memberNameById.get(row.memberId ?? 0) ?? `Member #${row.memberId ?? 0}`,
    text: row.commentJson,
  }));

  return {
    id: movieRow.id,
    movieTitle: movieRow.movieTitle,
    movieCaption: movieRow.movieCaption,
    movieJson: movieRow.movieJson,
    status: movieRow.status,
    movieImageUrl: movieRow.movieImageUrl,
    movieDebutYear: movieRow.movieDebutYear,
    updatedAt: movieRow.updatedAt ?? new Date(),
    memberId: movieRow.memberId,
    familyId: movieRow.familyId,
    submitterName: memberNameById.get(movieRow.memberId) ?? `Member #${movieRow.memberId}`,
    commentCount: movieComments.length,
    noRatingCount,
    thumbsUpCount,
    loveCount,
    likedByMember: Boolean(viewerLike && viewerLike.likenessDegree !== -1),
    likenessDegree: viewerLike?.likenessDegree ?? null,
    selectedTagIds: tagIdsByMovieId.get(movieId) ?? [],
    tagNamesByType: tagNamesByTypeByMovieId.get(movieId) ?? {},
    movieComments,
  };
}

export async function getMovieById(
  familyId: number,
  movieId: number,
  viewerMemberId?: number
): Promise<{ success: false; message: string } | { success: true; movie: MovieRecord }> {
  const movies = await loadMovies(familyId, viewerMemberId);
  const selectedMovie = movies.find((movieRecord) => movieRecord.id === movieId);

  if (!selectedMovie) {
    return {
      success: false,
      message: `No movie was found for id: ${movieId}`,
    };
  }

  return {
    success: true,
    movie: selectedMovie,
  };
}

export async function getMoviesHomePageData(
  familyId: number,
  memberId: number,
  isAdmin = false
): Promise<MovieHomePageDataReturn> {
  try {
    const [movies, movieTags, movieTemplates] = await Promise.all([
      loadMovies(familyId, memberId),
      loadMovieTagOptions(),
      loadMovieTemplates(familyId, memberId, {
        includeDraft: false,
        includeGlobal: true,
        ensureGlobalTemplate: isAdmin,
      }),
    ]);

    return {
      success: true,
      movies,
      movieTags,
      movieTemplates,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error loading movie home page data",
    };
  }
}

export async function getMovieTemplateManagementData(
  familyId: number,
  memberId: number,
  isAdmin: boolean
): Promise<MovieTemplateManagementDataReturn> {
  try {
    const templates = await loadMovieTemplateManagementRecords(familyId, memberId, isAdmin);

    return {
      success: true,
      templates,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error loading movie templates",
    };
  }
}

export async function saveMovie(
  input: SaveMovieInput,
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<SaveMovieReturn> {
  const normalizedTitle = input.movieTitle.trim();

  if (!normalizedTitle) {
    return {
      success: false,
      message: "Movie title is required.",
    };
  }

  const sanitizedTagIds = [...new Set(input.selectedTagIds)].filter((tagId) => Number.isInteger(tagId) && tagId > 0);
  const existingMovie = input.id
    ? await db
      .select()
      .from(movie)
      .where(and(eq(movie.id, input.id), eq(movie.familyId, actor.familyId)))
      .then((rows) => rows[0] ?? null)
    : null;

  if (input.id && !existingMovie) {
    return {
      success: false,
      message: `No movie was found for id: ${input.id}`,
    };
  }

  if (existingMovie && existingMovie.memberId !== actor.memberId) {
    return {
      success: false,
      message: "Only the member who created this movie can edit it.",
    };
  }

  const templates = await loadMovieTemplates(actor.familyId, actor.memberId, {
    includeDraft: true,
    includeGlobal: true,
    ensureGlobalTemplate: true,
  });

  const selectedTemplate = templates.find((template) => template.id === input.templateId);

  if (!selectedTemplate) {
    return {
      success: false,
      message: "A movie template must be selected.",
    };
  }

  const normalizedMovieJson = input.movieJson?.trim();
  const parsedMovieJson = normalizedMovieJson ? parseSerializedTipTapDocument(normalizedMovieJson) : null;
  const movieJsonToStore = parsedMovieJson?.success
    ? normalizedMovieJson
    : selectedTemplate.templateJson || serializeTipTapDocument(createEmptyTipTapDocument());

  try {
    const [persistedMovie] = input.id
      ? await db
        .update(movie)
        .set({
          movieTitle: normalizedTitle,
          movieCaption: input.movieCaption,
          movieJson: movieJsonToStore,
          status: input.status,
          movieImageUrl: input.movieImageUrl ?? null,
          movieDebutYear: input.movieDebutYear,
          updatedAt: new Date(),
        })
        .where(and(eq(movie.id, input.id), eq(movie.familyId, actor.familyId)))
        .returning()
      : await db
        .insert(movie)
        .values({
          movieTitle: normalizedTitle,
          movieCaption: input.movieCaption,
          movieJson: movieJsonToStore,
          status: input.status,
          movieImageUrl: input.movieImageUrl ?? null,
          movieDebutYear: input.movieDebutYear,
          memberId: actor.memberId,
          familyId: actor.familyId,
        })
        .returning();

    if (!persistedMovie) {
      return {
        success: false,
        message: "Could not save movie.",
      };
    }

    await db.delete(movieTag).where(eq(movieTag.movieId, persistedMovie.id));

    if (sanitizedTagIds.length > 0) {
      await db.insert(movieTag).values(
        sanitizedTagIds.map((tagId) => ({
          movieId: persistedMovie.id,
          tagId,
        }))
      );
    }

    const movies = await loadMovies(actor.familyId, actor.memberId);
    const savedMovie = movies.find((movieRecord) => movieRecord.id === persistedMovie.id);

    if (!savedMovie) {
      return {
        success: false,
        message: "Movie was saved but could not be reloaded.",
      };
    }

    return {
      success: true,
      movie: savedMovie,
      message: input.id ? "Movie updated." : "Movie added.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error saving movie",
    };
  }
}

export async function saveMovieTemplate(
  input: SaveMovieTemplateInput,
  actor: {
    familyId: number;
    memberId: number;
    isAdmin: boolean;
  }
): Promise<SaveMovieTemplateReturn> {
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
      .from(movieTemplate)
      .where(and(eq(movieTemplate.id, input.id), eq(movieTemplate.familyId, actor.familyId)))
      .then((rows) => rows[0] ?? null)
    : null;

  if (input.id && !existingTemplate) {
    return {
      success: false,
      message: `No movie template was found for id: ${input.id}`,
    };
  }

  if (existingTemplate) {
    const canEditExisting = existingTemplate.isGlobalTemplate
      ? actor.isAdmin
      : existingTemplate.memberId === actor.memberId;

    if (!canEditExisting) {
      return {
        success: false,
        message: "You cannot edit this movie template.",
      };
    }
  }

  try {
    const [persistedTemplate] = input.id
      ? await db
        .update(movieTemplate)
        .set({
          templateName: normalizedName,
          status: normalizedStatus,
          templateJson: normalizedJson,
          updatedAt: new Date(),
        })
        .where(and(eq(movieTemplate.id, input.id), eq(movieTemplate.familyId, actor.familyId)))
        .returning()
      : await db
        .insert(movieTemplate)
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
        message: "Could not save movie template.",
      };
    }

    const templates = await loadMovieTemplateManagementRecords(actor.familyId, actor.memberId, actor.isAdmin);
    const savedTemplate = templates.find((template) => template.id === persistedTemplate.id);

    if (!savedTemplate) {
      return {
        success: false,
        message: "Movie template was saved but could not be reloaded.",
      };
    }

    return {
      success: true,
      template: savedTemplate,
      message: input.id ? "Movie template updated." : "Movie template added.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error saving movie template",
    };
  }
}

export async function getMovieDetail(
  familyId: number,
  movieId: number,
  viewerMemberId?: number
): Promise<GetMovieDetailReturn> {
  try {
    const selectedMovie = await loadMovieDetail(familyId, movieId, viewerMemberId);

    if (!selectedMovie) {
      return {
        success: false,
        message: `No movie was found for id: ${movieId}`,
      };
    }

    return {
      success: true,
      movie: selectedMovie,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error loading movie detail",
    };
  }
}

export async function toggleMovieLike(
  movieId: number,
  likenessDegree: number,
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<ToggleMovieLikeReturn> {
  if (![-1, 1, 2].includes(likenessDegree)) {
    return {
      success: false,
      message: "Movie reactions must be thumbs down, thumbs up, or love.",
    };
  }

  const selectedMovie = await loadMovieDetail(actor.familyId, movieId, actor.memberId);

  if (!selectedMovie) {
    return {
      success: false,
      message: `No movie was found for id: ${movieId}`,
    };
  }

  if (selectedMovie.memberId === actor.memberId) {
    return {
      success: false,
      message: "You cannot react to your own movie.",
    };
  }

  try {
    await db.delete(movieLike).where(and(eq(movieLike.movieId, movieId), eq(movieLike.memberId, actor.memberId)));
    await db.insert(movieLike).values({
      movieId,
      memberId: actor.memberId,
      likenessDegree,
      updatedAt: new Date(),
    });

    const updatedMovie = await loadMovieDetail(actor.familyId, movieId, actor.memberId);

    if (!updatedMovie) {
      return {
        success: false,
        message: "Movie reaction was saved but the movie could not be reloaded.",
      };
    }

    return {
      success: true,
      movie: updatedMovie,
      message: likenessDegree === -1 ? "Thumbs down saved." : likenessDegree === 1 ? "Thumbs up saved." : "Love saved.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error saving movie reaction",
    };
  }
}

export async function addMovieComment(
  movieId: number,
  commentText: string,
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<AddMovieCommentReturn> {
  const normalizedComment = commentText.trim();

  if (!normalizedComment) {
    return {
      success: false,
      message: "Comment text is required.",
    };
  }

  const selectedMovie = await loadMovieDetail(actor.familyId, movieId, actor.memberId);

  if (!selectedMovie) {
    return {
      success: false,
      message: `No movie was found for id: ${movieId}`,
    };
  }

  try {
    await db.insert(movieComment).values({
      movieId,
      memberId: actor.memberId,
      commentJson: normalizedComment,
      createdAt: new Date(),
    });

    const updatedMovie = await loadMovieDetail(actor.familyId, movieId, actor.memberId);

    if (!updatedMovie) {
      return {
        success: false,
        message: "Movie comment was saved but the movie could not be reloaded.",
      };
    }

    return {
      success: true,
      movie: updatedMovie,
      message: "Movie comment added.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error saving movie comment",
    };
  }
}