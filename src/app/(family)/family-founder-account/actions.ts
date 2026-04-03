'use server';

import { updateMemberDetails } from "@/components/db/sql/queries-family-member";
import { UpdateAccountDetails } from "@/features/auth/types/auth-types";
import { revalidatePath } from "next/cache";

export const updateDetails = async(updateAccountDetails:UpdateAccountDetails) => {
  const updateResult = await updateMemberDetails(updateAccountDetails);
  // console.log("actions->updateMemberDetails->updateResult: ", updateResult);
  
  if (updateResult.success) {
    revalidatePath("/family-founder-account");
  }
  
  return updateResult;
}
