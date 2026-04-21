'use server';

import { revalidatePath } from 'next/cache';

import { getMemberPageDetails } from '@/features/family/services/family-services';
import { addShowComment, getShowDetail, saveShow, saveShowTemplate, toggleShowLike } from '@/components/db/sql/queries-tv';
import { AddShowCommentInput, SaveShowInput, SaveShowTemplateInput, ToggleShowLikeInput } from '@/components/db/types/shows';

export async function saveShowAction(input: SaveShowInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to add a show.',
    };
  }

  const result = await saveShow(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/tv');
    revalidatePath('/tv/add-show');
  }

  return result;
}

export async function saveShowTemplateAction(input: SaveShowTemplateInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to manage show templates.',
    };
  }

  const result = await saveShowTemplate(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
    isAdmin: memberDetails.isAdmin ?? false,
  });

  if (result.success) {
    revalidatePath('/tv');
    revalidatePath('/tv/add-show');
    revalidatePath('/tv/templates');
  }

  return result;
}

export async function toggleShowLikeAction(input: ToggleShowLikeInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to react to a show.',
    };
  }

  const result = await toggleShowLike(input.showId, input.likenessDegree, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/tv');
  }

  return result;
}

export async function addShowCommentAction(input: AddShowCommentInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to comment on a show.',
    };
  }

  const result = await addShowComment(input.showId, input.commentText, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/tv');
  }

  return result;
}

export async function getShowDetailAction(input: { showId: number }) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to view show details.',
    };
  }

  return getShowDetail(
    memberDetails.familyId,
    input.showId,
    memberDetails.memberId
  );
}