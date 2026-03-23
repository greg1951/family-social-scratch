import { getUserByEmail } from "@/components/db/sql/queries-user";
import { randomBytes } from "crypto";
import { insertPasswordToken } from "@/components/db/sql/queries-passwordReset";
import { InsertRecordType } from "@/components/db/types/passwordReset";
import * as React from "react";
import { Resend } from 'resend';
import { mailer } from "@/lib/email";
import PasswordResetEmail from "@/components/emails/templates/password-reset-email";

export const sendPasswordResetEmail = async (email: string) => {

  const userInfo = await getUserByEmail(email);
  if (!userInfo.success) {
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const passwordResetToken = randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 3600000); //3.6M ms is 1 hour
  const insertRecord: InsertRecordType = {
    userId: userInfo.id as number,
    token: passwordResetToken,
    tokenExpiry: tokenExpiry
  }
  // console.log('passwordReset->insertRecord: ', insertRecord);
  const insertResult = await insertPasswordToken(insertRecord);
  if (insertResult.error) {
    return insertResult;
  }
  
  const resetLink=`${process.env.SITE_BASE_URL}/update-password?token=${insertRecord.token}`; 
  const sendResult = await resend.emails.send({
    from: "admin@updates.knotboardgames.com",
    subject: "Your Password Reset Request",
    to: email,
    react: React.createElement(PasswordResetEmail, { link: resetLink, }),
  });
  
  // console.log('passwordReset->sendResult: ',sendResult)
  if (sendResult.error) {
    return {
      error: true,
      message: "Reset Password email did not send"
    }
  }

  return {
    error: false,
  }
}
