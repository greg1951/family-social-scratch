import { describe, expect, it } from "vitest";
import type { GameHistoryRow, GamesPageData } from "@/components/db/types/game-scoreboard";
import {
  buildGameLeaderboards,
  filterGameHistory,
  getUniqueHistoryValues,
  groupGameHistoryByDate,
} from "@/features/games/utils/game-history-insights";

function createHistoryRow(overrides: Partial<GameHistoryRow>): GameHistoryRow {
  return {
    gameId: 1,
    gameMetaId: 10,
    playerId: 101,
    gameStartDate: "2026-05-01",
    playerFirstName: "Alex",
    playerLastName: "Rivera",
    gameScore: 42,
    gameStatus: "completed",
    gameTitle: "Friday Night Scorecard",
    playerPosition: 1,
    isLowest: false,
    isHighest: true,
    ...overrides,
  };
}

describe("game-history-insights", () => {
  it("collects unique values for a history field", () => {
    const rows = [
      createHistoryRow({ gameStatus: "completed" }),
      createHistoryRow({ gameId: 2, playerId: 102, gameStatus: "in_progress" }),
      createHistoryRow({ gameId: 3, playerId: 103, gameStatus: "completed" }),
    ];

    expect(getUniqueHistoryValues(rows, "gameStatus")).toEqual(["completed", "in_progress"]);
  });

  it("filters by selected game id, status, date, and title together", () => {
    const rows = [
      createHistoryRow({ gameId: 1, gameMetaId: 10, gameStatus: "completed", gameStartDate: "2026-05-01", gameTitle: "Game A" }),
      createHistoryRow({ gameId: 2, gameMetaId: 10, playerId: 102, gameStatus: "archived", gameStartDate: "2026-05-01", gameTitle: "Game B" }),
      createHistoryRow({ gameId: 3, gameMetaId: 11, playerId: 103, gameStatus: "completed", gameStartDate: "2026-05-02", gameTitle: "Game A" }),
    ];

    expect(filterGameHistory(rows, {
      selectedGameId: 10,
      gameStatusFilter: "completed",
      gameDateFilter: "2026-05-01",
      gameTitleFilter: "Game A",
    })).toEqual([rows[0]]);
  });

  it("groups by date and sorts scores descending for high-wins games", () => {
    const rows = [
      createHistoryRow({ gameId: 5, playerId: 101, playerFirstName: "Alex", gameScore: 15 }),
      createHistoryRow({ gameId: 5, playerId: 102, playerFirstName: "Blair", gameScore: 33, isHighest: true, isLowest: false, playerPosition: 1 }),
      createHistoryRow({ gameId: 6, playerId: 103, playerFirstName: "Casey", gameStartDate: "2026-05-02", gameScore: 11 }),
    ];

    const grouped = groupGameHistoryByDate(rows, "high");
    const mayFirstGame = grouped.get("2026-05-01")?.get(5);

    expect(grouped.get("2026-05-01")?.size).toBe(1);
    expect(mayFirstGame?.map((row) => row.playerFirstName)).toEqual(["Blair", "Alex"]);
    expect(grouped.get("2026-05-02")?.get(6)?.[0]?.playerFirstName).toBe("Casey");
  });

  it("returns fallback leaderboards when no game type is selected", () => {
    const fallbackLeaderboards: GamesPageData["leaderboards"] = {
      lowScore: {
        playerFirstName: "Fallback",
        playerLastName: "Player",
        gameScore: 9,
        gameStartDate: "2026-04-01",
      },
      highScore: {
        playerFirstName: "Fallback",
        playerLastName: "Winner",
        gameScore: 99,
        gameStartDate: "2026-04-01",
      },
      playerStats: [
        {
          playerFirstName: "Fallback",
          playerLastName: "Stats",
          gamesPlayed: 1,
          gamesWon: 1,
          gamesLost: 0,
        },
      ],
    };

    expect(buildGameLeaderboards([], null, "high", fallbackLeaderboards)).toBe(fallbackLeaderboards);
  });

  it("builds leaderboards and distinct player stats for completed games", () => {
    const rows = [
      createHistoryRow({
        gameId: 1,
        playerId: 101,
        playerFirstName: "Alex",
        playerLastName: "Rivera",
        gameScore: 50,
        isHighest: true,
        isLowest: false,
      }),
      createHistoryRow({
        gameId: 1,
        playerId: 102,
        playerFirstName: "Blair",
        playerLastName: "Ng",
        gameScore: 40,
        isHighest: false,
        isLowest: true,
        playerPosition: 2,
      }),
      createHistoryRow({
        gameId: 2,
        playerId: 101,
        playerFirstName: "Alex",
        playerLastName: "Rivera",
        gameScore: 35,
        isHighest: false,
        isLowest: true,
        playerPosition: 2,
        gameStartDate: "2026-05-02",
      }),
      createHistoryRow({
        gameId: 2,
        playerId: 102,
        playerFirstName: "Blair",
        playerLastName: "Ng",
        gameScore: 44,
        isHighest: true,
        isLowest: false,
        playerPosition: 1,
        gameStartDate: "2026-05-02",
      }),
      createHistoryRow({
        gameId: 3,
        playerId: 101,
        playerFirstName: "Alex",
        playerLastName: "Rivera",
        gameScore: 0,
        gameStatus: "in_progress",
        isHighest: false,
        isLowest: false,
        gameStartDate: "2026-05-03",
      }),
    ];

    const fallbackLeaderboards: GamesPageData["leaderboards"] = {
      lowScore: null,
      highScore: null,
      playerStats: [],
    };

    const leaderboards = buildGameLeaderboards(rows, 10, "high", fallbackLeaderboards);

    expect(leaderboards.highScore).toEqual({
      playerFirstName: "Alex",
      playerLastName: "Rivera",
      gameScore: 50,
      gameStartDate: "2026-05-01",
    });
    expect(leaderboards.lowScore).toEqual({
      playerFirstName: "Alex",
      playerLastName: "Rivera",
      gameScore: 35,
      gameStartDate: "2026-05-02",
    });
    expect(leaderboards.playerStats).toEqual([
      {
        playerFirstName: "Alex",
        playerLastName: "Rivera",
        gamesPlayed: 2,
        gamesWon: 1,
        gamesLost: 1,
      },
      {
        playerFirstName: "Blair",
        playerLastName: "Ng",
        gamesPlayed: 2,
        gamesWon: 1,
        gamesLost: 1,
      },
    ]);
  });
});
