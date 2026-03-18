'use server';

import { updateFamilyMemberStatus } from "@/components/db/sql/queries-family-member";
import { CurrentMembersValues } from "@/features/family/types/family-members";

export async function updateCurrentMembers({currentMembers, originalMembers}
  : { currentMembers: CurrentMembersValues, originalMembers: CurrentMembersValues }  ) {

  const updateResult = await updateFamilyMemberStatus({
    currentMemberValues: currentMembers,
    originalMemberValues: originalMembers,
  });
  if (!updateResult.success) {
    console.error('Error updating family members:', updateResult.message);
  }
  return updateResult;
}