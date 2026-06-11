import { useMemo, useState } from "react";

import type { GamesPageData } from "@/components/db/types/game-scoreboard";
import {
  buildGameLeaderboards,
  filterGameHistory,
  getUniqueHistoryValues,
  groupGameHistoryByDate,
} from "@/features/games/utils/game-history-insights";

type UseGameHistoryInsightsArgs = {
  gamesData: GamesPageData;
  selectedGameId: number | null;
  winnerDirection: "high" | "low" | undefined;
  includeZeroScores: boolean;
};

export function useGameHistoryInsights({
  gamesData,
  selectedGameId,
  winnerDirection,
  includeZeroScores,
}: UseGameHistoryInsightsArgs) {
  const [gameStatusFilter, setGameStatusFilter] = useState("all");
  const [gameDateFilter, setGameDateFilter] = useState("all");
  const [gameTitleFilter, setGameTitleFilter] = useState("all");

  const filteredGameHistory = useMemo(
    () => filterGameHistory(gamesData.gameHistory, {
      selectedGameId,
      gameStatusFilter,
      gameDateFilter,
      gameTitleFilter,
    }),
    [gameDateFilter, gameStatusFilter, gameTitleFilter, gamesData.gameHistory, selectedGameId]
  );

  const groupedGameHistory = useMemo(
    () => groupGameHistoryByDate(filteredGameHistory, winnerDirection),
    [filteredGameHistory, winnerDirection]
  );

  const uniqueStatuses = useMemo(
    () => getUniqueHistoryValues(gamesData.gameHistory, "gameStatus"),
    [gamesData.gameHistory]
  );

  const uniqueDates = useMemo(
    () => getUniqueHistoryValues(gamesData.gameHistory, "gameStartDate"),
    [gamesData.gameHistory]
  );

  const uniqueTitles = useMemo(
    () => getUniqueHistoryValues(gamesData.gameHistory, "gameTitle"),
    [gamesData.gameHistory]
  );

  const gameLeaderboards = useMemo(
    () => buildGameLeaderboards(
      filteredGameHistory,
      selectedGameId,
      winnerDirection,
      includeZeroScores,
      gamesData.leaderboards
    ),
    [filteredGameHistory, gamesData.leaderboards, includeZeroScores, selectedGameId, winnerDirection]
  );

  return {
    gameStatusFilter,
    setGameStatusFilter,
    gameDateFilter,
    setGameDateFilter,
    gameTitleFilter,
    setGameTitleFilter,
    filteredGameHistory,
    groupedGameHistory,
    uniqueStatuses,
    uniqueDates,
    uniqueTitles,
    gameLeaderboards,
  };
}