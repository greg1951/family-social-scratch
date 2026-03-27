'use server';

import { updateFamilyInviteToken } from "@/components/db/sql/queries-family-invite";
import { FounderDetails, UpdateInviteTokenInput } from "../../features/family/types/family-steps";
import { familySocialEmail, familySocialHostReference } from "../../features/family/constants/family-steps";
import MemberInviteEmail from "./templates/member-invite-email";
import React from "react";
import { randomBytes } from "crypto";
import { InsertInvitesReturn } from "@/components/db/types/family-member";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendFamilyInviteEmails = async (
  familyInvites: Extract<InsertInvitesReturn, { success: true }>['invites'], 
  familyName: string, 
  founderDetails:FounderDetails ) => {

                                              
  if (familyInvites) {
    for (const invite of familyInvites) {
      const memberInviteToken = randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 604800000); //7 days in ms
      const inviteTokenData: UpdateInviteTokenInput = {
        inviteId: invite.id,
        token: memberInviteToken,
        expiry: tokenExpiry
      }
      const updateTokenResult = await updateFamilyInviteToken({ inviteToken: inviteTokenData });
      if (updateTokenResult.error) {
        return {
          error: true,
          message: `Failed to update invite token for ${invite.email}: ${updateTokenResult.message}`
        }
      };

      const registerLink=`${familySocialHostReference}/family-member-registration?token=${memberInviteToken}`; 
  
      const sendResult = await resend.emails.send({
        from: familySocialEmail,
        subject: "You're Invited to Join the Family Social Platform",
        to: invite.email,
        react: React.createElement(MemberInviteEmail, 
          { memberName: invite.firstName, 
            founderName: `${founderDetails.firstName} ${founderDetails.lastName}`, 
            familyName: familyName,
            link: registerLink, 
          }),
      });
      if (!sendResult) {
        return {
          error: true,
          message: `Failed to send invite email to ${invite.email}`
        }
      }
      return {
        error: false,
        message: `Invite email sent successfully to ${invite.email}`
      }
    }  
  }

  return {
    error: false,
    message: "Family member email sent successfully"
  }
}