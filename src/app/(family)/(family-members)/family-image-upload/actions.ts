'use server';

import { revalidatePath } from "next/cache";
import { getMemberImageDetailsByMemberId, updateMemberImageUrl } from "@/components/db/sql/queries-family-member";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export async function getMemberImageUploadDetails() {
  const memberKeyDetails = await getMemberPageDetails();
  if (!memberKeyDetails.isLoggedIn) {
    return {
      success: false,
      message: "You must be logged in to access image upload.",
    };
  }

  const detailsResult = await getMemberImageDetailsByMemberId(memberKeyDetails.memberId);
  if (!detailsResult.success) {
    return detailsResult;
  }

  return {
    success: true,
    memberId: memberKeyDetails.memberId,
    firstName: detailsResult.firstName,
    lastName: detailsResult.lastName,
    memberImageUrl: detailsResult.memberImageUrl,
  };
}

export async function saveMemberImageUrl(memberImageUrl: string) {
  const memberKeyDetails = await getMemberPageDetails();
  if (!memberKeyDetails.isLoggedIn) {
    return {
      success: false,
      message: "You must be logged in to update your profile image.",
    };
  }

  const updateResult = await updateMemberImageUrl(memberKeyDetails.memberId, memberImageUrl);
  if (updateResult.success) {
    revalidatePath("/family-member-account");
    revalidatePath("/family-founder-account");
    revalidatePath("/family-image-upload");
  }

  return updateResult;
}
