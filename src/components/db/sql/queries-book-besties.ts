import db from '@/components/db/drizzle';
import { and, asc, eq, ilike, inArray, ne } from 'drizzle-orm';
import { member, bookComment, book, bookTag, bookLike, bookTagReference, bookTerm } from "../schema/family-social-schema-tables";
import {
  AddBookCommentReturn,
  Book,
  GetBookTermReturn,
  BookTagOptionsReturn,
  BooksHomeBook,
  BooksHomePageDataReturn,
  BooksReturn,
  SaveBookTermInput,
  SaveBookTermReturn,
  BookTermsReturn,
  SaveBooksHomeBookInput,
  SaveBooksHomeBookReturn,
  ToggleBookLikeReturn,
} from '@/components/db/types/books';
import {
  createTextTipTapDocument,
  isTipTapDocumentEmpty,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from '../types/poem-term-validation';
import { createFamilyActivityRecord, FAMILY_ACTIVITY_ACTION_TYPES } from './queries-family-activity';

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

async function loadBooksHomeBooks(
  familyId: number,
  bookIds?: number[],
  viewerMemberId?: number
): Promise<BooksHomeBook[]> {
  const whereClause = bookIds && bookIds.length > 0
    ? and(eq(book.familyId, familyId), inArray(book.id, bookIds))
    : eq(book.familyId, familyId);

  const bookRows = await db
    .select()
    .from(book)
    .where(whereClause)
    .orderBy(asc(book.bookTitle));

  if (!bookRows || bookRows.length === 0) {
    return [];
  }

  const bookIdsToLoad = bookRows.map((row) => row.id);
  const commentRows = await db
    .select({
      id: bookComment.id,
      createdAt: bookComment.createdAt,
      commentJson: bookComment.commentJson,
      isBookAnalysis: bookComment.isBookAnalysis,
      bookId: bookComment.bookId,
      memberId: bookComment.memberId,
    })
    .from(bookComment)
    .where(inArray(bookComment.bookId, bookIdsToLoad))
    .orderBy(asc(bookComment.createdAt));

  const memberIds = [...new Set([
    ...bookRows.map((row) => row.memberId),
    ...commentRows.map((row) => row.memberId),
  ])];

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

  const likeRows = await db
    .select({
      bookId: bookLike.bookId,
      memberId: bookLike.memberId,
    })
    .from(bookLike)
    .where(inArray(bookLike.bookId, bookIdsToLoad));

  const factTagRows = await db
    .select()
    .from(bookTag)
    .where(inArray(bookTag.bookId, bookIdsToLoad));

  const memberNameById = new Map(
    memberRows.map((row) => [row.id, createSubmitterName(row.firstName, row.lastName)])
  );
  const commentsByBookId = new Map<number, typeof commentRows>();

  for (const commentRow of commentRows) {
    const existingRows = commentsByBookId.get(commentRow.bookId) ?? [];
    existingRows.push(commentRow);
    commentsByBookId.set(commentRow.bookId, existingRows);
  }

  const tagIdsByBookId = new Map<number, number[]>();
  const likesByBookId = new Map<number, number>();
  const likedBookIdsByViewer = new Set<number>();

  for (const factTagRow of factTagRows) {
    const existingTagIds = tagIdsByBookId.get(factTagRow.bookId) ?? [];
    existingTagIds.push(factTagRow.tagId);
    tagIdsByBookId.set(factTagRow.bookId, existingTagIds);
  }

  for (const likeRow of likeRows) {
    likesByBookId.set(likeRow.bookId, (likesByBookId.get(likeRow.bookId) ?? 0) + 1);

    if (viewerMemberId && likeRow.memberId === viewerMemberId) {
      likedBookIdsByViewer.add(likeRow.bookId);
    }
  }

  return bookRows.map((row) => {
    const bookCommentsForBook = commentsByBookId.get(row.id) ?? [];
    const analysisComment = bookCommentsForBook.find((commentRow) => commentRow.isBookAnalysis);
    const submissionComments = bookCommentsForBook.filter((commentRow) => !commentRow.isBookAnalysis);
    const bookComments = submissionComments.map((commentRow) => {
      const parsedComment = parseSerializedTipTapDocument(commentRow.commentJson);

      return {
        id: commentRow.id,
        createdAt: commentRow.createdAt as Date,
        commenterName: memberNameById.get(commentRow.memberId) ?? `Member #${ commentRow.memberId }`,
        text: parsedComment.success
          ? extractTipTapText(parsedComment.content)
          : '',
      };
    });

    return {
      id: row.id,
      bookTitle: row.bookTitle,
      authorName: row.authorName,
      bookLanguage: row.bookLanguage,
      bookYear: row.bookYear,
      status: row.status,
      createdAt: row.createdAt as Date,
      memberId: row.memberId,
      familyId: row.familyId,
      submitterName: memberNameById.get(row.memberId) ?? `Member #${ row.memberId }`,
      likesCount: likesByBookId.get(row.id) ?? 0,
      commentCount: submissionComments.length,
      likedByMember: likedBookIdsByViewer.has(row.id),
      analysisJson: analysisComment?.commentJson,
      selectedTagIds: tagIdsByBookId.get(row.id) ?? [],
      bookComments,
    };
  });
}

export async function getBooksHomePageData(familyId: number, memberId?: number)
  : Promise<BooksHomePageDataReturn> {
  try {
    const [books, bookTagsResult] = await Promise.all([
      loadBooksHomeBooks(familyId, undefined, memberId),
      getBookTagReferences(),
    ]);

    return {
      success: true,
      books,
      bookTags: bookTagsResult.success ? bookTagsResult.bookTags : [],
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error loading book besties home page data',
    };
  }
}

export async function getBookTagReferences()
  : Promise<BookTagOptionsReturn> {
  const result = await db
    .select({
      id: bookTagReference.id,
      tagName: bookTagReference.tagName,
      tagDesc: bookTagReference.tagDesc,
      status: bookTagReference.status,
    })
    .from(bookTagReference)
    .orderBy(asc(bookTagReference.seqNo), asc(bookTagReference.tagName));

  if (!result) {
    return {
      success: false,
      message: 'Error accessing book tag references',
    };
  }

  return {
    success: true,
    bookTags: result,
  };
}

export async function saveBooksHomeBook(
  input: SaveBooksHomeBookInput,
  actor: {
    familyId: number;
    memberId: number;
    isAdmin?: boolean;
  }
): Promise<SaveBooksHomeBookReturn> {
  const normalizedTitle = input.bookTitle.trim();
  const normalizedAuthorName = input.authorName.trim();
  const normalizedLanguage = input.bookLanguage.trim() || 'English';
  const uniqueTagIds = [...new Set(input.selectedTagIds)].slice(0, 3);
  const parsedAnalysisJson = parseSerializedTipTapDocument(input.analysisJson.trim());

  if (!normalizedTitle) {
    return {
      success: false,
      message: 'Enter a book name before saving.',
    };
  }

  if (!normalizedAuthorName) {
    return {
      success: false,
      message: 'Enter an author name before saving.',
    };
  }

  if (!Number.isInteger(input.bookYear) || input.bookYear < 1 || input.bookYear > 9999) {
    return {
      success: false,
      message: 'Enter a valid book year before saving.',
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
      .select({ id: bookTagReference.id })
      .from(bookTagReference)
      .where(inArray(bookTagReference.id, uniqueTagIds));

    if (validTags.length !== uniqueTagIds.length) {
      return {
        success: false,
        message: 'One or more selected book tags are invalid.',
      };
    }
  }

  const existingBook = input.id
    ? await db
      .select()
      .from(book)
      .where(and(eq(book.id, input.id), eq(book.familyId, actor.familyId)))
      .then((rows) => rows[0] ?? null)
    : null;

  if (input.id && !existingBook) {
    return {
      success: false,
      message: `No book was found for id: ${ input.id }`,
    };
  }

  if (existingBook && !actor.isAdmin && existingBook.memberId !== actor.memberId) {
    return {
      success: false,
      message: 'Only the book submitter or an admin can save changes to this book.',
    };
  }

  const existingAnalysis = existingBook
    ? await db
      .select()
      .from(bookComment)
      .where(and(eq(bookComment.bookId, existingBook.id), eq(bookComment.isBookAnalysis, true)))
      .then((rows) => rows[0] ?? null)
    : null;

  const existingFactTags = existingBook
    ? await db
      .select()
      .from(bookTag)
      .where(eq(bookTag.bookId, existingBook.id))
    : [];

  const isAnalysisEmpty = isTipTapDocumentEmpty(parsedAnalysisJson.content);
  const serializedAnalysisJson = serializeTipTapDocument(parsedAnalysisJson.content);

  const bookPayload = {
    bookTitle: normalizedTitle,
    authorName: normalizedAuthorName,
    bookLanguage: normalizedLanguage,
    bookYear: input.bookYear,
    status: input.status.trim() || 'draft',
    memberId: existingBook?.memberId ?? actor.memberId,
    familyId: actor.familyId,
  };
  let savedBookId: number;
  let createdBookFactId: number | null = null;
  let createdAnalysisId: number | null = null;
  let replacedTags = false;

  try {
    const savedBookFact = existingBook
      ? await db
        .update(book)
        .set(bookPayload)
        .where(eq(book.id, existingBook.id))
        .returning()
        .then((rows) => rows[0])
      : await db
        .insert(book)
        .values(bookPayload)
        .returning()
        .then((rows) => rows[0]);

    if (!existingBook) {
      createdBookFactId = savedBookFact.id;
    }

    if (isAnalysisEmpty) {
      if (existingAnalysis) {
        await db
          .delete(bookComment)
          .where(eq(bookComment.id, existingAnalysis.id));
      }
    } else if (existingAnalysis) {
      await db
        .update(bookComment)
        .set({ commentJson: serializedAnalysisJson })
        .where(eq(bookComment.id, existingAnalysis.id));
    } else {
      const createdAnalysis = await db
        .insert(bookComment)
        .values({
          bookId: savedBookFact.id,
          memberId: savedBookFact.memberId,
          isBookAnalysis: true,
          commentJson: serializedAnalysisJson,
        })
        .returning()
        .then((rows) => rows[0]);

      createdAnalysisId = createdAnalysis.id;
    }

    await db
      .delete(bookTag)
      .where(eq(bookTag.bookId, savedBookFact.id));
    replacedTags = true;

    if (uniqueTagIds.length > 0) {
      await db
        .insert(bookTag)
        .values(uniqueTagIds.map((tagId) => ({
          bookId: savedBookFact.id,
          tagId,
        })));
    }

    if (!existingBook) {
      await createFamilyActivityRecord({
        actionType: FAMILY_ACTIVITY_ACTION_TYPES.POST_CREATED,
        featureName: 'Book Besties',
        postName: normalizedTitle,
        familyId: actor.familyId,
        memberId: actor.memberId,
      });
    }

    savedBookId = savedBookFact.id;
  } catch (error) {
    if (createdBookFactId) {
      try {
        await db
          .delete(book)
          .where(eq(book.id, createdBookFactId));
      } catch {
        // Best-effort cleanup only.
      }
    } else {
      if (replacedTags && existingBook) {
        try {
          await db
            .delete(bookTag)
            .where(eq(bookTag.bookId, existingBook.id));

          if (existingFactTags.length > 0) {
            await db
              .insert(bookTag)
              .values(existingFactTags.map((factTag) => ({
                bookId: existingBook.id,
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
            .delete(bookComment)
            .where(eq(bookComment.id, createdAnalysisId));
        } catch {
          // Best-effort cleanup only.
        }
      } else if (existingAnalysis) {
        try {
          const currentAnalysis = await db
            .select()
            .from(bookComment)
            .where(and(eq(bookComment.bookId, existingBook!.id), eq(bookComment.isBookAnalysis, true)))
            .then((rows) => rows[0] ?? null);

          if (!currentAnalysis) {
            await db
              .insert(bookComment)
              .values({
                bookId: existingBook!.id,
                memberId: existingBook!.memberId,
                isBookAnalysis: true,
                commentJson: existingAnalysis.commentJson,
              });
          } else {
            await db
              .update(bookComment)
              .set({ commentJson: existingAnalysis.commentJson })
              .where(eq(bookComment.id, currentAnalysis.id));
          }
        } catch {
          // Best-effort cleanup only.
        }
      }

      if (existingBook) {
        try {
          await db
            .update(book)
            .set({
              bookTitle: existingBook.bookTitle,
              authorName: existingBook.authorName,
              bookLanguage: existingBook.bookLanguage,
              bookYear: existingBook.bookYear,
              status: existingBook.status,
              memberId: existingBook.memberId,
              familyId: existingBook.familyId,
            })
            .where(eq(book.id, existingBook.id));
        } catch {
          // Best-effort cleanup only.
        }
      }
    }

    return {
      success: false,
      message: error instanceof Error
        ? `Failed to save book changes. Best-effort cleanup was attempted: ${ error.message }`
        : 'Failed to save book changes. Best-effort cleanup was attempted.',
    };
  }

  const [savedBook] = await loadBooksHomeBooks(actor.familyId, [savedBookId], actor.memberId);

  if (!savedBook) {
    return {
      success: false,
      message: 'The book was saved but could not be reloaded.',
    };
  }

  return {
    success: true,
    book: savedBook,
    message: `Book "${ savedBook.bookTitle }" saved successfully.`,
  };
}

export async function toggleBookLike(
  bookId: number,
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<ToggleBookLikeReturn> {
  const existingBook = await db
    .select()
    .from(book)
    .where(and(eq(book.id, bookId), eq(book.familyId, actor.familyId)))
    .then((rows) => rows[0] ?? null);

  if (!existingBook) {
    return {
      success: false,
      message: 'The selected book could not be found.',
    };
  }

  const existingLike = await db
    .select()
    .from(bookLike)
    .where(and(eq(bookLike.bookId, bookId), eq(bookLike.memberId, actor.memberId)))
    .then((rows) => rows[0] ?? null);

  if (existingLike) {
    await db
      .delete(bookLike)
      .where(eq(bookLike.id, existingLike.id));
  } else {
    await db
      .insert(bookLike)
      .values({
        bookId: bookId,
        memberId: actor.memberId,
      });
  }

  const [updatedBook] = await loadBooksHomeBooks(actor.familyId, [bookId], actor.memberId);

  if (!updatedBook) {
    return {
      success: false,
      message: 'Like was updated but the book could not be reloaded.',
    };
  }

  return {
    success: true,
    book: updatedBook,
    message: existingLike
      ? `You removed your like from "${ updatedBook.bookTitle }".`
      : `You liked "${ updatedBook.bookTitle }".`,
  };
}

export async function addBookComment(
  bookId: number,
  commentText: string,
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<AddBookCommentReturn> {
  const normalizedComment = commentText.trim();

  if (normalizedComment.length < 2) {
    return {
      success: false,
      message: 'Enter at least 2 characters before posting a comment.',
    };
  }

  const existingBook = await db
    .select()
    .from(book)
    .where(and(eq(book.id, bookId), eq(book.familyId, actor.familyId)))
    .then((rows) => rows[0] ?? null);

  if (!existingBook) {
    return {
      success: false,
      message: 'The selected book could not be found.',
    };
  }

  const commentJson = serializeTipTapDocument(createTextTipTapDocument(normalizedComment));

  await db
    .insert(bookComment)
    .values({
      bookId,
      memberId: actor.memberId,
      isBookAnalysis: false,
      commentJson,
    });

  await createFamilyActivityRecord({
    actionType: FAMILY_ACTIVITY_ACTION_TYPES.COMMENT_CREATED,
    featureName: 'Book Besties',
    postName: existingBook.bookTitle,
    familyId: actor.familyId,
    memberId: actor.memberId,
  });

  const [updatedBook] = await loadBooksHomeBooks(actor.familyId, [bookId], actor.memberId);

  if (!updatedBook) {
    return {
      success: false,
      message: 'Comment was saved but the book could not be reloaded.',
    };
  }

  return {
    success: true,
    book: updatedBook,
    message: `Your comment was added to "${ updatedBook.bookTitle }".`,
  };
}

/*-------- findFamilyMember ------------------ */
export async function getAllFamilyBooks(familyId: number)
: Promise<BooksReturn> {
  const result = await db
    .select()
    .from(book).orderBy(asc(book.bookTitle))
    .where(eq(book.familyId, familyId)
    );
  if (!result) {
    return {
      success: false,
      message: "Error accessing books for familyId: " + familyId,
    };
  };
    
  // console.log('queries-book-besties->getAllFamilyBooks->result.length: ',result.length);
  if (result.length === 0) {
    return {
      success: false,
      message: "No books found for familyId: " + familyId,
    }; 
  };

  const books: Book[] = result.map((row) => ({
    id: row.id,
    bookTitle: row.bookTitle,
    authorName: row.authorName,
    bookLanguage: row.bookLanguage,
    bookYear: row.bookYear,
    status: row.status,
    createdAt: row.createdAt as Date,
    memberId: row.memberId,
    familyId: row.familyId,
  }));

  console.log('queries-book-besties->getAllFamilyBooks->books.length: ',books.length);

  return {
    success: true,
    books: books,
    }
  };

/*-------- getBookTerms ------------------ */
export async function getBookTerms()
  : Promise<BookTermsReturn> {
  const result = await db
    .select()
      .from(bookTerm)
      .orderBy(asc(bookTerm.term));

  if (!result) {
    return {
      success: false,
      message: "Error accessing book terms",
    };
  };
  console.log('queries-book-besties->getBookTerms->result.length: ',result.length);
  
  if (result.length === 0) {
    return {
      success: false,
      message: "No book terms found",
    }; 
  };

  const bookTerms = result.map((row) => ({
    id: row.id,
    term: row.term,
    termJson: row.termJson,
    status: row.status,
    createdAt: row.createdAt as Date,
  }));

  console.log('queries-book-besties->getBookTerms->bookTerms.length: ',bookTerms.length);

  return {
    success: true,
    bookTerms: bookTerms,
    }
  };

export async function getBookTermById(id: number)
  : Promise<GetBookTermReturn> {
  const [result] = await db
    .select()
    .from(bookTerm)
    .where(eq(bookTerm.id, id));

  if (!result) {
    return {
      success: false,
      message: `No book term found for id: ${id}`,
    };
  }

  return {
    success: true,
    bookTerm: {
      id: result.id,
      term: result.term,
      termJson: result.termJson,
      status: result.status,
      createdAt: result.createdAt as Date,
    },
  };
}

export async function saveBookTerm(input: SaveBookTermInput)
  : Promise<SaveBookTermReturn> {
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
    ? and(ilike(bookTerm.term, termPayload.term), ne(bookTerm.id, input.id))
    : ilike(bookTerm.term, termPayload.term);

  const [existingTerm] = await db
    .select({ id: bookTerm.id })
    .from(bookTerm)
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
      .update(bookTerm)
      .set(termPayload)
      .where(eq(bookTerm.id, input.id))
      .returning();

    if (!result) {
      return {
        success: false,
        message: `Failed to update book term with id: ${input.id}`,
      };
    }

    return {
      success: true,
      bookTerm: {
        id: result.id,
        term: result.term,
        termJson: result.termJson,
        status: result.status,
        createdAt: result.createdAt as Date,
      },
    };
  }

  const [result] = await db
    .insert(bookTerm)
    .values(termPayload)
    .returning();

  if (!result) {
    return {
      success: false,
      message: 'Failed to create book term',
    };
  }

  return {
    success: true,
    bookTerm: {
      id: result.id,
      term: result.term,
      termJson: result.termJson,
      status: result.status,
      createdAt: result.createdAt as Date,
    },
  };
}


