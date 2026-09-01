'use server';

import type { JSONContent } from '@tiptap/core';
import { revalidatePath } from 'next/cache';

import { createClubSession, deleteClub, deleteClubSession, getClubSessionById, saveClub, updateClubSession } from '@/components/db/sql/queries-clubs';
import { createThreadConversationWithInitialPost } from '@/components/db/sql/queries-thread-convos';
import type { CreateClubSessionInput, DeleteClubInput, DeleteClubSessionInput, SaveClubInput, UpdateClubSessionInput } from '@/components/db/types/clubs';
import { parseSerializedTipTapDocument } from '@/components/db/types/poem-term-validation';
import { getMemberPageDetails } from '@/features/family/services/family-services';

function extractTipTapText(node: JSONContent): string {
  if (node.type === 'text') {
    return node.text ?? '';
  }

  const childText = (node.content ?? []).map(extractTipTapText).join('');

  return node.type === 'paragraph' || node.type === 'heading' || node.type === 'listItem'
    ? `${ childText }\n`
    : childText;
}

async function sendClubSessionInviteMessage(
  clubSessionId: number,
  memberDetails: { familyId: number; memberId: number; isFounder: boolean },
) {
  const session = await getClubSessionById(memberDetails.familyId, clubSessionId);

  if (!session) {
    return;
  }

  const clubName = session.clubName ?? 'the club';
  const sessionTitle = session.targetTitle ?? session.discussTopic ?? 'Club Session';
  const parsedTopic = parseSerializedTipTapDocument(session.contentJson ?? session.topicJson ?? undefined);

  if (!parsedTopic.success) {
    return;
  }

  await createThreadConversationWithInitialPost(
    {
      title: `${ sessionTitle } Club Session Invitation`,
      subject: clubName,
      visibility: 'private',
      recipientMemberIds: [memberDetails.memberId],
      content: extractTipTapText(parsedTopic.content).trim() || sessionTitle,
      contentJson: JSON.stringify(parsedTopic.content),
    },
    {
      familyId: memberDetails.familyId,
      senderMemberId: memberDetails.memberId,
      isFounder: memberDetails.isFounder,
    },
  );
}

export async function saveClubAction(input: SaveClubInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be logged in to manage clubs.',
    };
  }

  const result = await saveClub(input, memberDetails);

  if (result.success) {
    revalidatePath('/add-club');
  }

  return result;
}

export async function deleteClubAction(input: DeleteClubInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be logged in to delete a club.',
    };
  }

  const result = await deleteClub(input, memberDetails);

  if (result.success) {
    revalidatePath('/add-club');
    revalidatePath('/books');
    revalidatePath('/poetry');
  }

  return result;
}

export async function createClubSessionAction(input: CreateClubSessionInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be logged in to create a club session.',
    };
  }

  const result = await createClubSession(input, memberDetails);

  if (result.success) {
    // The invite message is a convenience for the moderator; a failure must not undo the session.
    try {
      await sendClubSessionInviteMessage(result.clubSessionId, memberDetails);
      revalidatePath('/threads');
    } catch (error) {
      console.error('[CLUB_SESSION_INVITE_MESSAGE_FAILED]', error);
    }

    revalidatePath('/add-club');

    if (input.targetType === 'book') {
      revalidatePath('/books');
    } else {
      revalidatePath('/poetry');
    }
  }

  return result;
}

export async function updateClubSessionAction(input: UpdateClubSessionInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be logged in to update a club session.',
    };
  }

  const result = await updateClubSession(input, memberDetails);

  if (result.success) {
    revalidatePath('/add-club');
    revalidatePath('/books');
    revalidatePath('/poetry');

    if (result.targetType === 'book') {
      revalidatePath(`/books/discussions/${ result.threadId }`);
    } else {
      revalidatePath(`/poetry/discussions/${ result.threadId }`);
    }
  }

  return result;
}

export async function deleteClubSessionAction(input: DeleteClubSessionInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be logged in to delete a club session.',
    };
  }

  const result = await deleteClubSession(input, memberDetails);

  if (result.success) {
    revalidatePath('/add-club');
    revalidatePath('/books');
    revalidatePath('/poetry');
  }

  return result;
}