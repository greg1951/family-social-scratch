'use server';

import { revalidatePath } from "next/cache";

import { deletePoemTerm, savePoemTerm } from "@/components/db/sql/queries-poetry-cafe";
import { SavePoemTermInput } from "@/components/db/types/poem-verses";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export async function savePoemTermAction(input: SavePoemTermInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: "You must be signed in to manage poem terms.",
    };
  }

  const result = await savePoemTerm(input, {
    familyId: memberDetails.familyId,
    isAdmin: memberDetails.isAdmin ?? false,
  });

  if (result.success) {
    revalidatePath("/poem-terms");
    revalidatePath("/poem-terms/manage");
  }

  return result;
}

export async function deletePoemTermAction(input: { id: number }) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: "You must be signed in to manage poem terms.",
    };
  }

  const result = await deletePoemTerm(input.id, {
    familyId: memberDetails.familyId,
    isAdmin: memberDetails.isAdmin ?? false,
  });

  if (result.success) {
    revalidatePath("/poem-terms");
    revalidatePath("/poem-terms/manage");
  }

  return result;
}