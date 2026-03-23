'use server';

import { auth } from "@/auth";
import { sendPasswordResetEmail } from "@/components/emails/send-reset-email";

export const passwordReset = async (email: string) => {
  const session = await auth();
  if (!!session?.user?.id) {
    return {
      error: true,
      message: "You are already logged in"
    }
  };
     
  const sendResult = await sendPasswordResetEmail(email);
  if (sendResult?.error) {
    return {
      error: true,
      message: sendResult.message || "An error occurred while sending the reset email"
    }
  }
  return {
    error: false,
  }

}