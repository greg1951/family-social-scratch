'use server';

import { revalidatePath } from 'next/cache';

import { createClubSession, deleteClub, deleteClubSession, saveClub, updateClubSession } from '@/components/db/sql/queries-clubs';
import type { CreateClubSessionInput, DeleteClubInput, DeleteClubSessionInput, SaveClubInput, UpdateClubSessionInput } from '@/components/db/types/clubs';
import { getMemberPageDetails } from '@/features/family/services/family-services';

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