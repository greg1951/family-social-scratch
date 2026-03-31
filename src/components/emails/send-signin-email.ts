'use server';

import { familySocialEmail } from "../../features/family/constants/family-steps";
import MemberSigninEmail from "./templates/member-signin-email";
import React from "react";
import { Resend } from 'resend';
import { getInvitebyInviteEmail } from "../db/sql/queries-family-invite";
import { FounderDetails } from "@/features/family/types/family-members";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendLoginInstructionsEmail = async (
    inviteEmail: string, 
    founderDetails:FounderDetails ) => {
                                              
  if (inviteEmail) {
    const userInfo = await getInvitebyInviteEmail(inviteEmail);
    if (userInfo.error) {
      return;
    }  
    const sendResult = await resend.emails.send({
      from: familySocialEmail,
      subject: "Your Instructions to Sign In to Family Social",
      to: inviteEmail,
      react: React.createElement(MemberSigninEmail, 
        { memberName: userInfo.firstName, 
          founderName: `${founderDetails.firstName} ${founderDetails.lastName}`, 
          familyName: founderDetails.familyName,
          link: `${process.env.NEXT_PUBLIC_BASE_URL}/login` }),
    });
    
    if (!sendResult) {
      return {
        error: true,
        message: `Failed to send invite email to ${inviteEmail}`
      }
    }
  }
  else {
    const errorMessage = "No invite email provided to send login instructions to";
    console.warn(`sendLoginInstructionsEmail->${errorMessage}`);
    return {
      error: true,
      message: errorMessage
    }
  }  
  return {
    error: false,
    message: "Family member email sent successfully"
  }
}