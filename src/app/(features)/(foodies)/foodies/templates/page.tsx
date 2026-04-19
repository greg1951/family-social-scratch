import { redirect } from "next/navigation";

import { getFoodiesTemplateManagementData } from "@/components/db/sql/queries-foodies";
import { FoodiesTemplatePage } from "@/features/foodies/components/foodies-template-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function FoodiesTemplatesPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const templateData = await getFoodiesTemplateManagementData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
    memberKeyDetails.isAdmin ?? false
  );

  const templates = templateData.success ? templateData.templates : [];

  return <FoodiesTemplatePage templates={ templates } />;
}
