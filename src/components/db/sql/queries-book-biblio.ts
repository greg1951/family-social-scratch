import { and, asc, desc, eq, ilike, inArray, or } from 'drizzle-orm';

import db from '@/components/db/drizzle';
import {
  book,
  bookBiblio,
  bookBiblioTag,
  member,
} from '../schema/family-social-schema-tables';
import { bookCategoryTagReference } from '../schema/global-schema-tables';
import type {
  BiblioEntry,
  BiblioMemberOptionsReturn,
  BookReviewPrefill,
  DeleteBiblioEntryReturn,
  MemberBiblioPageDataReturn,
  SaveBiblioEntryInput,
  SaveBiblioEntryReturn,
  SearchFamilyBibliosReturn,
} from '../types/book-biblio';
import {
  createEmptyTipTapDocument,
  isTipTapDocumentEmpty,
  normalizeSerializedTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from '../types/poem-term-validation';
import { getBookTagReferences } from './queries-book-besties';
import { logDbQueryError } from './db-error-logger';

const BIBLIO_STATUS_VALUES = new Set(['public', 'private', 'draft']);

/** Entries owned by someone else are only visible once the owner marks them public. */
function buildVisibilityFilter(ownerMemberId: number, viewerMemberId: number) {
  if (ownerMemberId === viewerMemberId) {
    return eq(bookBiblio.memberId, ownerMemberId);
  }

  return and(eq(bookBiblio.memberId, ownerMemberId), eq(bookBiblio.status, 'public'));
}

async function decorateBiblioRows(
  familyId: number,
  rows: Array<{
    id: number;
    bookTitle: string;
    authorName: string;
    bookSeriesName: string | null;
    publishedYear: number;
    readYear: number;
    rating: number;
    status: string;
    summaryJson: string;
    commentsJson: string;
    updatedAt: Date | null;
    memberId: number;
    familyId: number;
  }>
): Promise<BiblioEntry[]> {
  if (rows.length === 0) {
    return [];
  }

  const biblioIds = rows.map((row) => row.id);
  const memberIds = [...new Set(rows.map((row) => row.memberId))];

  const [tagRows, memberRows, bookRows] = await Promise.all([
    db
      .select({
        biblioId: bookBiblioTag.biblioId,
        tagId: bookBiblioTag.tagId,
        tagName: bookCategoryTagReference.tagName,
      })
      .from(bookBiblioTag)
      .innerJoin(bookCategoryTagReference, eq(bookBiblioTag.tagId, bookCategoryTagReference.id))
      .where(inArray(bookBiblioTag.biblioId, biblioIds)),
    db
      .select({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      })
      .from(member)
      .where(inArray(member.id, memberIds)),
    db
      .select({ bookTitle: book.bookTitle })
      .from(book)
      .where(eq(book.familyId, familyId)),
  ]);

  const memberById = new Map(memberRows.map((row) => [row.id, row]));
  const postedTitles = new Set(bookRows.map((row) => row.bookTitle.trim().toLowerCase()));
  const tagsByBiblioId = new Map<number, Array<{ tagId: number; tagName: string }>>();

  for (const tagRow of tagRows) {
    const existing = tagsByBiblioId.get(tagRow.biblioId) ?? [];
    existing.push({ tagId: tagRow.tagId, tagName: tagRow.tagName });
    tagsByBiblioId.set(tagRow.biblioId, existing);
  }

  return rows.map((row) => {
    const tags = (tagsByBiblioId.get(row.id) ?? [])
      .sort((leftTag, rightTag) => leftTag.tagName.localeCompare(rightTag.tagName));
    const owner = memberById.get(row.memberId);

    return {
      id: row.id,
      bookTitle: row.bookTitle,
      authorName: row.authorName,
      bookSeriesName: row.bookSeriesName,
      publishedYear: row.publishedYear,
      readYear: row.readYear,
      rating: row.rating,
      status: row.status,
      summaryJson: normalizeSerializedTipTapDocument(row.summaryJson),
      commentsJson: normalizeSerializedTipTapDocument(row.commentsJson),
      updatedAt: row.updatedAt,
      memberId: row.memberId,
      familyId: row.familyId,
      memberFirstName: owner?.firstName ?? '',
      memberLastName: owner?.lastName ?? '',
      selectedTagIds: tags.map((tag) => tag.tagId),
      tagNames: tags.map((tag) => tag.tagName),
      hasBookPost: postedTitles.has(row.bookTitle.trim().toLowerCase()),
    };
  });
}

export async function getMemberBiblioPageData(
  familyId: number,
  ownerMemberId: number,
  viewerMemberId: number
): Promise<MemberBiblioPageDataReturn> {
  try {
    const owner = await db
      .select({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      })
      .from(member)
      .where(and(eq(member.id, ownerMemberId), eq(member.familyId, familyId)))
      .then((rows) => rows[0] ?? null);

    if (!owner) {
      return {
        success: false,
        message: 'That family member could not be found.',
      };
    }

    const rows = await db
      .select()
      .from(bookBiblio)
      .where(and(eq(bookBiblio.familyId, familyId), buildVisibilityFilter(ownerMemberId, viewerMemberId)))
      .orderBy(desc(bookBiblio.readYear), asc(bookBiblio.bookTitle));

    const [entries, bookTagsResult] = await Promise.all([
      decorateBiblioRows(familyId, rows),
      getBookTagReferences(),
    ]);

    return {
      success: true,
      entries,
      bookTags: bookTagsResult.success ? bookTagsResult.bookTags : [],
      ownerFirstName: owner.firstName,
      ownerLastName: owner.lastName,
      isOwner: ownerMemberId === viewerMemberId,
    };
  } catch (error) {
    logDbQueryError('bookBiblio.getMemberBiblioPageData', error, { familyId, ownerMemberId, viewerMemberId });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error loading the bibliography.',
    };
  }
}

export async function getFamilyBiblioMembers(
  familyId: number,
  excludeMemberId: number
): Promise<BiblioMemberOptionsReturn> {
  try {
    const rows = await db
      .select({
        memberId: bookBiblio.memberId,
        firstName: member.firstName,
        lastName: member.lastName,
      })
      .from(bookBiblio)
      .innerJoin(member, eq(bookBiblio.memberId, member.id))
      .where(and(eq(bookBiblio.familyId, familyId), eq(bookBiblio.status, 'public')));

    const countsByMemberId = new Map<number, { memberId: number; firstName: string; lastName: string; entryCount: number }>();

    for (const row of rows) {
      if (row.memberId === excludeMemberId) {
        continue;
      }

      const existing = countsByMemberId.get(row.memberId);

      if (existing) {
        existing.entryCount += 1;
        continue;
      }

      countsByMemberId.set(row.memberId, {
        memberId: row.memberId,
        firstName: row.firstName,
        lastName: row.lastName,
        entryCount: 1,
      });
    }

    return {
      success: true,
      members: [...countsByMemberId.values()].sort((leftMember, rightMember) => {
        const lastNameOrder = leftMember.lastName.localeCompare(rightMember.lastName);
        return lastNameOrder !== 0 ? lastNameOrder : leftMember.firstName.localeCompare(rightMember.firstName);
      }),
    };
  } catch (error) {
    logDbQueryError('bookBiblio.getFamilyBiblioMembers', error, { familyId, excludeMemberId });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error loading family bibliographies.',
    };
  }
}

export async function searchFamilyBiblios(
  familyId: number,
  searchText: string,
  viewerMemberId: number
): Promise<SearchFamilyBibliosReturn> {
  try {
    const normalizedSearch = searchText.trim();
    const matchPattern = `%${ normalizedSearch }%`;

    const searchFilter = normalizedSearch
      ? or(ilike(bookBiblio.bookTitle, matchPattern), ilike(bookBiblio.authorName, matchPattern))
      : undefined;

    const rows = await db
      .select()
      .from(bookBiblio)
      .where(and(
        eq(bookBiblio.familyId, familyId),
        or(eq(bookBiblio.status, 'public'), eq(bookBiblio.memberId, viewerMemberId)),
        searchFilter
      ))
      .orderBy(asc(bookBiblio.authorName), asc(bookBiblio.bookTitle));

    const [entries, bookTagsResult] = await Promise.all([
      decorateBiblioRows(familyId, rows),
      getBookTagReferences(),
    ]);

    return {
      success: true,
      entries,
      bookTags: bookTagsResult.success ? bookTagsResult.bookTags : [],
    };
  } catch (error) {
    logDbQueryError('bookBiblio.searchFamilyBiblios', error, { familyId, viewerMemberId });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error searching family bibliographies.',
    };
  }
}

export async function saveBiblioEntry(
  input: SaveBiblioEntryInput,
  actor: { familyId: number; memberId: number }
): Promise<SaveBiblioEntryReturn> {
  const normalizedTitle = input.bookTitle.trim();
  const normalizedAuthorName = input.authorName.trim();
  const normalizedSeriesName = (input.bookSeriesName ?? '').trim();
  const normalizedStatus = input.status.trim().toLowerCase();
  const uniqueTagIds = [...new Set(input.selectedTagIds)];

  if (!normalizedTitle) {
    return { success: false, message: 'Enter a book name before saving.' };
  }

  if (!normalizedAuthorName) {
    return { success: false, message: 'Enter an author name before saving.' };
  }

  if (!BIBLIO_STATUS_VALUES.has(normalizedStatus)) {
    return { success: false, message: 'Select a valid status before saving.' };
  }

  if (!Number.isInteger(input.publishedYear) || input.publishedYear < 0 || input.publishedYear > 9999) {
    return { success: false, message: 'Enter a valid published year before saving.' };
  }

  if (!Number.isInteger(input.rating) || input.rating < 0 || input.rating > 5) {
    return { success: false, message: 'Rating must be between 1 and 5.' };
  }

  if (!Number.isInteger(input.readYear) || input.readYear < 0 || input.readYear > 9999) {
    return { success: false, message: 'Enter a valid year read before saving.' };
  }

  const parsedSummary = parseSerializedTipTapDocument(input.summaryJson.trim());

  if (!parsedSummary.success) {
    return { success: false, message: parsedSummary.message };
  }

  const parsedComments = parseSerializedTipTapDocument(input.commentsJson.trim());

  if (!parsedComments.success) {
    return { success: false, message: parsedComments.message };
  }

  if (uniqueTagIds.length > 0) {
    const validTags = await db
      .select({ id: bookCategoryTagReference.id })
      .from(bookCategoryTagReference)
      .where(inArray(bookCategoryTagReference.id, uniqueTagIds));

    if (validTags.length !== uniqueTagIds.length) {
      return { success: false, message: 'One or more selected book tags are invalid.' };
    }
  }

  try {
    const existingEntry = input.id
      ? await db
        .select()
        .from(bookBiblio)
        .where(and(eq(bookBiblio.id, input.id), eq(bookBiblio.familyId, actor.familyId)))
        .then((rows) => rows[0] ?? null)
      : null;

    if (input.id && !existingEntry) {
      return { success: false, message: `No bibliography entry was found for id: ${ input.id }` };
    }

    if (existingEntry && existingEntry.memberId !== actor.memberId) {
      return { success: false, message: 'You can only change your own bibliography entries.' };
    }

    const entryValues = {
      bookTitle: normalizedTitle,
      authorName: normalizedAuthorName,
      bookSeriesName: normalizedSeriesName || null,
      publishedYear: input.publishedYear,
      readYear: input.readYear,
      rating: input.rating,
      status: normalizedStatus,
      summaryJson: serializeTipTapDocument(parsedSummary.content),
      commentsJson: serializeTipTapDocument(parsedComments.content),
      updatedAt: new Date(),
    };

    const savedEntry = existingEntry
      ? await db
        .update(bookBiblio)
        .set(entryValues)
        .where(eq(bookBiblio.id, existingEntry.id))
        .returning()
        .then((rows) => rows[0])
      : await db
        .insert(bookBiblio)
        .values({
          ...entryValues,
          familyId: actor.familyId,
          memberId: actor.memberId,
        })
        .returning()
        .then((rows) => rows[0]);

    await db.delete(bookBiblioTag).where(eq(bookBiblioTag.biblioId, savedEntry.id));

    if (uniqueTagIds.length > 0) {
      await db
        .insert(bookBiblioTag)
        .values(uniqueTagIds.map((tagId) => ({ biblioId: savedEntry.id, tagId })));
    }

    const [decoratedEntry] = await decorateBiblioRows(actor.familyId, [savedEntry]);

    return {
      success: true,
      entry: decoratedEntry,
      message: `"${ decoratedEntry.bookTitle }" was saved to your bibliography.`,
    };
  } catch (error) {
    logDbQueryError('bookBiblio.saveBiblioEntry', error, {
      inputId: input.id,
      familyId: actor.familyId,
      memberId: actor.memberId,
      status: normalizedStatus,
    });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save the bibliography entry.',
    };
  }
}

export async function deleteBiblioEntry(
  biblioId: number,
  actor: { familyId: number; memberId: number }
): Promise<DeleteBiblioEntryReturn> {
  try {
    const existingEntry = await db
      .select()
      .from(bookBiblio)
      .where(and(eq(bookBiblio.id, biblioId), eq(bookBiblio.familyId, actor.familyId)))
      .then((rows) => rows[0] ?? null);

    if (!existingEntry) {
      return { success: false, message: 'That bibliography entry could not be found.' };
    }

    if (existingEntry.memberId !== actor.memberId) {
      return { success: false, message: 'You can only delete your own bibliography entries.' };
    }

    await db.delete(bookBiblio).where(eq(bookBiblio.id, biblioId));

    return { success: true, message: `"${ existingEntry.bookTitle }" was removed from your bibliography.` };
  } catch (error) {
    logDbQueryError('bookBiblio.deleteBiblioEntry', error, {
      biblioId,
      familyId: actor.familyId,
      memberId: actor.memberId,
    });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete the bibliography entry.',
    };
  }
}

export async function getBookReviewPrefill(
  biblioId: number,
  actor: { familyId: number; memberId: number }
): Promise<BookReviewPrefill | null> {
  try {
    const existingEntry = await db
      .select()
      .from(bookBiblio)
      .where(and(
        eq(bookBiblio.id, biblioId),
        eq(bookBiblio.familyId, actor.familyId),
        eq(bookBiblio.memberId, actor.memberId)
      ))
      .then((rows) => rows[0] ?? null);

    if (!existingEntry) {
      return null;
    }

    const tagRows = await db
      .select({ tagId: bookBiblioTag.tagId })
      .from(bookBiblioTag)
      .where(eq(bookBiblioTag.biblioId, biblioId));

    const parsedSummary = parseSerializedTipTapDocument(existingEntry.summaryJson);
    const hasSummary = parsedSummary.success && !isTipTapDocumentEmpty(parsedSummary.content);
    const parsedComments = parseSerializedTipTapDocument(existingEntry.commentsJson);
    const hasComments = parsedComments.success && !isTipTapDocumentEmpty(parsedComments.content);

    const analysisContent = hasSummary
      ? parsedSummary.content
      : hasComments
        ? parsedComments.content
        : createEmptyTipTapDocument();

    return {
      biblioId: existingEntry.id,
      bookTitle: existingEntry.bookTitle,
      authorName: existingEntry.authorName,
      bookSeriesName: existingEntry.bookSeriesName ?? '',
      bookYear: existingEntry.publishedYear,
      analysisJson: serializeTipTapDocument(analysisContent),
      selectedTagIds: tagRows.map((tagRow) => tagRow.tagId),
    };
  } catch (error) {
    logDbQueryError('bookBiblio.getBookReviewPrefill', error, {
      biblioId,
      familyId: actor.familyId,
      memberId: actor.memberId,
    });
    return null;
  }
}
