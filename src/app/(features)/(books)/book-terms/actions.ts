'use server';

import { revalidatePath } from "next/cache";

import { deleteBookTerm, saveBookTerm } from "@/components/db/sql/queries-book-besties";
import { SaveBookTermInput } from "@/components/db/types/books";

export async function saveBookTermAction(input: SaveBookTermInput) {
  const result = await saveBookTerm(input);

  if (result.success) {
    revalidatePath("/book-terms");
    revalidatePath("/book-terms/manage");
  }

  return result;
}

export async function deleteBookTermAction(input: { id: number }) {
  const result = await deleteBookTerm(input.id);

  if (result.success) {
    revalidatePath("/book-terms");
    revalidatePath("/book-terms/manage");
  }

  return result;
}
