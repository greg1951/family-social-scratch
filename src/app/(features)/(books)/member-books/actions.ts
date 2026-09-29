'use server';

import { revalidatePath } from 'next/cache';

import {
  deleteBiblioEntry,
  saveBiblioEntry,
} from '@/components/db/sql/queries-book-biblio';
import { withRequestCorrelation } from '@/components/db/sql/request-correlation';
import type { SaveBiblioEntryInput } from '@/components/db/types/book-biblio';
import { getMemberPageDetails } from '@/features/family/services/family-services';

export async function saveBiblioEntryAction(input: SaveBiblioEntryInput) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to save a bibliography entry.',
      };
    }

    const result = await saveBiblioEntry(input, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
    });

    if (result.success) {
      revalidatePath('/member-books');
      revalidatePath('/books');
    }

    return result;
  });
}

export async function deleteBiblioEntryAction(input: { biblioId: number }) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to delete a bibliography entry.',
      };
    }

    const result = await deleteBiblioEntry(input.biblioId, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
    });

    if (result.success) {
      revalidatePath('/member-books');
      revalidatePath('/books');
    }

    return result;
  });
}
