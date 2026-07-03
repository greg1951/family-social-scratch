'use server';

import { updateMemberDetails } from "@/components/db/sql/queries-family-member";
import { updateFamilyFeatureConfig } from "@/components/db/sql/queries-family-features";
import { UpdateAccountDetails } from "@/features/auth/types/auth-types";
import { FeatureConfigDirtyFields, FeatureConfigFormValues } from "@/features/family/types/family-steps";
import { revalidatePath } from "next/cache";

export const updateDetails = async(updateAccountDetails:UpdateAccountDetails) => {
  const updateResult = await updateMemberDetails(updateAccountDetails);
  // console.log("actions->updateMemberDetails->updateResult: ", updateResult);
  
  if (updateResult.success) {
    revalidatePath("/family-founder-account");
  }
  
  return updateResult;
}

export const updateFeatures = async ({
  featureConfigFormValues,
  featureConfigDirtyFields,
}: {
  featureConfigFormValues: FeatureConfigFormValues;
  featureConfigDirtyFields: FeatureConfigDirtyFields;
}) => {
  const updateResult = await updateFamilyFeatureConfig({
    featureConfigFormValues,
    featureConfigDirtyFields,
  });

  if (updateResult.success) {
    revalidatePath("/family-founder-account");
  }

  return updateResult;
};
