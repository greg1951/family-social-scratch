'use server';

import { revalidatePath } from 'next/cache';

import {
  deletePoemCategory,
  deletePoemCategoryTagReference,
  savePoemCategory,
  savePoemCategoryTagReference,
} from '@/components/db/sql/queries-poetry-cafe';
import {
  DeletePoemCategoryInput,
  DeletePoemCategoryTagReferenceInput,
  SavePoemCategoryInput,
  SavePoemCategoryTagReferenceInput,
} from '@/components/db/types/poem-verses';
import { getMemberPageDetails } from '@/features/family/services/family-services';

export async function savePoemCategoryAction(input: SavePoemCategoryInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return {
      success: false as const,
      message: 'You must be an admin to manage poem categories.',
    };
  }

  const result = await savePoemCategory(input);

  if (result.success) {
    revalidatePath('/add-poem-tags');
  }

  return result;
}

export async function savePoemCategoryTagReferenceAction(input: SavePoemCategoryTagReferenceInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return {
      success: false as const,
      message: 'You must be an admin to manage poem tags.',
    };
  }

  const result = await savePoemCategoryTagReference(input);

  if (result.success) {
    revalidatePath('/add-poem-tags');
  }

  return result;
}

export async function deletePoemCategoryTagReferenceAction(input: DeletePoemCategoryTagReferenceInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return {
      success: false as const,
      message: 'You must be an admin to manage poem tags.',
    };
  }

  const result = await deletePoemCategoryTagReference(input);

  if (result.success) {
    revalidatePath('/add-poem-tags');
  }

  return result;
}

export async function deletePoemCategoryAction(input: DeletePoemCategoryInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return {
      success: false as const,
      message: 'You must be an admin to manage poem categories.',
    };
  }

  const result = await deletePoemCategory(input);

  if (result.success) {
    revalidatePath('/add-poem-tags');
  }

  return result;
}
