'use server';

import { updateFamilyInviteStatuses } from "@/components/db/sql/queries-family-invite";
import { CurrentMembersValues } from "@/features/family/types/family-members";
import { revalidatePath } from "next/cache";

export async function updateCurrentMembers({currentMembers, originalMembers}
  : { currentMembers: CurrentMembersValues, originalMembers: CurrentMembersValues }  ) {

  const updateResult = await updateFamilyInviteStatuses({
    currentMemberValues: currentMembers,
    originalMemberValues: originalMembers,
  });
  if (!updateResult.success) {
    console.error('Error updating family members:', updateResult.message);
  }

  if (updateResult.success) {
    revalidatePath("/family-founder-account");
  }

  return updateResult;
}