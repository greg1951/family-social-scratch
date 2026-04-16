'use server';

import { revalidatePath } from 'next/cache';

import { addBookComment, saveBooksHomeBook, toggleBookLike } from '@/components/db/sql/queries-book-besties';
import { AddBookCommentInput, SaveBooksHomeBookInput, ToggleBookLikeInput } from '@/components/db/types/books';
import { getMemberPageDetails } from '@/features/family/services/family-services';

export async function saveBooksHomeBookAction(input: SaveBooksHomeBookInput) {
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
  });

  if (result.success) {
    revalidatePath('/books');
  }

  return result;
}

export async function toggleBookLikeAction(input: ToggleBookLikeInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to like a book.',
    };
  }

  const result = await toggleBookLike(input.bookId, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/books');
  }

  return result;
}

export async function addBookCommentAction(input: AddBookCommentInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to comment on a book.',
    };
  }

  const result = await addBookComment(input.bookId, input.commentText, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/books');
  }

  return result;
}