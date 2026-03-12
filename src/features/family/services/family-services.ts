'use server';

import { getMemberDetailsByEmail } from "@/components/db/sql/queries-family-member";
import { MemberKeyDetails } from "../types/family-steps";
import { auth } from "@/auth"; 

export async function getMemberPageDetails(): Promise<MemberKeyDetails> {
  const session = await auth();
  if (!session) {
    console.log("getMemberPageDetails: No session found");
    return {
      isLoggedIn: false,
      email: "",
      isFounder: false,
      firstName: "",
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
      firstName: memberDetails.firstName!,
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
    firstName: "",
    familyId: 0,
    familyName: "",
    memberId: 0,
  }
}