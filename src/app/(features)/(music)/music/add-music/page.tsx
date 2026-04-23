import { redirect } from "next/navigation";

import { getMusicById, getMusicHomePageData } from "@/components/db/sql/queries-music";
import { MusicAddPage } from "@/features/music/components/music-add-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function AddMusicPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const { id } = await searchParams;
  const musicId = id ? parseInt(id, 10) : null;

  const [musicData, editMusicResult] = await Promise.all([
    getMusicHomePageData(
      memberKeyDetails.familyId,
      memberKeyDetails.memberId,
      memberKeyDetails.isAdmin ?? false
    ),
    musicId && !isNaN(musicId)
      ? getMusicById(memberKeyDetails.familyId, musicId, memberKeyDetails.memberId)
      : Promise.resolve(null),
  ]);

  const musicTags = musicData.success ? musicData.musicTags : [];
  const musicTemplates = musicData.success ? musicData.musicTemplates : [];

  // Only allow editing if the logged-in member is the submitter
  const initialMusic =
    editMusicResult?.success && editMusicResult.music.memberId === memberKeyDetails.memberId
      ? editMusicResult.music
      : null;

  const mode = initialMusic ? "edit" : "add";

  return (
    <MusicAddPage
      musicTags={ musicTags }
      musicTemplates={ musicTemplates }
      member={ memberKeyDetails }
      initialMusic={ initialMusic }
      mode={ mode }
    />
  );
}