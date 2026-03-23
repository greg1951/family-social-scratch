'use server';

import { addNewInvites as addNewInvitesQuery } from "@/components/db/sql/queries-family-invite";
import { NewFamilyInvites } from "@/features/family/types/family-members";
import { InsertInvitesReturn } from "@/components/db/types/family-member";

import { FounderDetails } from "@/features/family/types/family-steps";
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
  accountDetails: AccountDetails,
) => {
 
  if (familyInvites) {
    const founderDetails: FounderDetails = {
      firstName: accountDetails.accountDetails.firstName,
      lastName: accountDetails.accountDetails.lastName,
      nickName: accountDetails.accountDetails.nickName,
      email: accountDetails.accountDetails.email,
      familyId,
      isFounder: true,
    };

    const sendResult = await sendFamilyInviteEmails(familyInvites, familyName, founderDetails);
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
