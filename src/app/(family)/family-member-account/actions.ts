'use server';
import { getMemberDetailsByUserId, updateMemberDetails } from "@/components/db/sql/queries-family-member";
import { getUser2fa } from "@/components/db/sql/queries-user";
import { GetUser2faReturnType } from "@/components/db/types/user";
import { UpdateAccountDetails } from "@/features/auth/types/auth-types";
import { revalidatePath } from "next/cache";

/* Retrieve the user's 2FA details by email */
export const get2faDetails = async(email:string) => {
  
  const result2fa = await getUser2fa(email);
  if (!result2fa) {
    return {
      error: true,
      message: `2FA details NOT FOUND on ${email}`,
    }
  };
  const mfaReturn:GetUser2faReturnType = {
    success: true, 
    id: result2fa.id,  
    secret: result2fa.secret, 
    isActivated: result2fa.isActivated, 
  }
  return mfaReturn;
}


/* Retrieve user and member details by userId */
export const getMemberDetails = async(userId:number) => {
  const getResult = await getMemberDetailsByUserId(userId);
  // console.log("actions->getMemberDetails->getResult: ", getResult);
  return getResult;
}

export const updateDetails = async(updateAccountDetails:UpdateAccountDetails) => {
  const updateResult = await updateMemberDetails(updateAccountDetails);
  // console.log("actions->updateMemberDetails->updateResult: ", updateResult);
  
  if (updateResult.success) {
    revalidatePath("/family-member-account");
  }
  
  return updateResult;
}
