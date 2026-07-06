'use server';

import { revalidatePath } from "next/cache";

import { deleteBookTerm, saveBookTerm } from "@/components/db/sql/queries-book-besties";
import { SaveBookTermInput } from "@/components/db/types/books";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export async function saveBookTermAction(input: SaveBookTermInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: "You must be signed in to manage book terms.",
    };
  }

  const result = await saveBookTerm(input, {
    familyId: memberDetails.familyId,
    isAdmin: memberDetails.isAdmin ?? false,
  });

  if (result.success) {
    revalidatePath("/book-terms");
    revalidatePath("/book-terms/manage");
  }

  return result;
}

export async function deleteBookTermAction(input: { id: number }) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: "You must be signed in to manage book terms.",
    };
  }

  const result = await deleteBookTerm(input.id, {
    familyId: memberDetails.familyId,
    isAdmin: memberDetails.isAdmin ?? false,
  });

  if (result.success) {
    revalidatePath("/book-terms");
    revalidatePath("/book-terms/manage");
  }

  return result;
}
