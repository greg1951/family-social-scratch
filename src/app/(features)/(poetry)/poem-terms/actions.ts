'use server';

import { revalidatePath } from "next/cache";

import { deletePoemTerm, savePoemTerm } from "@/components/db/sql/queries-poetry-cafe";
import { SavePoemTermInput } from "@/components/db/types/poem-verses";

export async function savePoemTermAction(input: SavePoemTermInput) {
  const result = await savePoemTerm(input);

  if (result.success) {
    revalidatePath("/poem-terms");
    revalidatePath("/poem-terms/manage");
  }

  return result;
}

export async function deletePoemTermAction(input: { id: number }) {
  const result = await deletePoemTerm(input.id);

  if (result.success) {
    revalidatePath("/poem-terms");
    revalidatePath("/poem-terms/manage");
  }

  return result;
}