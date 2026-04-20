'use server';

import { revalidatePath } from "next/cache";

import { saveRecipeTerm } from "@/components/db/sql/queries-foodies";
import { SaveRecipeTermInput } from "@/components/db/types/recipes";

export async function saveRecipeTermAction(input: SaveRecipeTermInput) {
  const result = await saveRecipeTerm(input);

  if (result.success) {
    revalidatePath("/foodies");
    revalidatePath("/recipe-terms/manage");
  }

  return result;
}
