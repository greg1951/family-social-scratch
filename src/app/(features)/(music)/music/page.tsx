import { redirect } from "next/navigation";

import { resolveGuidedTourLaunch, type GuidedTourLaunchPayload } from "@/components/db/sql/queries-guided-runtime";
import { getMusicHomePageData } from "@/components/db/sql/queries-music";
import { MusicHomePage } from "@/features/music/components/music-home-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function MusicPage() {
  const memberKeyDetails = await getMemberPageDetails();
  let initialGuidedLaunchPayload: GuidedTourLaunchPayload | null = null;

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const musicData = await getMusicHomePageData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
    memberKeyDetails.isAdmin ?? false
  );

  const musics = musicData.success ? musicData.musics : [];

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

  return <MusicHomePage musics={ musics } member={ memberKeyDetails } initialGuidedLaunchPayload={ initialGuidedLaunchPayload } />;
}