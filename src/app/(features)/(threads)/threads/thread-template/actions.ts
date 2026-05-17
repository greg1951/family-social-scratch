"use server";

import { getMemberPageDetails } from "@/features/family/services/family-services";
import { saveThreadTemplate as saveTemplate } from "@/components/db/sql/queries-thread-templates";
import { revalidatePath } from "next/cache";
import { ThreadTemplateInput, SaveThreadTemplateReturn } from "@/components/db/types/thread-templates";

export async function saveThreadTemplateAction(
  input: ThreadTemplateInput,
): Promise<SaveThreadTemplateReturn> {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false,
      message: "You must be signed in to save a template.",
    };
  }

  const result = await saveTemplate(input);

  if (result.success) {
    revalidatePath("/threads/thread-template");
  }

  return result;
}
