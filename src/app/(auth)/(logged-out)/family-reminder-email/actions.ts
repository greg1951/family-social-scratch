'use server';

import { auth } from "@/auth";
import { getUserFamilyNameByEmail } from "@/components/db/sql/queries-family-user";
import { getUserByEmail } from "@/components/db/sql/queries-user";

import { mailer } from "@/lib/email";

export const sendFamilyNameEmail = async (email: string) => {
  const session = await auth();
  if (!!session?.user?.id) {
    return {
      error: true,
      message: "You are already logged in"
    }
  };
     
  const userInfo = await getUserByEmail(email);
  if (!userInfo.success) {
    return;
  }

  let findResultText:string="";
  const userFamilyInfo = await getUserFamilyNameByEmail(email);
  if (!userFamilyInfo.success) {
    findResultText=`😒 Unfortunately, we could not find your email amongst our registered users. The family founder (whose name we cannot share for privacy reasons) would need to invite you to register.`;
  }
  else {
    findResultText=`😁 We were able to find your email amongst our registered users. Use this Family Name when you login: 👉${userFamilyInfo.familyName}👈`
  }


  const sendResult = await mailer.sendMail({
    from: "test@resend.dev",
    subject: "Your Family Name Reminder",
    to: email,
    text: `It seems you forgot your Family Name, mon dieu! ${findResultText} `,
  });

  if (!sendResult.accepted) {
    return {
      error: true,
      message: "Reset Password email did not send"
    }
  }

  return {
    error: false,
  }
  
}