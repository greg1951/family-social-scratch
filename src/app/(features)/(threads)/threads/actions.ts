'use server';

import { revalidatePath } from 'next/cache';

import {
  addThreadReply,
  archiveAllReadConversationsForRecipient,
  createThreadConversationWithInitialPost,
  updateRecipientThreadArchiveState,
  updateRecipientThreadReadState,
} from '@/components/db/sql/queries-thread-convos';
import { AddThreadReplyInput, CreateThreadConversationInput } from '@/components/db/types/thread-convos';
import { getMemberPageDetails } from '@/features/family/services/family-services';

export async function archiveReadThreadsAction() {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to archive threads.',
    };
  }

  const result = await archiveAllReadConversationsForRecipient(memberDetails.memberId);

  if (result.success) {
    revalidatePath('/threads');
  }

  return result;
}

export async function createThreadConversationAction(input: CreateThreadConversationInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to create a thread.',
    };
  }

  const result = await createThreadConversationWithInitialPost(input, {
    familyId: memberDetails.familyId,
    senderMemberId: memberDetails.memberId,
    isFounder: memberDetails.isFounder,
  });

  if (result.success) {
    revalidatePath('/threads');
    revalidatePath('/threads/compose');
  }

  return result;
}

export async function addThreadReplyAction(input: AddThreadReplyInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to reply.',
    };
  }

  const result = await addThreadReply(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/threads');
    revalidatePath(`/threads/${ input.conversationId }`);
  }

  return result;
}

export async function updateThreadArchiveStateAction(input: { conversationId: number; shouldArchive: boolean }) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to update archive state.',
    };
  }

  const result = await updateRecipientThreadArchiveState(
    input.conversationId,
    memberDetails.memberId,
    input.shouldArchive,
  );

  if (result.success) {
    revalidatePath('/threads');
    revalidatePath(`/threads/${ input.conversationId }`);
  }

  return result;
}

export async function updateThreadReadStateAction(input: { conversationId: number; shouldMarkUnread: boolean }) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to update read status.',
    };
  }

  const result = await updateRecipientThreadReadState(
    input.conversationId,
    memberDetails.memberId,
    input.shouldMarkUnread,
  );

  if (result.success) {
    revalidatePath('/threads');
    revalidatePath(`/threads/${ input.conversationId }`);
  }

  return result;
}
