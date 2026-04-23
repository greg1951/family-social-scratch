import { redirect } from "next/navigation";

import { getMusicById, getMusicLyricsByMusicId } from "@/components/db/sql/queries-music";
import { MusicLyricsPage } from "@/features/music/components/music-lyrics-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function LyricsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const { id } = await searchParams;
  const musicId = id ? parseInt(id, 10) : null;

  if (!musicId || Number.isNaN(musicId)) {
    redirect("/music");
  }

  const [musicResult, lyricsResult] = await Promise.all([
    getMusicById(memberKeyDetails.familyId, musicId, memberKeyDetails.memberId),
    getMusicLyricsByMusicId(memberKeyDetails.familyId, musicId),
  ]);

  if (!musicResult.success || !musicResult.music.isSong || !lyricsResult.success) {
    redirect("/music");
  }

  const canSaveLyrics = lyricsResult.lyrics
    ? lyricsResult.lyrics.memberId === memberKeyDetails.memberId
    : musicResult.music.memberId === memberKeyDetails.memberId;

  return <MusicLyricsPage music={ musicResult.music } initialLyrics={ lyricsResult.lyrics } canSaveLyrics={ canSaveLyrics } />;
}
