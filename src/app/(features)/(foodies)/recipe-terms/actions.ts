'use server';

import { revalidatePath } from "next/cache";

import { deleteRecipeTerm, saveRecipeTerm } from "@/components/db/sql/queries-foodies";
import { SaveRecipeTermInput } from "@/components/db/types/recipes";

export async function saveRecipeTermAction(input: SaveRecipeTermInput) {
  const result = await saveRecipeTerm(input);

  if (result.success) {
    revalidatePath("/foodies");
    revalidatePath("/recipe-terms/manage");
  }

  return result;
}

export async function deleteRecipeTermAction(input: { id: number }) {
  const result = await deleteRecipeTerm(input.id);

  if (result.success) {
    revalidatePath("/recipe-terms");
    revalidatePath("/recipe-terms/manage");
  }

  return result;
}
