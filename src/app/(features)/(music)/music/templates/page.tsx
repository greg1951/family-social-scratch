import { redirect } from "next/navigation";

import { resolveGuidedTourLaunch, type GuidedTourLaunchPayload } from "@/components/db/sql/queries-guided-runtime";
import { getMusicTemplateManagementData } from "@/components/db/sql/queries-music";
import { MusicTemplateRecord } from "@/components/db/types/music";
import { MusicTemplatePage } from "@/features/music/components/music-template-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function MusicTemplatesPage() {
  const memberKeyDetails = await getMemberPageDetails();
  let initialGuidedLaunchPayload: GuidedTourLaunchPayload | null = null;

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

  const guidedLaunchResult = await resolveGuidedTourLaunch({
    memberId: memberKeyDetails.memberId,
    familyId: memberKeyDetails.familyId,
    isFounder: memberKeyDetails.isFounder,
    audienceType: "member",
    tourKey: "music_salon",
  });

  if (guidedLaunchResult.success && guidedLaunchResult.launch) {
    initialGuidedLaunchPayload = guidedLaunchResult.payload;
  }

  return <MusicTemplatePage templates={ templates } initialGuidedLaunchPayload={ initialGuidedLaunchPayload } />;
}