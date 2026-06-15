'use server';

import { revalidatePath } from 'next/cache';

import { addPoemComment, savePoetryHomePoem, togglePoemReaction } from '@/components/db/sql/queries-poetry-cafe';
import { AddPoemCommentInput, SavePoetryHomePoemInput, TogglePoemReactionInput } from '@/components/db/types/poem-verses';
import { getMemberPageDetails } from '@/features/family/services/family-services';

export async function savePoetryHomePoemAction(input: SavePoetryHomePoemInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to save a poem.',
    };
  }

  const result = await savePoetryHomePoem(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
    isAdmin: memberDetails.isAdmin,
  });

  if (result.success) {
    revalidatePath('/poetry');
  }

  return result;
}

export async function togglePoemReactionAction(input: TogglePoemReactionInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to react to a poem.',
    };
  }

  const result = await togglePoemReaction(input.poemId, input.reactionType, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/poetry');
  }

  return result;
}

export async function addPoemCommentAction(input: AddPoemCommentInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to comment on a poem.',
    };
  }

  const result = await addPoemComment(input.poemId, input.commentText, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/poetry');
  }

  return result;
}