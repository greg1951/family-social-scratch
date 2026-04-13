/* Games Scoreboard Type Definitions */

export interface GameMetadata {
  id: number;
  name: string;
  highOrLo: "high" | "low";
  scoreUom: string;
  isRoundBased: boolean;
  maxRounds: number;
}

export type AllGameMetadataReturn =
  | { success: false; message: string }
  | {
      success: true;
      gameMetas: GameMetadata[];
    };

export type GameMetadataReturn =
  | { success: false; message: string }
  | {
      success: true;
      gameMeta: GameMetadata;
    };


export interface GameState {
  id: number;
  gameTitle: string;
  status: "active" | "in_progress" | "completed" | "archived";
  createdAt: Date | string;
  completedAt: Date | string | null;
  gameMetaId: number;
  familyId: number;
}

export interface GamePlayerState {
  id: number;
  playPosition: number | null;
  status: string;
  memberId: number;
  familyId: number;
}

export interface GamePlayerRound {
  id: number;
  roundNo: number;
  roundScore: number;
  cumulativeScore: number;
  gameId: number;
  gamePlayerId: number;
}

/* Derived Types for UI */

export interface GameHistoryRow {
  gameId: number;
  gameMetaId: number;
  playerId: number;
  gameStartDate: string;
  playerFirstName: string;
  playerLastName: string;
  gameScore: number;
  gameStatus: "active" | "in_progress" | "completed" | "archived";
  gameTitle: string;
  playerPosition: number; // 1 = lowest (winning), highest = highest score
  isLowest: boolean;
  isHighest: boolean;
}

export interface LeaderboardLowScore {
  playerFirstName: string;
  playerLastName: string;
  gameScore: number;
  gameStartDate: string;
}

export interface LeaderboardHighScore {
  playerFirstName: string;
  playerLastName: string;
  gameScore: number;
  gameStartDate: string;
}

export interface PlayerStats {
  playerFirstName: string;
  playerLastName: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
}

export interface SelectableGamePlayer {
  id: number;
  firstName: string;
  lastName: string;
  isGuest: boolean;
}

export interface ScoreboardRow {
  roundNo: number;
  playerScores: { playerId: number; roundScore: number }[];
}

export interface GameScorecardData {
  gameId: number;
  gameTitle: string;
  status: "active" | "in_progress" | "completed" | "archived";
  createdAt: string;
  selectedPlayers: Array<{
    id: number;
    firstName: string;
    lastName: string;
  }>;
  cumulativeScores: Map<number, number>; // playerId -> cumulative score
  rounds: ScoreboardRow[];
}

export interface GamesPageData {
  gameHistory: GameHistoryRow[];
  leaderboards: {
    lowScore: LeaderboardLowScore | null;
    highScore: LeaderboardHighScore | null;
    playerStats: PlayerStats[];
  };
  selectablePlayers: SelectableGamePlayer[];
  availableGames: GameMetadata[];
  activeGameStates: GameState[];
  gamePlayerStates: GamePlayerState[];
  gamePlayerRounds: GamePlayerRound[];
}

export type GamesPageDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      gamesData: GamesPageData;
    };
