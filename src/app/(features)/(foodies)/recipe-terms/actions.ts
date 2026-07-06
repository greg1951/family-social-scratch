'use server';

import { revalidatePath } from "next/cache";

import { deleteRecipeTerm, saveRecipeTerm } from "@/components/db/sql/queries-foodies";
import { SaveRecipeTermInput } from "@/components/db/types/recipes";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export async function saveRecipeTermAction(input: SaveRecipeTermInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: "You must be signed in to manage recipe terms.",
    };
  }

  const result = await saveRecipeTerm(input, {
    familyId: memberDetails.familyId,
    isAdmin: memberDetails.isAdmin ?? false,
  });

  if (result.success) {
    revalidatePath("/foodies");
    revalidatePath("/recipe-terms/manage");
  }

  return result;
}

export async function deleteRecipeTermAction(input: { id: number }) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: "You must be signed in to manage recipe terms.",
    };
  }

  const result = await deleteRecipeTerm(input.id, {
    familyId: memberDetails.familyId,
    isAdmin: memberDetails.isAdmin ?? false,
  });

  if (result.success) {
    revalidatePath("/recipe-terms");
    revalidatePath("/recipe-terms/manage");
  }

  return result;
}
