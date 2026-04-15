'use server';

import { getMemberDetailsByEmail } from "@/components/db/sql/queries-family-member";
import { MemberKeyDetails } from "../types/family-steps";
import { auth } from "@/auth"; 
import { FounderDetails } from "../types/family-members";

export async function getMemberPageDetails(): Promise<MemberKeyDetails> {
  const session = await auth();
  if (!session) {
    // console.log("getMemberPageDetails: No session found");
    return {
      isLoggedIn: false,
      email: "",
      isFounder: false,
      isAdmin: false,
      firstName: "",
      lastName: "",
      familyId: 0,
      familyName: "",
      memberId: 0,
    }
  }
  
  // console.log("getMemberPageDetails: Session found");
  const memberDetails = await getMemberDetailsByEmail(session.user?.email as string);
  if (memberDetails.success) {
    const memberKeyDetails: MemberKeyDetails = {
      isLoggedIn: true,
      email: memberDetails.email!,
      isFounder: memberDetails.isFounder!,
      isAdmin: memberDetails.isAdmin ?? false,
      firstName: memberDetails.firstName!,
      lastName: memberDetails.lastName!,
      familyId: memberDetails.familyId!,
      familyName: memberDetails.familyName as string,
      memberId: memberDetails.memberId!,
    }
    return memberKeyDetails;
  }
  return {
    isLoggedIn: false,
    email: "",
    isFounder: false,
    isAdmin: false,
    firstName: "",
    lastName: "",
    familyId: 0,
    familyName: "",
    memberId: 0,
  }
}

