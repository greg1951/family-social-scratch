import { redirect } from "next/navigation";

import { getTvTemplateManagementData } from "@/components/db/sql/queries-tv";
import { TvTemplatePage } from "@/features/tv/components/tv-template-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function TvTemplatesPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const templateData = await getTvTemplateManagementData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
    memberKeyDetails.isAdmin ?? false
  );

  const templates = templateData.success ? templateData.templates : [];

  return <TvTemplatePage templates={ templates } />;
}
