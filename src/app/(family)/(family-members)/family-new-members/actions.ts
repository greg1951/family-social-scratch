'use server';

import { addNewInvites as addNewInvitesQuery } from "@/components/db/sql/queries-family-invite";
import { FounderDetails, NewFamilyInvites } from "@/features/family/types/family-members";
import { InsertInvitesReturn } from "@/components/db/types/family-member";

import { RegistrationMemberDetails } from "@/features/family/types/family-steps";
import { sendFamilyInviteEmails } from "@/components/emails/send-invites-emails";
import { AccountDetails } from "@/features/auth/types/auth-types";
import { revalidatePath } from "next/cache";


export async function addNewAccountInvites({newInvites, familyId}: { newInvites: NewFamilyInvites, familyId: number }): Promise<InsertInvitesReturn> {
  
  // console.log('addNewAccountInvites->newInvites: ', newInvites); 
  const addInvitesResult = await addNewInvitesQuery({ newInvites, familyId });
  if (!addInvitesResult.success) {
    console.error('Error adding new invites:', addInvitesResult.message);
    return {
      success: false,
      message: addInvitesResult.message,
    }
  }

  revalidatePath("/family-founder-account");
  
  return addInvitesResult;
}

export const sendEmails = async (
  familyInvites: Extract<InsertInvitesReturn, { success: true }>['invites'],
  familyName: string,
  familyId: number,
  accountDetails: RegistrationMemberDetails,
) => {
 
  if (familyInvites) {
    const memberDetails: FounderDetails = {
      email: accountDetails.email,
      firstName: accountDetails.firstName,
      lastName: accountDetails.lastName,
      nickName: accountDetails.nickName,
      status: 'invited',
      memberId: 0, // This will be updated when the founder accepts the invite and is added as a member in the database
      familyName: familyName,
      familyId: familyId,
      isFounder: true,
    };

    const sendResult = await sendFamilyInviteEmails(familyInvites, familyName, memberDetails);
    return sendResult;

  }
  else {    
    console.warn("sendEmails->Called with no family invites to send.");
    return {
      error: false,
      message: "No family invites to send."
    }
  }
};
