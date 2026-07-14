'use server';

import { revalidatePath } from 'next/cache';

import { addBookComment, deleteBook, saveBooksHomeBook, toggleBookReaction } from '@/components/db/sql/queries-book-besties';
import { AddBookCommentInput, SaveBooksHomeBookInput, ToggleBookReactionInput } from '@/components/db/types/books';
import { getMemberPageDetails } from '@/features/family/services/family-services';
import { withRequestCorrelation } from '@/components/db/sql/request-correlation';

export async function saveBooksHomeBookAction(input: SaveBooksHomeBookInput) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to save a book.',
      };
    }

    const result = await saveBooksHomeBook(input, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
      isAdmin: memberDetails.isAdmin,
      isFounder: memberDetails.isFounder,
    });

    if (result.success) {
      revalidatePath('/books');
    }

    return result;
  });
}

export async function toggleBookReactionAction(input: ToggleBookReactionInput) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to react to a book.',
      };
    }

    const result = await toggleBookReaction(input.bookId, input.reactionType, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
    });

    if (result.success) {
      revalidatePath('/books');
    }

    return result;
  });
}

export async function addBookCommentAction(input: AddBookCommentInput) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to comment on a book.',
      };
    }

    const result = await addBookComment(input, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
    });

    if (result.success) {
      revalidatePath('/books');
    }

    return result;
  }, input.clientRequestId);
}

export async function deleteBooksHomeBookAction(input: { bookId: number }) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to delete a book.',
      };
    }

    const result = await deleteBook(input.bookId, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
      isFounder: memberDetails.isFounder,
    });

    if (result.success) {
      revalidatePath('/books');
    }

    return result;
  });
}