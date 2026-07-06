import { redirect } from "next/navigation";

import { getMusicTemplateManagementData } from "@/components/db/sql/queries-music";
import { MusicTemplateRecord } from "@/components/db/types/music";
import { MusicTemplatePage } from "@/features/music/components/music-template-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function MusicTemplatesPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  let templates: MusicTemplateRecord[] = [];

  try {
    const templateData = await getMusicTemplateManagementData(
      memberKeyDetails.familyId,
      memberKeyDetails.memberId,
      memberKeyDetails.isAdmin ?? false
    );

    templates = templateData.success ? templateData.templates : [];
  } catch {
    templates = [];
  }

  return <MusicTemplatePage templates={ templates } />;
}