import db from '@/components/db/drizzle';
import { and, asc, eq, ilike, inArray, ne } from 'drizzle-orm';
import { member, poemComment, poem, poemTag, poemLike, poemTagReference, poemTerm, poemVerse } from "../schema/family-social-schema-tables";
import {
  createTextTipTapDocument,
  isTipTapDocumentEmpty,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from '../types/poem-term-validation';
import {
  AddPoemCommentReturn,
  GetPoemTermReturn,
  Poem,
  PoemsReturn,
  PoetryHomePageDataReturn,
  PoetryHomePoem,
  PoemTagOptionsReturn,
  PoemTermsReturn,
  TogglePoemLikeReturn,
  SavePoetryHomePoemInput,
  SavePoetryHomePoemReturn,
  SavePoemTermInput,
  SavePoemTermReturn,
} from '../types/poem-verses';

function createSubmitterName(firstName?: string | null, lastName?: string | null) {
  const names = [firstName, lastName].filter(Boolean);

  if (names.length > 0) {
    return names.join(' ');
  }

  return 'Unknown Member';
}

function extractTipTapText(content: unknown): string {
  const parsed = tipTapTextFromNode(content);

  return parsed.replace(/\s+/g, ' ').trim();
}

function tipTapTextFromNode(node: unknown): string {
  if (!node || typeof node !== 'object') {
    return '';
  }

  const candidate = node as {
    text?: string;
    content?: unknown[];
  };

  let text = '';

  if (typeof candidate.text === 'string') {
    text += candidate.text;
  }

  if (Array.isArray(candidate.content)) {
    text += candidate.content.map((childNode) => tipTapTextFromNode(childNode)).join(' ');
  }

  return text;
}

async function loadPoetryHomePoems(
  familyId: number,
  poemIds?: number[],
  viewerMemberId?: number
): Promise<PoetryHomePoem[]> {
  const whereClause = poemIds && poemIds.length > 0
    ? and(eq(poem.familyId, familyId), inArray(poem.id, poemIds))
    : eq(poem.familyId, familyId);

  const poemFactRows = await db
    .select()
    .from(poem)
    .where(whereClause)
    .orderBy(asc(poem.poemTitle));

  if (!poemFactRows || poemFactRows.length === 0) {
    return [];
  }

  const poemFactIds = poemFactRows.map((row) => row.id);
  const memberIds = [...new Set(poemFactRows.map((row) => row.memberId))];

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

  const verseRows = await db
    .select()
    .from(poemVerse)
    .where(inArray(poemVerse.poemId, poemFactIds));

  const verseIds = verseRows.map((row) => row.id);
  const commentRows = verseIds.length > 0
    ? await db
      .select()
      .from(poemComment)
      .where(inArray(poemComment.poemVerseId, verseIds))
      .orderBy(asc(poemComment.createdAt))
    : [];

  const likeRows = await db
    .select({
      poemId: poemLike.poemId,
      memberId: poemLike.memberId,
    })
    .from(poemLike)
    .where(inArray(poemLike.poemId, poemFactIds));

  const factTagRows = await db
    .select()
    .from(poemTag)
    .where(inArray(poemTag.poemId, poemFactIds));

  const memberNameById = new Map(
    memberRows.map((row) => [row.id, createSubmitterName(row.firstName, row.lastName)])
  );
  const verseByPoemId = new Map(verseRows.map((row) => [row.poemId, row]));
  const commentsByVerseId = new Map<number, typeof commentRows>();

  for (const commentRow of commentRows) {
    const existingRows = commentsByVerseId.get(commentRow.poemVerseId) ?? [];
    existingRows.push(commentRow);
    commentsByVerseId.set(commentRow.poemVerseId, existingRows);
  }

  const tagIdsByPoemId = new Map<number, number[]>();
  const likesByPoemId = new Map<number, number>();
  const likedPoemIdsByViewer = new Set<number>();

  for (const factTagRow of factTagRows) {
    const existingTagIds = tagIdsByPoemId.get(factTagRow.poemId) ?? [];
    existingTagIds.push(factTagRow.tagId);
    tagIdsByPoemId.set(factTagRow.poemId, existingTagIds);
  }

  for (const likeRow of likeRows) {
    likesByPoemId.set(likeRow.poemId, (likesByPoemId.get(likeRow.poemId) ?? 0) + 1);

    if (viewerMemberId && likeRow.memberId === viewerMemberId) {
      likedPoemIdsByViewer.add(likeRow.poemId);
    }
  }

  return poemFactRows.map((row) => {
    const verseRow = verseByPoemId.get(row.id);
    const verseComments = verseRow ? commentsByVerseId.get(verseRow.id) ?? [] : [];
    const analysisComment = verseComments.find((commentRow) => commentRow.isPoemAnalysis);
    const submissionComments = verseComments.filter((commentRow) => !commentRow.isPoemAnalysis);
    const poemComments = submissionComments.map((commentRow) => {
      const parsedComment = parseSerializedTipTapDocument(commentRow.commentJson);

      return {
        id: commentRow.id,
        createdAt: commentRow.createdAt as Date,
        text: parsedComment.success
          ? extractTipTapText(parsedComment.content)
          : '',
      };
    });

    return {
      id: row.id,
      poemTitle: row.poemTitle,
      poetName: row.poetName,
      poemSource: row.poemSource,
      poemYear: row.poemYear,
      status: row.status,
      createdAt: row.createdAt as Date,
      memberId: row.memberId,
      familyId: row.familyId,
      submitterName: memberNameById.get(row.memberId) ?? `Member #${ row.memberId }`,
      likesCount: likesByPoemId.get(row.id) ?? 0,
      commentCount: submissionComments.length,
      likedByMember: likedPoemIdsByViewer.has(row.id),
      verseJson: verseRow?.verseJson,
      analysisJson: analysisComment?.commentJson,
      selectedTagIds: tagIdsByPoemId.get(row.id) ?? [],
      poemComments,
    };
  });
}

/*-------- findFamilyMember ------------------ */
export async function getAllFamilyPoems(familyId: number)
: Promise<PoemsReturn> {
  const result = await db
    .select()
    .from(poem).orderBy(asc(poem.poemTitle))
    .where(eq(poem.familyId, familyId)
    );
  if (!result) {
    return {
      success: false,
      message: "Error accessing poems for familyId: " + familyId,
    };
  };
    
  // console.log('queries-poetry-cafe->getAllFamilyPoems->result.length: ',result.length);
  if (result.length === 0) {
    return {
      success: false,
      message: "No poems found for familyId: " + familyId,
    }; 
  };

  const poems: Poem[] = result.map((row) => ({
    id: row.id,
    poemTitle: row.poemTitle,
    poetName: row.poetName,
    poemSource: row.poemSource,
    poemYear: row.poemYear,
    status: row.status,
    createdAt: row.createdAt as Date,
    memberId: row.memberId,
    familyId: row.familyId,
  }));

  console.log('queries-poetry-cafe->getAllFamilyPoems->poems.length: ',poems.length);

  return {
    success: true,
    poems: poems,
    }
  };

export async function getPoetryHomePageData(familyId: number, memberId?: number)
  : Promise<PoetryHomePageDataReturn> {
  try {
    const [poems, poemTagsResult] = await Promise.all([
      loadPoetryHomePoems(familyId, undefined, memberId),
      getPoemTagReferences(),
    ]);

    return {
      success: true,
      poems,
      poemTags: poemTagsResult.success ? poemTagsResult.poemTags : [],
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error loading poetry home page data',
    };
  }
}

export async function getPoemTagReferences()
  : Promise<PoemTagOptionsReturn> {
  const result = await db
    .select({
      id: poemTagReference.id,
      tagName: poemTagReference.tagName,
      tagDesc: poemTagReference.tagDesc,
      status: poemTagReference.status,
    })
    .from(poemTagReference)
    .orderBy(asc(poemTagReference.seqNo), asc(poemTagReference.tagName));

  if (!result) {
    return {
      success: false,
      message: "Error accessing poem tag references",
    };
  }

  return {
    success: true,
    poemTags: result,
  };
}

export async function savePoetryHomePoem(
  input: SavePoetryHomePoemInput,
  actor: {
    familyId: number;
    memberId: number;
    isAdmin?: boolean;
  }
): Promise<SavePoetryHomePoemReturn> {
  const normalizedTitle = input.poemTitle.trim();
  const normalizedPoetName = input.poetName.trim();
  const normalizedSource = input.poemSource.trim() || 'Unknown';
  const uniqueTagIds = [...new Set(input.selectedTagIds)].slice(0, 3);
  const parsedVerseJson = parseSerializedTipTapDocument(input.verseJson.trim());
  const parsedAnalysisJson = parseSerializedTipTapDocument(input.analysisJson.trim());

  if (!normalizedTitle) {
    return {
      success: false,
      message: 'Enter a poem name before saving.',
    };
  }

  if (!normalizedPoetName) {
    return {
      success: false,
      message: 'Enter a poet name before saving.',
    };
  }

  if (!Number.isInteger(input.poemYear) || input.poemYear < 1 || input.poemYear > 9999) {
    return {
      success: false,
      message: 'Enter a valid poem year before saving.',
    };
  }

  if (!parsedVerseJson.success) {
    return {
      success: false,
      message: parsedVerseJson.message,
    };
  }

  if (isTipTapDocumentEmpty(parsedVerseJson.content)) {
    return {
      success: false,
      message: 'Enter the poem verse before saving.',
    };
  }

  if (!parsedAnalysisJson.success) {
    return {
      success: false,
      message: parsedAnalysisJson.message,
    };
  }

  if (uniqueTagIds.length > 0) {
    const validTags = await db
      .select({ id: poemTagReference.id })
      .from(poemTagReference)
      .where(inArray(poemTagReference.id, uniqueTagIds));

    if (validTags.length !== uniqueTagIds.length) {
      return {
        success: false,
        message: 'One or more selected poem tags are invalid.',
      };
    }
  }

  const existingPoem = input.id
    ? await db
      .select()
      .from(poem)
      .where(and(eq(poem.id, input.id), eq(poem.familyId, actor.familyId)))
      .then((rows) => rows[0] ?? null)
    : null;

  if (input.id && !existingPoem) {
    return {
      success: false,
      message: `No poem was found for id: ${ input.id }`,
    };
  }

  if (existingPoem && !actor.isAdmin && existingPoem.memberId !== actor.memberId) {
    return {
      success: false,
      message: 'Only the poem submitter or an admin can save changes to this poem.',
    };
  }

  const existingVerse = existingPoem
    ? await db
      .select()
      .from(poemVerse)
      .where(eq(poemVerse.poemId, existingPoem.id))
      .then((rows) => rows[0] ?? null)
    : null;

  const existingAnalysis = existingVerse
    ? await db
      .select()
      .from(poemComment)
      .where(and(eq(poemComment.poemVerseId, existingVerse.id), eq(poemComment.isPoemAnalysis, true)))
      .then((rows) => rows[0] ?? null)
    : null;

  const existingFactTags = existingPoem
    ? await db
      .select()
      .from(poemTag)
      .where(eq(poemTag.poemId, existingPoem.id))
    : [];

  const isAnalysisEmpty = isTipTapDocumentEmpty(parsedAnalysisJson.content);
  const serializedVerseJson = serializeTipTapDocument(parsedVerseJson.content);
  const serializedAnalysisJson = serializeTipTapDocument(parsedAnalysisJson.content);

  const poemPayload = {
    poemTitle: normalizedTitle,
    poetName: normalizedPoetName,
    poemSource: normalizedSource,
    poemYear: input.poemYear,
    status: input.status.trim() || 'draft',
    memberId: existingPoem?.memberId ?? actor.memberId,
    familyId: actor.familyId,
  };
  let savedPoemId: number;
  let createdPoemFactId: number | null = null;
  let createdVerseId: number | null = null;
  let createdAnalysisId: number | null = null;
  let replacedTags = false;

  try {
    const savedPoemFact = existingPoem
      ? await db
        .update(poem)
        .set(poemPayload)
        .where(eq(poem.id, existingPoem.id))
        .returning()
        .then((rows) => rows[0])
      : await db
        .insert(poem)
        .values(poemPayload)
        .returning()
        .then((rows) => rows[0]);

    if (!existingPoem) {
      createdPoemFactId = savedPoemFact.id;
    }

    const savedVerse = existingVerse
      ? await db
        .update(poemVerse)
        .set({ verseJson: serializedVerseJson })
        .where(eq(poemVerse.id, existingVerse.id))
        .returning()
        .then((rows) => rows[0])
      : await db
        .insert(poemVerse)
        .values({
          poemId: savedPoemFact.id,
          verseJson: serializedVerseJson,
        })
        .returning()
        .then((rows) => rows[0]);

    if (!existingVerse) {
      createdVerseId = savedVerse.id;
    }

    if (isAnalysisEmpty) {
      if (existingAnalysis) {
        await db
          .delete(poemComment)
          .where(eq(poemComment.id, existingAnalysis.id));
      }
    } else if (existingAnalysis) {
      await db
        .update(poemComment)
        .set({ commentJson: serializedAnalysisJson })
        .where(eq(poemComment.id, existingAnalysis.id));
    } else {
      const createdAnalysis = await db
        .insert(poemComment)
        .values({
          poemVerseId: savedVerse.id,
          isPoemAnalysis: true,
          commentJson: serializedAnalysisJson,
        })
        .returning()
        .then((rows) => rows[0]);

      createdAnalysisId = createdAnalysis.id;
    }

    await db
      .delete(poemTag)
      .where(eq(poemTag.poemId, savedPoemFact.id));
    replacedTags = true;

    if (uniqueTagIds.length > 0) {
      await db
        .insert(poemTag)
        .values(uniqueTagIds.map((tagId) => ({
          poemId: savedPoemFact.id,
          tagId,
        })));
    }

    savedPoemId = savedPoemFact.id;
  } catch (error) {
    if (createdPoemFactId) {
      try {
        await db
          .delete(poem)
          .where(eq(poem.id, createdPoemFactId));
      } catch {
        // Best-effort cleanup only.
      }
    } else {
      if (replacedTags && existingPoem) {
        try {
          await db
            .delete(poemTag)
            .where(eq(poemTag.poemId, existingPoem.id));

          if (existingFactTags.length > 0) {
            await db
              .insert(poemTag)
              .values(existingFactTags.map((factTag) => ({
                poemId: existingPoem.id,
                tagId: factTag.tagId,
              })));
          }
        } catch {
          // Best-effort cleanup only.
        }
      }

      if (createdAnalysisId) {
        try {
          await db
            .delete(poemComment)
            .where(eq(poemComment.id, createdAnalysisId));
        } catch {
          // Best-effort cleanup only.
        }
      } else if (existingVerse && existingAnalysis) {
        try {
          const currentAnalysis = await db
            .select()
            .from(poemComment)
            .where(and(eq(poemComment.poemVerseId, existingVerse.id), eq(poemComment.isPoemAnalysis, true)))
            .then((rows) => rows[0] ?? null);

          if (!currentAnalysis) {
            await db
              .insert(poemComment)
              .values({
                poemVerseId: existingVerse.id,
                isPoemAnalysis: true,
                commentJson: existingAnalysis.commentJson,
              });
          } else {
            await db
              .update(poemComment)
              .set({ commentJson: existingAnalysis.commentJson })
              .where(eq(poemComment.id, currentAnalysis.id));
          }
        } catch {
          // Best-effort cleanup only.
        }
      }

      if (createdVerseId) {
        try {
          await db
            .delete(poemVerse)
            .where(eq(poemVerse.id, createdVerseId));
        } catch {
          // Best-effort cleanup only.
        }
      } else if (existingVerse) {
        try {
          await db
            .update(poemVerse)
            .set({ verseJson: existingVerse.verseJson })
            .where(eq(poemVerse.id, existingVerse.id));
        } catch {
          // Best-effort cleanup only.
        }
      }

      if (existingPoem) {
        try {
          await db
            .update(poem)
            .set({
              poemTitle: existingPoem.poemTitle,
              poetName: existingPoem.poetName,
              poemSource: existingPoem.poemSource,
              poemYear: existingPoem.poemYear,
              status: existingPoem.status,
              memberId: existingPoem.memberId,
              familyId: existingPoem.familyId,
            })
            .where(eq(poem.id, existingPoem.id));
        } catch {
          // Best-effort cleanup only.
        }
      }
    }

    return {
      success: false,
      message: error instanceof Error
        ? `Failed to save poem changes. Best-effort cleanup was attempted: ${ error.message }`
        : 'Failed to save poem changes. Best-effort cleanup was attempted.',
    };
  }

  const [savedPoem] = await loadPoetryHomePoems(actor.familyId, [savedPoemId]);

  if (!savedPoem) {
    return {
      success: false,
      message: 'The poem was saved but could not be reloaded.',
    };
  }

  return {
    success: true,
    poem: savedPoem,
    message: `Poem "${ savedPoem.poemTitle }" saved successfully.`,
  };
}

export async function togglePoemLike(
  poemId: number,
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<TogglePoemLikeReturn> {
  const existingPoem = await db
    .select()
    .from(poem)
    .where(and(eq(poem.id, poemId), eq(poem.familyId, actor.familyId)))
    .then((rows) => rows[0] ?? null);

  if (!existingPoem) {
    return {
      success: false,
      message: 'The selected poem could not be found.',
    };
  }

  const existingLike = await db
    .select()
    .from(poemLike)
    .where(and(eq(poemLike.poemId, poemId), eq(poemLike.memberId, actor.memberId)))
    .then((rows) => rows[0] ?? null);

  if (existingLike) {
    await db
      .delete(poemLike)
      .where(eq(poemLike.id, existingLike.id));
  } else {
    await db
      .insert(poemLike)
      .values({
        poemId: poemId,
        memberId: actor.memberId,
      });
  }

  const [updatedPoem] = await loadPoetryHomePoems(actor.familyId, [poemId], actor.memberId);

  if (!updatedPoem) {
    return {
      success: false,
      message: 'Like was updated but the poem could not be reloaded.',
    };
  }

  return {
    success: true,
    poem: updatedPoem,
    message: existingLike
      ? `You removed your like from "${ updatedPoem.poemTitle }".`
      : `You liked "${ updatedPoem.poemTitle }".`,
  };
}

export async function addPoemComment(
  poemId: number,
  commentText: string,
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<AddPoemCommentReturn> {
  const normalizedComment = commentText.trim();

  if (normalizedComment.length < 2) {
    return {
      success: false,
      message: 'Enter at least 2 characters before posting a comment.',
    };
  }

  const existingPoem = await db
    .select()
    .from(poem)
    .where(and(eq(poem.id, poemId), eq(poem.familyId, actor.familyId)))
    .then((rows) => rows[0] ?? null);

  if (!existingPoem) {
    return {
      success: false,
      message: 'The selected poem could not be found.',
    };
  }

  const existingVerse = await db
    .select()
    .from(poemVerse)
    .where(eq(poemVerse.poemId, poemId))
    .then((rows) => rows[0] ?? null);

  if (!existingVerse) {
    return {
      success: false,
      message: 'The selected poem has no saved verse to comment on yet.',
    };
  }

  const commentJson = serializeTipTapDocument(createTextTipTapDocument(normalizedComment));

  await db
    .insert(poemComment)
    .values({
      poemVerseId: existingVerse.id,
      isPoemAnalysis: false,
      commentJson,
    });

  const [updatedPoem] = await loadPoetryHomePoems(actor.familyId, [poemId], actor.memberId);

  if (!updatedPoem) {
    return {
      success: false,
      message: 'Comment was saved but the poem could not be reloaded.',
    };
  }

  return {
    success: true,
    poem: updatedPoem,
    message: `Your comment was added to "${ updatedPoem.poemTitle }".`,
  };
}

/*-------- findFamilyMember ------------------ */
export async function getPoemTerms()
  : Promise<PoemTermsReturn> {
  const result = await db
    .select()
      .from(poemTerm)
      .orderBy(asc(poemTerm.term));

  if (!result) {
    return {
      success: false,
      message: "Error accessing poem terms",
    };
  };
    
  console.log('queries-poetry-cafe->getPoemTerms->result.length: ',result.length);
  
  if (result.length === 0) {
    return {
      success: false,
      message: "No poem terms found",
    }; 
  };

  const poemTerms = result.map((row) => ({
    id: row.id,
    term: row.term,
    termJson: row.termJson,
    status: row.status,
    createdAt: row.createdAt as Date,
  }));

  console.log('queries-poetry-cafe->getPoemTerms->poemTerms.length: ',poemTerms.length);

  return {
    success: true,
    poemTerms: poemTerms,
    }
  };

export async function getPoemTermById(id: number)
  : Promise<GetPoemTermReturn> {
  const [result] = await db
    .select()
    .from(poemTerm)
    .where(eq(poemTerm.id, id));

  if (!result) {
    return {
      success: false,
      message: `No poem term found for id: ${id}`,
    };
  }

  return {
    success: true,
    poemTerm: {
      id: result.id,
      term: result.term,
      termJson: result.termJson,
      status: result.status,
      createdAt: result.createdAt as Date,
    },
  };
}

export async function savePoemTerm(input: SavePoemTermInput)
  : Promise<SavePoemTermReturn> {
  const parsedTermJson = parseSerializedTipTapDocument(input.termJson.trim());

  if (!parsedTermJson.success) {
    return {
      success: false,
      message: parsedTermJson.message,
    };
  }

  const termPayload = {
    term: input.term.trim(),
    termJson: serializeTipTapDocument(parsedTermJson.content),
    status: input.status.trim(),
  };

  const duplicateConditions = input.id
    ? and(ilike(poemTerm.term, termPayload.term), ne(poemTerm.id, input.id))
    : ilike(poemTerm.term, termPayload.term);

  const [existingTerm] = await db
    .select({ id: poemTerm.id })
    .from(poemTerm)
    .where(duplicateConditions)
    .limit(1);

  if (existingTerm) {
    return {
      success: false,
      message: `A term named "${ termPayload.term }" already exists. Term names must be unique.`,
    };
  }

  if (input.id) {
    const [result] = await db
      .update(poemTerm)
      .set(termPayload)
      .where(eq(poemTerm.id, input.id))
      .returning();

    if (!result) {
      return {
        success: false,
        message: `Failed to update poem term with id: ${input.id}`,
      };
    }

    return {
      success: true,
      poemTerm: {
        id: result.id,
        term: result.term,
        termJson: result.termJson,
        status: result.status,
        createdAt: result.createdAt as Date,
      },
    };
  }

  const [result] = await db
    .insert(poemTerm)
    .values(termPayload)
    .returning();

  if (!result) {
    return {
      success: false,
      message: 'Failed to create poem term',
    };
  }

  return {
    success: true,
    poemTerm: {
      id: result.id,
      term: result.term,
      termJson: result.termJson,
      status: result.status,
      createdAt: result.createdAt as Date,
    },
  };
}
