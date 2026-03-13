'use server';

import { updateFamilyInviteToken } from "@/components/db/sql/queries-family-member";
import { InsertInvitesInput, InsertInvitesReturn } from "@/components/db/types/family-member";
import { MemberInviteEmail } from "@/features/family/services/member-invite-email";
import { FounderDetails, UpdateInviteTokenInput } from "@/features/family/types/family-steps";
import { mailer } from "@/lib/email";
import { randomBytes } from "crypto";
import * as React from "react";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);


export const sendFamilyMemberEmails = async (familyInvites: InsertInvitesReturn['invites'], familyName: string, founderDetails:FounderDetails ) => {
  
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

      const registerLink=`${process.env.SITE_BASE_URL}/family-member-registration?token=${memberInviteToken}`; 
  
      const sendResult = await resend.emails.send({
        from: "admin@updates.knotboardgames.com",
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





    
    // let findResultText:string="";
  // const userFamilyInfo = await getUserFamilyNameByEmail(email);
  // if (!userFamilyInfo.success) {
  //   findResultText=`😒 Unfortunately, we could not find your email amongst our registered users. The family founder (whose name we cannot share for privacy reasons) would need to invite you to register.`;
  // }
  // else {
  //   findResultText=`😁 We were able to find your email amongst our registered users. Use this Family Name when you login: 👉${userFamilyInfo.familyName}👈`
  // }


  // const sendResult = await mailer.sendMail({
  //   from: "test@resend.dev",
  //   subject: "Your Family Name Reminder",
  //   to: email,
  //   text: `It seems you forgot your Family Name, mon dieu! ${findResultText} `,
  // });

  // if (!sendResult.accepted) {
  //   return {
  //     error: true,
  //     message: "Reset Password email did not send"
  //   }
  // }

  return {
    error: false,
    message: "Family member email sent successfully"
  }
}