import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { GamesHomePage } from "@/features/games/components/games-home-page";
import { getGamesPageData } from "@/components/db/sql/queries-game-scoreboards";

export default async function GamesPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const gamesDataResult = await getGamesPageData(memberKeyDetails.familyId);

  const gamesData = gamesDataResult.success
    ? gamesDataResult.gamesData
    : {
      gameHistory: [],
      leaderboards: {
        lowScore: null,
        highScore: null,
        playerStats: [],
      },
      selectablePlayers: [],
      availableGames: [],
      activeGameStates: [],
    };

  return (
    <>
      <GamesHomePage
        gamesData={ gamesData }
        familyId={ memberKeyDetails.familyId }
        memberId={ memberKeyDetails.memberId }
        firstName={ memberKeyDetails.firstName }
      />
    </>
  );
}
