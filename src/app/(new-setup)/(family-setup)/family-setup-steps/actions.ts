'use server';

import { InsertInvitesReturn } from "@/components/db/types/family-member";
import { getMemberDetailsByEmail } from "@/components/db/sql/queries-family-member";

import { RegistrationMemberDetails } from "@/features/family/types/family-steps";
import { Resend } from 'resend';
import { sendFamilyInviteEmails } from "@/components/emails/send-invites-emails";
import { FounderDetails } from "@/features/family/types/family-members";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmails = async (
    familyInvites: Extract<InsertInvitesReturn, { success: true }>['invites'], 
    familyName: string, 
    founderDetails: FounderDetails ) => {
 
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

export const isMemberEmailInUse = async (email: string): Promise<{ exists: boolean }> => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return { exists: false };
  }

  const memberResult = await getMemberDetailsByEmail(normalizedEmail);
  return { exists: memberResult.success };
};
