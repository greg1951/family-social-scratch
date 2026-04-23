import { redirect } from "next/navigation";

import { getMusicHomePageData } from "@/components/db/sql/queries-music";
import { MusicHomePage } from "@/features/music/components/music-home-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function MusicPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const musicData = await getMusicHomePageData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
    memberKeyDetails.isAdmin ?? false
  );

  const musics = musicData.success ? musicData.musics : [];

  return <MusicHomePage musics={ musics } member={ memberKeyDetails } />;
}