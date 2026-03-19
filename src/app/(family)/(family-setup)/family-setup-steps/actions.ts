'use server';

import { InsertInvitesReturn } from "@/components/db/types/family-member";

import { FounderDetails } from "@/features/family/types/family-steps";
import { Resend } from 'resend';
import { sendFamilyInviteEmails } from "@/features/family/services/send-invites-emails";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmails = async (familyInvites: Extract<InsertInvitesReturn, { success: true }>['invites'], 
                                             familyName: string, 
                                             founderDetails:FounderDetails ) => {
 
  if (familyInvites) {
    const sendResult = await sendFamilyInviteEmails(familyInvites, familyName, founderDetails);
    return sendResult;
  }
  else {    
    console.warn("sendEmails called with no family invites to send.");
    return {
      error: false,
      message: "No family invites to send."
    }
  }
};
