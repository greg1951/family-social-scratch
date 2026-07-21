import { redirect } from "next/navigation";

import { resolveGuidedTourLaunch, type GuidedTourLaunchPayload } from "@/components/db/sql/queries-guided-runtime";
import { getTvHomePageData } from "@/components/db/sql/queries-tv";
import { TvHomePage } from "@/features/tv/components/tv-home-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function TvPage() {
  const memberKeyDetails = await getMemberPageDetails();
  let initialGuidedLaunchPayload: GuidedTourLaunchPayload | null = null;

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const tvData = await getTvHomePageData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
    memberKeyDetails.isAdmin ?? false
  );

  const shows = tvData.success ? tvData.shows : [];

  const guidedLaunchResult = await resolveGuidedTourLaunch({
    memberId: memberKeyDetails.memberId,
    familyId: memberKeyDetails.familyId,
    isFounder: memberKeyDetails.isFounder,
    audienceType: "member",
    tourKey: "tv_tour",
  });

  if (guidedLaunchResult.success && guidedLaunchResult.launch) {
    initialGuidedLaunchPayload = guidedLaunchResult.payload;
  }

  return <TvHomePage shows={ shows } member={ memberKeyDetails } initialGuidedLaunchPayload={ initialGuidedLaunchPayload } />;
}