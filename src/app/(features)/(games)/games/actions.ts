'use server';

import { revalidatePath } from "next/cache";
import {
  createGameStateRecord,
  createGuestMemberRecord,
  getGameScoreboardDetailsByGameId,
  saveGameScoreboardRecord,
} from "@/components/db/sql/queries-game-scoreboards";

export interface SaveGameRoundScoreInput {
  memberId: number;
  playPosition: number;
  roundScore: number;
  cumulativeScore: number;
}

export interface SaveGameRoundInput {
  roundNo: number;
  roundLabel: string;
  scores: SaveGameRoundScoreInput[];
}

export interface SaveGamePlayerStateInput {
  memberId: number;
  playPosition: number;
  status: string;
}

export interface StartGameInput {
  familyId: number;
  gameMetaId: number;
  gameTitle: string;
  memberId: number;
}

export interface SaveGameScoreboardInput {
  familyId: number;
  gameId?: number;
  gameMetaId: number;
  gameTitle: string;
  status: "active" | "in_progress" | "completed" | "archived";
  gamePlayerStates: SaveGamePlayerStateInput[];
  gamePlayerRounds: SaveGameRoundInput[];
}

export interface LoadGameScoreboardInput {
  familyId: number;
  gameId: number;
}

export async function startGameAction(input: StartGameInput) {
  const result = await createGameStateRecord(input);

  if (result.success) {
    revalidatePath("/games");
  }

  return result;
}

export async function saveGameScoreboardAction(input: SaveGameScoreboardInput) {
  const result = await saveGameScoreboardRecord(input);

  if (!result.success) {
    return result;
  }

  revalidatePath("/games");

  return {
    success: true,
    gameState: result.gameState,
    message: `Game \"${result.gameState.gameTitle}\" saved successfully.`,
  };
}

export async function loadGameScoreboardAction(input: LoadGameScoreboardInput) {
  return getGameScoreboardDetailsByGameId(input.gameId, input.familyId);
}

export interface AddGuestMemberInput {
  familyId: number;
  firstName: string;
  lastName: string;
  email: string;
}

export async function addGuestMemberAction(input: AddGuestMemberInput) {
  return createGuestMemberRecord(input);
}
