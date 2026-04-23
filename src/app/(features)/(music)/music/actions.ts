'use server';

import { revalidatePath } from 'next/cache';

import { getMemberPageDetails } from '@/features/family/services/family-services';
import {
  addMusicComment,
  getMusicDetail,
  saveMusic,
  saveMusicLyrics,
  saveMusicTemplate,
  toggleMusicLike,
} from '@/components/db/sql/queries-music';
import {
  AddMusicCommentInput,
  SaveMusicInput,
  SaveMusicLyricsInput,
  SaveMusicTemplateInput,
  ToggleMusicLikeInput,
} from '@/components/db/types/music';

export async function saveMusicAction(input: SaveMusicInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to add music.',
    };
  }

  const result = await saveMusic(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/music');
    revalidatePath('/music/add-music');
  }

  return result;
}

export async function saveMusicTemplateAction(input: SaveMusicTemplateInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to manage music templates.',
    };
  }

  const result = await saveMusicTemplate(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
    isAdmin: memberDetails.isAdmin ?? false,
  });

  if (result.success) {
    revalidatePath('/music');
    revalidatePath('/music/add-music');
    revalidatePath('/music/templates');
  }

  return result;
}

export async function saveMusicLyricsAction(input: SaveMusicLyricsInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to save lyrics.',
    };
  }

  const result = await saveMusicLyrics(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/music');
    revalidatePath('/music/lyrics');
  }

  return result;
}

export async function toggleMusicLikeAction(input: ToggleMusicLikeInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to react to a music post.',
    };
  }

  const result = await toggleMusicLike(input.musicId, input.likenessDegree, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/music');
  }

  return result;
}

export async function addMusicCommentAction(input: AddMusicCommentInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to comment on music.',
    };
  }

  const result = await addMusicComment(input.musicId, input.commentText, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/music');
  }

  return result;
}

export async function getMusicDetailAction(input: { musicId: number }) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to view music details.',
    };
  }

  return getMusicDetail(
    memberDetails.familyId,
    input.musicId,
    memberDetails.memberId
  );
}
