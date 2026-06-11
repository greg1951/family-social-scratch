import type {
  GameHistoryRow,
  GamesPageData,
  LeaderboardHighScore,
  LeaderboardLowScore,
  PlayerStats,
} from "@/components/db/types/game-scoreboard";

type GameLeaderboards = GamesPageData["leaderboards"];

export function getUniqueHistoryValues(
  gameHistory: GameHistoryRow[],
  field: "gameStatus" | "gameStartDate" | "gameTitle"
) {
  return Array.from(new Set(gameHistory.map((row) => row[field])));
}

export function filterGameHistory(
  gameHistory: GameHistoryRow[],
  filters: {
    selectedGameId: number | null;
    gameStatusFilter: string;
    gameDateFilter: string;
    gameTitleFilter: string;
  }
) {
  return gameHistory.filter((game) => {
    if (filters.selectedGameId && game.gameMetaId !== filters.selectedGameId) {
      return false;
    }

    if (filters.gameStatusFilter !== "all" && game.gameStatus !== filters.gameStatusFilter) {
      return false;
    }

    if (filters.gameDateFilter !== "all" && game.gameStartDate !== filters.gameDateFilter) {
      return false;
    }

    if (filters.gameTitleFilter !== "all" && game.gameTitle !== filters.gameTitleFilter) {
      return false;
    }

    return true;
  });
}

export function groupGameHistoryByDate(
  filteredGameHistory: GameHistoryRow[],
  winnerDirection: "high" | "low" | undefined
) {
  const groups = new Map<string, Map<number, GameHistoryRow[]>>();

  filteredGameHistory.forEach((game) => {
    const date = game.gameStartDate;
    const gameId = game.gameId;

    if (!groups.has(date)) {
      groups.set(date, new Map());
    }

    const dateMap = groups.get(date)!;
    if (!dateMap.has(gameId)) {
      dateMap.set(gameId, []);
    }

    const gameRows = dateMap.get(gameId)!;
    gameRows.push(game);
    gameRows.sort((left, right) =>
      winnerDirection === "high"
        ? right.gameScore - left.gameScore
        : left.gameScore - right.gameScore
    );
  });

  return groups;
}

function findExtremeScore(
  completedGamesByType: GameHistoryRow[],
  comparator: (candidate: GameHistoryRow, current: GameHistoryRow) => boolean
): LeaderboardLowScore | LeaderboardHighScore | null {
  if (completedGamesByType.length === 0) {
    return null;
  }

  const row = completedGamesByType.reduce((current, candidate) =>
    comparator(candidate, current) ? candidate : current
  );

  return {
    playerFirstName: row.playerFirstName,
    playerLastName: row.playerLastName,
    gameScore: row.gameScore,
    gameStartDate: row.gameStartDate,
  };
}

export function buildGameLeaderboards(
  filteredGameHistory: GameHistoryRow[],
  selectedGameId: number | null,
  winnerDirection: "high" | "low" | undefined,
  includeZeroScores: boolean,
  fallbackLeaderboards: GameLeaderboards
): GameLeaderboards {
  if (!selectedGameId) {
    return fallbackLeaderboards;
  }

  const completedGamesByType = filteredGameHistory.filter(
    (row) => row.gameStatus === "completed" && (includeZeroScores || row.gameScore !== 0)
  );

  if (completedGamesByType.length === 0) {
    return {
      lowScore: null,
      highScore: null,
      playerStats: [],
    };
  }

  const playerStatsMap = new Map<number, {
    playerFirstName: string;
    playerLastName: string;
    gamesPlayed: number;
    gamesWon: number;
  }>();

  for (const game of completedGamesByType) {
    const current = playerStatsMap.get(game.playerId) ?? {
      playerFirstName: game.playerFirstName,
      playerLastName: game.playerLastName,
      gamesPlayed: 0,
      gamesWon: 0,
    };

    const isWin = winnerDirection === "high" ? game.isHighest : game.isLowest;
    if (isWin) {
      current.gamesWon += 1;
    }

    playerStatsMap.set(game.playerId, current);
  }

  for (const [playerId, stats] of playerStatsMap) {
    const playerGames = new Set(
      completedGamesByType
        .filter((game) => game.playerId === playerId)
        .map((game) => game.gameId)
    );

    stats.gamesPlayed = playerGames.size;
  }

  const playerStats: PlayerStats[] = Array.from(playerStatsMap.values())
    .map((row) => ({
      playerFirstName: row.playerFirstName,
      playerLastName: row.playerLastName,
      gamesPlayed: row.gamesPlayed,
      gamesWon: row.gamesWon,
      gamesLost: row.gamesPlayed - row.gamesWon,
    }))
    .sort((left, right) => {
      if (left.gamesWon === right.gamesWon) {
        return left.playerFirstName.localeCompare(right.playerFirstName);
      }

      return right.gamesWon - left.gamesWon;
    });

  return {
    lowScore: findExtremeScore(
      completedGamesByType,
      (candidate, current) => candidate.gameScore < current.gameScore
    ) as LeaderboardLowScore | null,
    highScore: findExtremeScore(
      completedGamesByType,
      (candidate, current) => candidate.gameScore > current.gameScore
    ) as LeaderboardHighScore | null,
    playerStats,
  };
}