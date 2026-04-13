'use server';

import db from '@/components/db/drizzle';
import { eq, and, asc, desc, ne } from 'drizzle-orm';
import { gameState, 
         gamePlayerState, 
         gameMetadata, 
         gamePlayerRound,
         member } from '@/components/db/schema/family-social-schema-tables';
import {
  GameMetadata,
  GameMetadataReturn,
  AllGameMetadataReturn,
  GameState,
  GamesPageData,
  GamesPageDataReturn,
  GameHistoryRow,
  PlayerStats,
  SelectableGamePlayer,
} from '../types/game-scoreboard';

type StartGameRecordInput = {
  familyId: number;
  gameMetaId: number;
  gameTitle: string;
};

type SaveGamePlayerStateRecordInput = {
  memberId: number;
  playPosition: number;
  status: string;
};

type SaveGameRoundScoreRecordInput = {
  memberId: number;
  playPosition: number;
  roundScore: number;
  cumulativeScore: number;
};

type SaveGameRoundRecordInput = {
  roundNo: number;
  roundLabel: string;
  scores: SaveGameRoundScoreRecordInput[];
};

type SaveGameScoreboardRecordInput = {
  familyId: number;
  gameId?: number;
  gameMetaId: number;
  gameTitle: string;
  status: 'active' | 'in_progress' | 'completed' | 'archived';
  gamePlayerStates: SaveGamePlayerStateRecordInput[];
  gamePlayerRounds: SaveGameRoundRecordInput[];
};

type SaveGameResult =
  | { success: false; message: string }
  | { success: true; gameState: GameState };

export type GameScoreboardDetails = {
  gameState: GameState;
  players: Array<{
    memberId: number;
    playPosition: number;
    firstName: string;
    lastName: string;
    isGuest: boolean;
  }>;
  rounds: Array<{
    roundNo: number;
    playPosition: number;
    roundScore: number;
    cumulativeScore: number;
  }>;
};

export type GameScoreboardDetailsReturn =
  | { success: false; message: string }
  | { success: true; scoreboard: GameScoreboardDetails };

/* ------------------ getAllGameNames ------------------ */         
export async function getAllGameNames():(Promise<AllGameMetadataReturn>) {

  const gameMetaData = await db
    .select().from(gameMetadata);

  if (!gameMetaData || gameMetaData.length === 0) {
    return { success: false, message: "No game metadata found" };
  }
  const gameMetas: GameMetadata[] = gameMetaData.map(meta => ({
    id: meta.id,
    name: meta.name,
    highOrLo: meta.highOrLo as "high" | "low",
    scoreUom: meta.scoreUom,
    isRoundBased: meta.isRoundBased,
    maxRounds: meta.maxRounds,
  }));

  if (gameMetas.length === 0) {
    return { success: false, message: "No game metadata found" };
  }
  return { success: true, gameMetas };
}

/* ----------------- getGameMetaDataByName ------------------ */         
export async function getGameMetaDataByName(gameName: string):(Promise<GameMetadataReturn>) {
  const [gameMetaData] = await db
    .select().from(gameMetadata)
    .where(eq(gameMetadata.name, gameName));

  if (!gameMetaData) {
    return { success: false, message: `No game metadata found for game name: ${gameName}` };
  }
  
  const gameMeta:GameMetadata = {
    id: gameMetaData.id,
    name: gameMetaData.name,
    highOrLo: gameMetaData.highOrLo as "high" | "low",
    scoreUom: gameMetaData.scoreUom,
    isRoundBased: gameMetaData.isRoundBased,
    maxRounds: gameMetaData.maxRounds,
  };

  return { success: true, gameMeta: gameMeta };
}

/* ------------------ getGameStatesByFamilyId ------------------ */
export async function getGameStatesByFamilyId(familyId: number): Promise<GameState[]> {
  const rows = await db
    .select({
      id: gameState.id,
      gameTitle: gameState.gameTitle,
      status: gameState.status,
      createdAt: gameState.createdAt,
      completedAt: gameState.completedAt,
      gameMetaId: gameState.gameMetaId,
      familyId: gameState.familyId,
    })
    .from(gameState)
    .where(eq(gameState.familyId, familyId))
    .orderBy(desc(gameState.createdAt));

  return rows.map((row) => ({
    id: row.id,
    gameTitle: row.gameTitle,
    status: row.status as 'active' | 'in_progress' | 'completed' | 'archived',
    createdAt: row.createdAt ?? new Date(0),
    completedAt: row.completedAt,
    gameMetaId: row.gameMetaId,
    familyId: row.familyId,
  }));
}

/* ------------------ getSelectableGamePlayersByFamilyId ------------------ */
export async function getSelectableGamePlayersByFamilyId(familyId: number): Promise<SelectableGamePlayer[]> {
  const rows = await db
    .select({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      isGuest: member.isGuest,
    })
    .from(member)
    .where(and(
      eq(member.familyId, familyId),
      eq(member.status, 'active')
    ))
    .orderBy(asc(member.firstName), asc(member.lastName));

  return rows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    isGuest: row.isGuest,
  }));
}

/* ------------------ getGameScoreboardDetailsByGameId ------------------ */
export async function getGameScoreboardDetailsByGameId(
  gameId: number,
  familyId: number
): Promise<GameScoreboardDetailsReturn> {
  const [stateRow] = await db
    .select({
      id: gameState.id,
      gameTitle: gameState.gameTitle,
      status: gameState.status,
      createdAt: gameState.createdAt,
      completedAt: gameState.completedAt,
      gameMetaId: gameState.gameMetaId,
      familyId: gameState.familyId,
    })
    .from(gameState)
    .where(and(eq(gameState.id, gameId), eq(gameState.familyId, familyId)));

  if (!stateRow) {
    return {
      success: false,
      message: "Game state not found.",
    };
  }

  const playerRows = await db
    .select({
      memberId: gamePlayerState.memberId,
      playPosition: gamePlayerState.playPosition,
      firstName: member.firstName,
      lastName: member.lastName,
      isGuest: member.isGuest,
      gamePlayerId: gamePlayerState.id,
    })
    .from(gamePlayerRound)
    .innerJoin(gamePlayerState, eq(gamePlayerState.id, gamePlayerRound.gamePlayerId))
    .innerJoin(member, eq(member.id, gamePlayerState.memberId))
    .where(eq(gamePlayerRound.gameId, gameId))
    .orderBy(asc(gamePlayerState.playPosition), asc(member.firstName), asc(member.lastName));

  const uniquePlayers = new Map<number, {
    memberId: number;
    playPosition: number;
    firstName: string;
    lastName: string;
    isGuest: boolean;
  }>();

  for (const row of playerRows) {
    if (row.playPosition === null || row.playPosition <= 0) {
      continue;
    }

    if (!uniquePlayers.has(row.gamePlayerId)) {
      uniquePlayers.set(row.gamePlayerId, {
        memberId: row.memberId,
        playPosition: row.playPosition,
        firstName: row.firstName,
        lastName: row.lastName,
        isGuest: row.isGuest,
      });
    }
  }

  const roundRows = await db
    .select({
      roundNo: gamePlayerRound.roundNo,
      roundScore: gamePlayerRound.roundScore,
      cumulativeScore: gamePlayerRound.cumulativeScore,
      playPosition: gamePlayerState.playPosition,
    })
    .from(gamePlayerRound)
    .innerJoin(gamePlayerState, eq(gamePlayerState.id, gamePlayerRound.gamePlayerId))
    .where(eq(gamePlayerRound.gameId, gameId))
    .orderBy(desc(gamePlayerRound.roundNo), asc(gamePlayerState.playPosition));

  const rounds = roundRows
    .filter((row) => row.playPosition !== null && row.playPosition > 0)
    .map((row) => ({
      roundNo: row.roundNo,
      playPosition: row.playPosition as number,
      roundScore: row.roundScore,
      cumulativeScore: row.cumulativeScore,
    }));

  return {
    success: true,
    scoreboard: {
      gameState: {
        id: stateRow.id,
        gameTitle: stateRow.gameTitle,
        status: stateRow.status as 'active' | 'in_progress' | 'completed' | 'archived',
        createdAt: stateRow.createdAt ?? new Date(0),
        completedAt: stateRow.completedAt,
        gameMetaId: stateRow.gameMetaId,
        familyId: stateRow.familyId,
      },
      players: Array.from(uniquePlayers.values()),
      rounds,
    },
  };
}

/* ------------------ createGameStateRecord ------------------ */
export async function createGameStateRecord(input: StartGameRecordInput): Promise<SaveGameResult> {
  const trimmedTitle = input.gameTitle.trim();

  if (!trimmedTitle) {
    return {
      success: false,
      message: 'Game title is required.',
    };
  }

  const [existingGame] = await db
    .select({
      id: gameState.id,
    })
    .from(gameState)
    .where(eq(gameState.gameTitle, trimmedTitle));

  if (existingGame) {
    return {
      success: false,
      message: `A game with the title \"${trimmedTitle}\" already exists.`,
    };
  }

  const [insertedGame] = await db
    .insert(gameState)
    .values({
      gameTitle: trimmedTitle,
      status: 'in_progress',
      gameMetaId: input.gameMetaId,
      familyId: input.familyId,
    })
    .returning();

  if (!insertedGame) {
    return {
      success: false,
      message: 'Unable to create game state.',
    };
  }

  return {
    success: true,
    gameState: {
      id: insertedGame.id,
      gameTitle: insertedGame.gameTitle,
      status: insertedGame.status as 'active' | 'in_progress' | 'completed' | 'archived',
      createdAt: insertedGame.createdAt ?? new Date(0),
      completedAt: insertedGame.completedAt,
      gameMetaId: insertedGame.gameMetaId,
      familyId: insertedGame.familyId,
    },
  };
}

/* ------------------ saveGameScoreboardRecord ------------------ */
export async function saveGameScoreboardRecord(input: SaveGameScoreboardRecordInput): Promise<SaveGameResult> {
  const trimmedTitle = input.gameTitle.trim();

  if (!trimmedTitle) {
    return {
      success: false,
      message: 'Game title is required.',
    };
  }

  if (input.gamePlayerStates.length === 0) {
    return {
      success: false,
      message: 'At least one player must be selected before saving.',
    };
  }

  const duplicateTitleWhere = input.gameId
    ? and(
        eq(gameState.gameTitle, trimmedTitle),
        ne(gameState.id, input.gameId)
      )
    : eq(gameState.gameTitle, trimmedTitle);

  const [duplicateTitle] = await db
    .select({
      id: gameState.id,
    })
    .from(gameState)
    .where(duplicateTitleWhere);

  if (duplicateTitle) {
    return {
      success: false,
      message: `A game with the title \"${trimmedTitle}\" already exists.`,
    };
  }

  let persistedGameId = input.gameId;
  let persistedGameState: GameState | null = null;

  if (persistedGameId) {
    const completedAt = input.status === 'completed' ? new Date() : null;

    const [updatedGame] = await db
      .update(gameState)
      .set({
        gameTitle: trimmedTitle,
        status: input.status,
        completedAt,
        gameMetaId: input.gameMetaId,
        familyId: input.familyId,
      })
      .where(eq(gameState.id, persistedGameId))
      .returning();

    if (!updatedGame) {
      return {
        success: false,
        message: `Unable to update game ${persistedGameId}.`,
      };
    }

    persistedGameState = {
      id: updatedGame.id,
      gameTitle: updatedGame.gameTitle,
      status: updatedGame.status as 'active' | 'in_progress' | 'completed' | 'archived',
      createdAt: updatedGame.createdAt ?? new Date(0),
      completedAt: updatedGame.completedAt,
      gameMetaId: updatedGame.gameMetaId,
      familyId: updatedGame.familyId,
    };
  }
  else {
    const createResult = await createGameStateRecord({
      familyId: input.familyId,
      gameMetaId: input.gameMetaId,
      gameTitle: trimmedTitle,
    });

    if (!createResult.success) {
      return createResult;
    }

    persistedGameId = createResult.gameState.id;
    persistedGameState = createResult.gameState;
  }

  const existingRoundRows = await db
    .select({
      gamePlayerId: gamePlayerRound.gamePlayerId,
    })
    .from(gamePlayerRound)
    .where(eq(gamePlayerRound.gameId, persistedGameId));

  if (existingRoundRows.length > 0) {
    await db
      .delete(gamePlayerRound)
      .where(eq(gamePlayerRound.gameId, persistedGameId));

    const existingPlayerIds = Array.from(
      new Set(existingRoundRows.map((row) => row.gamePlayerId))
    );

    for (const gamePlayerId of existingPlayerIds) {
      await db
        .delete(gamePlayerState)
        .where(eq(gamePlayerState.id, gamePlayerId));
    }
  }

  const insertedPlayerIdsByPosition = new Map<number, number>();

  for (const playerStateInput of input.gamePlayerStates) {
    const [insertedPlayerState] = await db
      .insert(gamePlayerState)
      .values({
        playPosition: playerStateInput.playPosition,
        status: playerStateInput.status,
        memberId: playerStateInput.memberId,
        familyId: input.familyId,
      })
      .returning();

    if (!insertedPlayerState) {
      return {
        success: false,
        message: `Unable to persist player state for member ${playerStateInput.memberId}.`,
      };
    }

    insertedPlayerIdsByPosition.set(playerStateInput.playPosition, insertedPlayerState.id);
  }

  for (const roundInput of input.gamePlayerRounds) {
    for (const scoreInput of roundInput.scores) {
      const gamePlayerId = insertedPlayerIdsByPosition.get(scoreInput.playPosition);

      if (!gamePlayerId) {
        return {
          success: false,
          message: `Unable to match play position ${scoreInput.playPosition} to a saved player state.`,
        };
      }

      await db.insert(gamePlayerRound).values({
        roundNo: roundInput.roundNo,
        roundScore: scoreInput.roundScore,
        cumulativeScore: scoreInput.cumulativeScore,
        gameId: persistedGameId,
        gamePlayerId,
      });
    }
  }

  return {
    success: true,
    gameState: persistedGameState!,
  };
}

/* ------------------ getGamesPageData ------------------ */
export async function getGamesPageData(familyId: number): Promise<GamesPageDataReturn> {
  try {
    const gameMetaResult = await getAllGameNames();

    const availableGames = gameMetaResult.success ? gameMetaResult.gameMetas : [];
    const activeGameStates = await getGameStatesByFamilyId(familyId);
    const selectablePlayers = await getSelectableGamePlayersByFamilyId(familyId);

    const roundRows = await db
      .select({
        gameId: gamePlayerRound.gameId,
        gameMetaId: gameState.gameMetaId,
        roundNo: gamePlayerRound.roundNo,
        cumulativeScore: gamePlayerRound.cumulativeScore,
        gameTitle: gameState.gameTitle,
        gameStatus: gameState.status,
        gameCreatedAt: gameState.createdAt,
        playerId: member.id,
        playerFirstName: member.firstName,
        playerLastName: member.lastName,
      })
      .from(gamePlayerRound)
      .innerJoin(gameState, eq(gameState.id, gamePlayerRound.gameId))
      .innerJoin(gamePlayerState, eq(gamePlayerState.id, gamePlayerRound.gamePlayerId))
      .innerJoin(member, eq(member.id, gamePlayerState.memberId))
      .where(eq(gameState.familyId, familyId))
      .orderBy(asc(gamePlayerRound.gameId), asc(member.id), desc(gamePlayerRound.roundNo));

    // Keep only the latest round score per game/player to represent each player's final score.
    const latestScoreByGamePlayer = new Map<string, {
      gameId: number;
      gameTitle: string;
      gameMetaId: number;
      gameStatus: 'active' | 'in_progress' | 'completed' | 'archived';
      gameStartDate: string;
      playerId: number;
      playerFirstName: string;
      playerLastName: string;
      score: number;
    }>();

    for (const row of roundRows) {
      const key = `${row.gameId}-${row.playerId}`;
      if (latestScoreByGamePlayer.has(key)) {
        continue;
      }

      const gameStartDate = row.gameCreatedAt
        ? new Date(row.gameCreatedAt).toISOString().slice(0, 10)
        : '';

      latestScoreByGamePlayer.set(key, {
        gameId: row.gameId,
        gameMetaId: row.gameMetaId,
        gameTitle: row.gameTitle,
        gameStatus: row.gameStatus as 'active' | 'in_progress' | 'completed' | 'archived',
        gameStartDate,
        playerId: row.playerId,
        playerFirstName: row.playerFirstName,
        playerLastName: row.playerLastName,
        score: row.cumulativeScore,
      });
    }

    const scoresByGameId = new Map<number, Array<{
      gameId: number;
      gameTitle: string;
      gameMetaId: number;
      gameStatus: 'active' | 'in_progress' | 'completed' | 'archived';
      gameStartDate: string;
      playerId: number;
      playerFirstName: string;
      playerLastName: string;
      score: number;
    }>>();

    for (const row of latestScoreByGamePlayer.values()) {
      const list = scoresByGameId.get(row.gameId) ?? [];
      list.push(row);
      scoresByGameId.set(row.gameId, list);
    }

    const gameHistory: GameHistoryRow[] = [];
    const playerStatsMap = new Map<number, {
      playerId: number;
      playerFirstName: string;
      playerLastName: string;
      gamesPlayed: number;
      gamesWon: number;
    }>();

    for (const gameRows of scoresByGameId.values()) {
      const sorted = [...gameRows].sort((a, b) => a.score - b.score);
      if (sorted.length === 0) {
        continue;
      }

      const lowestScore = sorted[0].score;
      const highestScore = sorted[sorted.length - 1].score;

      sorted.forEach((entry, index) => {
        gameHistory.push({
          gameId: entry.gameId,
          gameMetaId: entry.gameMetaId,
          playerId: entry.playerId,
          gameStartDate: entry.gameStartDate,
          playerFirstName: entry.playerFirstName,
          playerLastName: entry.playerLastName,
          gameScore: entry.score,
          gameStatus: entry.gameStatus,
          gameTitle: entry.gameTitle,
          playerPosition: index + 1,
          isLowest: entry.score === lowestScore,
          isHighest: entry.score === highestScore,
        });

        if (entry.gameStatus !== 'completed') {
          return;
        }

        const current = playerStatsMap.get(entry.playerId) ?? {
          playerId: entry.playerId,
          playerFirstName: entry.playerFirstName,
          playerLastName: entry.playerLastName,
          gamesPlayed: 0,
          gamesWon: 0,
        };

        current.gamesPlayed += 1;
        if (entry.score === lowestScore) {
          current.gamesWon += 1;
        }

        playerStatsMap.set(entry.playerId, current);
      });
    }

    const sortedHistory = gameHistory.sort((a, b) => {
      if (a.gameStartDate === b.gameStartDate) {
        return a.gameScore - b.gameScore;
      }
      return a.gameStartDate < b.gameStartDate ? 1 : -1;
    });

    const playerStats: PlayerStats[] = Array.from(playerStatsMap.values())
      .map((row) => ({
        playerFirstName: row.playerFirstName,
        playerLastName: row.playerLastName,
        gamesPlayed: row.gamesPlayed,
        gamesWon: row.gamesWon,
        gamesLost: row.gamesPlayed - row.gamesWon,
      }))
      .sort((a, b) => {
        if (a.gamesWon === b.gamesWon) {
          return a.playerFirstName.localeCompare(b.playerFirstName);
        }
        return b.gamesWon - a.gamesWon;
      });

    const completedNonZeroHistory = sortedHistory.filter(
      (row) => row.gameStatus === 'completed' && row.gameScore !== 0
    );

    const lowScore = completedNonZeroHistory.length > 0
      ? {
          playerFirstName: completedNonZeroHistory.reduce((acc, row) =>
            row.gameScore < acc.gameScore ? row : acc
          ).playerFirstName,
          playerLastName: completedNonZeroHistory.reduce((acc, row) =>
            row.gameScore < acc.gameScore ? row : acc
          ).playerLastName,
          gameScore: completedNonZeroHistory.reduce((acc, row) =>
            row.gameScore < acc.gameScore ? row : acc
          ).gameScore,
          gameStartDate: completedNonZeroHistory.reduce((acc, row) =>
            row.gameScore < acc.gameScore ? row : acc
          ).gameStartDate,
        }
      : null;

    const highScore = completedNonZeroHistory.length > 0
      ? {
          playerFirstName: completedNonZeroHistory.reduce((acc, row) =>
            row.gameScore > acc.gameScore ? row : acc
          ).playerFirstName,
          playerLastName: completedNonZeroHistory.reduce((acc, row) =>
            row.gameScore > acc.gameScore ? row : acc
          ).playerLastName,
          gameScore: completedNonZeroHistory.reduce((acc, row) =>
            row.gameScore > acc.gameScore ? row : acc
          ).gameScore,
          gameStartDate: completedNonZeroHistory.reduce((acc, row) =>
            row.gameScore > acc.gameScore ? row : acc
          ).gameStartDate,
        }
      : null;

    const playerStateRows = await db
      .select({
        id: gamePlayerState.id,
        playPosition: gamePlayerState.playPosition,
        status: gamePlayerState.status,
        memberId: gamePlayerState.memberId,
        familyId: gamePlayerState.familyId,
      })
      .from(gamePlayerState)
      .where(eq(gamePlayerState.familyId, familyId));

    const playerRoundRows = await db
      .select({
        id: gamePlayerRound.id,
        roundNo: gamePlayerRound.roundNo,
        roundScore: gamePlayerRound.roundScore,
        cumulativeScore: gamePlayerRound.cumulativeScore,
        gameId: gamePlayerRound.gameId,
        gamePlayerId: gamePlayerRound.gamePlayerId,
      })
      .from(gamePlayerRound)
      .innerJoin(gameState, eq(gameState.id, gamePlayerRound.gameId))
      .where(eq(gameState.familyId, familyId));

    const gamesData: GamesPageData = {
      gameHistory: sortedHistory,
      leaderboards: {
        lowScore,
        highScore,
        playerStats,
      },
      selectablePlayers,
      availableGames,
      activeGameStates,
      gamePlayerStates: playerStateRows,
      gamePlayerRounds: playerRoundRows,
    };

    return {
      success: true,
      gamesData,
    };
  }
  catch (error) {
    return {
      success: false,
      message: `Failed to load games page data: ${error instanceof Error ? error.message : 'unknown error'}`,
    };
  }
}

/* ------------------ createGuestMemberRecord ------------------ */
type CreateGuestMemberInput = {
  familyId: number;
  firstName: string;
  lastName: string;
  email: string;
};

type CreateGuestMemberResult =
  | { success: false; message: string }
  | { success: true; guestMember: SelectableGamePlayer };

export async function createGuestMemberRecord(input: CreateGuestMemberInput): Promise<CreateGuestMemberResult> {
  const trimmedFirst = input.firstName.trim();
  const trimmedLast = input.lastName.trim();
  const trimmedEmail = input.email.trim();

  if (!trimmedFirst || !trimmedLast || !trimmedEmail) {
    return { success: false, message: 'First name, last name, and email are required.' };
  }

  const [insertedMember] = await db
    .insert(member)
    .values({
      familyId: input.familyId,
      firstName: trimmedFirst,
      lastName: trimmedLast,
      email: trimmedEmail,
      isGuest: true,
      status: 'active',
    })
    .returning();

  if (!insertedMember) {
    return { success: false, message: 'Unable to add guest member.' };
  }

  return {
    success: true,
    guestMember: {
      id: insertedMember.id,
      firstName: insertedMember.firstName,
      lastName: insertedMember.lastName,
      isGuest: insertedMember.isGuest,
    },
  };
}

