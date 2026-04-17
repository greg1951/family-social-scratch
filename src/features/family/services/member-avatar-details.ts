'use server';

import { getMemberImageDetailsByMemberId } from "@/components/db/sql/queries-family-member";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export type CurrentMemberAvatarDetails = {
  isLoggedIn: boolean;
  email: string;
  firstName: string;
  lastName: string;
  isFounder: boolean;
  memberId: number;
  memberImageUrl: string | null;
};

export async function getCurrentMemberAvatarDetails(): Promise<CurrentMemberAvatarDetails> {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    return {
      isLoggedIn: false,
      email: "",
      firstName: "",
      lastName: "",
      isFounder: false,
      memberId: 0,
      memberImageUrl: null,
    };
  }

  const imageResult = await getMemberImageDetailsByMemberId(memberKeyDetails.memberId);

  return {
    isLoggedIn: true,
    email: memberKeyDetails.email,
    firstName: memberKeyDetails.firstName,
    lastName: memberKeyDetails.lastName,
    isFounder: memberKeyDetails.isFounder,
    memberId: memberKeyDetails.memberId,
    memberImageUrl: imageResult.success ? imageResult.memberImageUrl ?? null : null,
  };
}
