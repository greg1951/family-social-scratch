'use server';

import { revalidatePath } from 'next/cache';

import {
  deleteBookCategory,
  deleteBookCategoryTagReference,
  saveBookCategory,
  saveBookCategoryTagReference,
} from '@/components/db/sql/queries-book-besties';
import {
  DeleteBookCategoryInput,
  DeleteBookCategoryTagReferenceInput,
  SaveBookCategoryInput,
  SaveBookCategoryTagReferenceInput,
} from '@/components/db/types/books';
import { getMemberPageDetails } from '@/features/family/services/family-services';

export async function saveBookCategoryAction(input: SaveBookCategoryInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return {
      success: false as const,
      message: 'You must be an admin to manage book categories.',
    };
  }

  const result = await saveBookCategory(input);

  if (result.success) {
    revalidatePath('/add-book-tags');
  }

  return result;
}

export async function saveBookCategoryTagReferenceAction(input: SaveBookCategoryTagReferenceInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return {
      success: false as const,
      message: 'You must be an admin to manage book tags.',
    };
  }

  const result = await saveBookCategoryTagReference(input);

  if (result.success) {
    revalidatePath('/add-book-tags');
  }

  return result;
}

export async function deleteBookCategoryTagReferenceAction(input: DeleteBookCategoryTagReferenceInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return {
      success: false as const,
      message: 'You must be an admin to manage book tags.',
    };
  }

  const result = await deleteBookCategoryTagReference(input);

  if (result.success) {
    revalidatePath('/add-book-tags');
  }

  return result;
}

export async function deleteBookCategoryAction(input: DeleteBookCategoryInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return {
      success: false as const,
      message: 'You must be an admin to manage book categories.',
    };
  }

  const result = await deleteBookCategory(input);

  if (result.success) {
    revalidatePath('/add-book-tags');
  }

  return result;
}
