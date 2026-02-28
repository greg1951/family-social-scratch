'use server';
import { auth } from "@/auth";
import { getUser2fa } from "@/components/db/sql/queries-user";

export const generate2faSecret = async(email:string) => {
  const session = auth();
  

  const result2fa = await getUser2fa(email);
  if (!result2fa) {
    return {
      errror: true,
      message: "Authentication error"
    }
  };
}