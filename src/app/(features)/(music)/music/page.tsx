import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getMemberNotifications } from "@/components/db/sql/queries-family-notifications";
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
  const notificationsResult = await getMemberNotifications(memberKeyDetails.memberId);
  const session = await auth();

  const musics = musicData.success ? musicData.musics : [];
  const musicPlayerOptions = notificationsResult.success
    ? notificationsResult.notifications.filter((notification) => notification.optionCategory.toLowerCase() === "player")
    : [];
  const hasSpotifyAccessToken = Boolean((session as { spotifyAccessToken?: string | null } | null)?.spotifyAccessToken?.trim());
  const selectedSpotifyPlayer = musicPlayerOptions.find((notification) => notification.isSelected && notification.optionName.toLowerCase().includes("spotify"));

  console.log("[music-page] spotify gating debug", {
    memberId: memberKeyDetails.memberId,
    familyId: memberKeyDetails.familyId,
    isLoggedIn: memberKeyDetails.isLoggedIn,
    hasSpotifyAccessToken,
    spotifySessionTokenValue: (session as { spotifyAccessToken?: string | null } | null)?.spotifyAccessToken ?? null,
    selectedPlayerOption: selectedSpotifyPlayer?.optionName ?? null,
    musicPlayerOptions: musicPlayerOptions.map((option) => ({
      optionName: option.optionName,
      isSelected: option.isSelected,
    })),
  });

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

  return (
    <MusicHomePage
      musics={ musics }
      member={ memberKeyDetails }
      initialGuidedLaunchPayload={ initialGuidedLaunchPayload }
      hasSpotifyAccessToken={ hasSpotifyAccessToken }
      musicPlayerOptions={ musicPlayerOptions }
    />
  );
}