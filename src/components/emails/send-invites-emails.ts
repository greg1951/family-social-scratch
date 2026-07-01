'use server';

import { updateFamilyInviteToken } from "@/components/db/sql/queries-family-invite";
import { getSupportEnvironmentByPneumonic } from "@/components/db/sql/queries-support";
import { UpdateInviteTokenInput } from "../../features/family/types/family-steps";
import { familySocialEmail } from "../../features/family/constants/family-steps";
import MemberInviteEmail from "./templates/member-invite-email";
import React from "react";
import { randomBytes } from "crypto";
import { InsertInvitesReturn } from "@/components/db/types/family-member";
import { Resend } from 'resend';
import { FounderDetails } from "@/features/family/types/family-members";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendFamilyInviteEmails = async (
  familyInvites: Extract<InsertInvitesReturn, { success: true }>['invites'], 
  familyName: string, 
  founderDetails:FounderDetails ) => {

  const appEnv = process.env.APP_ENV?.trim().toLowerCase();
  if (!appEnv) {
    console.error("sendFamilyInviteEmails: APP_ENV was not provided.");
    return {
      error: true,
      message: "Unable to send invite emails because APP_ENV is not configured."
    };
  }

  const supportEnvironment = await getSupportEnvironmentByPneumonic(appEnv);
  if (!supportEnvironment) {
    console.error(`sendFamilyInviteEmails: APP_ENV '${ appEnv }' is not configured in supportEnvironment.`);
    return {
      error: true,
      message: `Unable to send invite emails because APP_ENV '${ appEnv }' was not found in supportEnvironment.`
    };
  }

  const effectiveUrl = `https://${ supportEnvironment.envPneumonic }.${ supportEnvironment.websiteDomain }`;

                                              
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

      const registerLink=`${effectiveUrl}/family-member-registration?token=${memberInviteToken}`; 
  
      const sendResult = await resend.emails.send({
        from: familySocialEmail,
        subject: "You're Invited to Join the My Family Social Platform",
        to: invite.email,
        react: React.createElement(MemberInviteEmail, 
          { memberName: invite.firstName, 
            founderName: `${founderDetails.firstName} ${founderDetails.lastName}`, 
            inviteFounderMessage: invite.inviteFounderMessage!,
            familyName: familyName,
            siteUrl: effectiveUrl,
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