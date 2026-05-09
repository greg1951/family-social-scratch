'use server';

import { revalidatePath } from 'next/cache';

import {
  addDiscussionReply,
  addInitialDiscussionPost,
  createDiscussionThreadWithInitialPost,
} from '@/components/db/sql/queries-discuss-threads';
import { AddDiscussionReplyInput, AddInitialPostInput, CreateDiscussionThreadInput } from '@/components/db/types/discuss-threads';
import { getMemberPageDetails } from '@/features/family/services/family-services';

function revalidatePaths(paths?: string[]) {
  if (!paths || paths.length === 0) {
    return;
  }

  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function startDiscussionThreadAction(
  input: CreateDiscussionThreadInput & { revalidatePaths?: string[] }
) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to start a discussion.',
    };
  }

  const result = await createDiscussionThreadWithInitialPost(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePaths(input.revalidatePaths);
  }

  return result;
}

export async function addDiscussionReplyAction(
  input: AddDiscussionReplyInput & { revalidatePaths?: string[] }
) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to reply.',
    };
  }

  const result = await addDiscussionReply(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePaths(input.revalidatePaths);
  }

  return result;
}

export async function addInitialDiscussionPostAction(
  input: AddInitialPostInput & { revalidatePaths?: string[] }
) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to start a discussion post.',
    };
  }

  const result = await addInitialDiscussionPost(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePaths(input.revalidatePaths);
  }

  return result;
}
