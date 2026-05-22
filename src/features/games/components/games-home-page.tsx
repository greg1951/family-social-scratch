"use client";

import { startTransition, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, Play, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import FeatureFaqHelp from "@/components/common/feature-faq-help";
import {
  addGuestMemberAction,
  archiveGameAction,
  deleteGameAction,
  loadGameScoreboardAction,
  saveGameScoreboardAction,
  startGameAction,
} from "@/app/(features)/(games)/games/actions";
import type {
  GamesPageData,
  GameHistoryRow,
  GameState,
} from "@/components/db/types/game-scoreboard";
import Link from "next/link";

interface GamesHomePageProps {
  gamesData: GamesPageData;
  familyId: number;
  memberId: number;
  firstName: string;
}

interface SelectedPlayer {
  id: number;
  firstName: string;
  lastName: string;
  isGuest: boolean;
}

const NEW_GAME_OPTION_VALUE = "new_game";
const ADD_GUEST_OPTION_VALUE = "add_guest";
const CLEAR_PLAYER_OPTION_VALUE = "clear_player";
const CRICKET_TARGETS = [
  { roundKey: 20, roundNo: 20, label: "20", scoreValue: 20 },
  { roundKey: 19, roundNo: 19, label: "19", scoreValue: 19 },
  { roundKey: 18, roundNo: 18, label: "18", scoreValue: 18 },
  { roundKey: 17, roundNo: 17, label: "17", scoreValue: 17 },
  { roundKey: 16, roundNo: 16, label: "16", scoreValue: 16 },
  { roundKey: 15, roundNo: 15, label: "15", scoreValue: 15 },
  { roundKey: 25, roundNo: 25, label: "B", scoreValue: 25 },
] as const;

const CRICKET_TARGET_KEYS = CRICKET_TARGETS.map((target) => target.roundKey);
const CRICKET_TARGET_INDEX = new Map<number, number>(CRICKET_TARGETS.map((target, index) => [target.roundKey, index]));

type CricketSideIndex = 0 | 1;

interface CricketBoardState {
  marksByTarget: Map<number, [number, number]>;
  bonusByTarget: Map<number, [number, number]>;
  scores: [number, number];
}

interface CricketTurnLedgerEntry {
  turnNo: number;
  sideIndex: CricketSideIndex;
  darts: string[];
  encodedValue: number;
  scoreDelta: number;
  boardAfter: CricketBoardState;
}

function createEmptyCricketBoardState(): CricketBoardState {
  return {
    marksByTarget: new Map(CRICKET_TARGET_KEYS.map((targetKey) => [targetKey, [0, 0] as [number, number]])),
    bonusByTarget: new Map(CRICKET_TARGET_KEYS.map((targetKey) => [targetKey, [0, 0] as [number, number]])),
    scores: [0, 0],
  };
}

function cloneCricketBoardState(board: CricketBoardState): CricketBoardState {
  return {
    marksByTarget: new Map(
      Array.from(board.marksByTarget.entries()).map(([targetKey, marks]) => [targetKey, [marks[0], marks[1]] as [number, number]])
    ),
    bonusByTarget: new Map(
      Array.from(board.bonusByTarget.entries()).map(([targetKey, bonus]) => [targetKey, [bonus[0], bonus[1]] as [number, number]])
    ),
    scores: [board.scores[0], board.scores[1]],
  };
}

function parseCricketDartNotation(input: string): { targetKey: number | null; multiplier: 0 | 1 | 2 | 3 } {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed || trimmed === "0" || trimmed === "miss" || trimmed === "m") {
    return { targetKey: null, multiplier: 0 };
  }

  if (trimmed === "b" || trimmed === "bull" || trimmed === "bullseye" || trimmed === "25") {
    return { targetKey: 25, multiplier: 1 };
  }

  const match = trimmed.match(/^([sdt])?(\d{1,2})$/);
  if (!match) {
    return { targetKey: null, multiplier: 0 };
  }

  const prefix = match[1] ?? "s";
  const number = Number(match[2]);
  if (!Number.isFinite(number)) {
    return { targetKey: null, multiplier: 0 };
  }

  if (!CRICKET_TARGET_INDEX.has(number)) {
    return { targetKey: null, multiplier: 0 };
  }

  const multiplier = prefix === "d" ? 2 : prefix === "t" ? 3 : 1;
  return { targetKey: number, multiplier: multiplier as 0 | 1 | 2 | 3 };
}

function encodeCricketDartNotation(input: string): number {
  const parsed = parseCricketDartNotation(input);
  if (!parsed.targetKey || parsed.multiplier === 0) {
    return 0;
  }

  const targetIndex = CRICKET_TARGET_INDEX.get(parsed.targetKey);
  if (targetIndex === undefined) {
    return 0;
  }

  return 1 + targetIndex * 3 + (parsed.multiplier - 1);
}

function decodeCricketDartCode(code: number): string {
  if (code <= 0) {
    return "";
  }

  const normalized = code - 1;
  const targetIndex = Math.floor(normalized / 3);
  const multiplier = (normalized % 3) + 1;
  const target = CRICKET_TARGETS[targetIndex];

  if (!target) {
    return "";
  }

  const prefix = multiplier === 2 ? "D" : multiplier === 3 ? "T" : "S";
  return `${ prefix }${ target.roundKey === 25 ? 25 : target.roundKey }`;
}

function encodeCricketTurn(darts: string[], sideIndex: CricketSideIndex): number {
  const [first, second, third] = [darts[0] ?? "", darts[1] ?? "", darts[2] ?? ""];
  const firstCode = encodeCricketDartNotation(first);
  const secondCode = encodeCricketDartNotation(second);
  const thirdCode = encodeCricketDartNotation(third);
  return 1 + (sideIndex * 32768) + firstCode + (secondCode * 32) + (thirdCode * 1024);
}

function decodeCricketTurn(encodedValue: number): { sideIndex: CricketSideIndex; darts: string[] } {
  const normalized = Math.max(0, encodedValue - 1);
  const sideIndex = normalized >= 32768 ? 1 : 0;
  const payload = normalized % 32768;
  const firstCode = payload % 32;
  const secondCode = Math.floor(payload / 32) % 32;
  const thirdCode = Math.floor(payload / 1024) % 32;

  return {
    sideIndex: sideIndex as CricketSideIndex,
    darts: [
      decodeCricketDartCode(firstCode),
      decodeCricketDartCode(secondCode),
      decodeCricketDartCode(thirdCode),
    ],
  };
}

function applyCricketTurn(
  board: CricketBoardState,
  sideIndex: CricketSideIndex,
  darts: string[]
): { boardAfter: CricketBoardState; scoreDelta: number } {
  const nextBoard = cloneCricketBoardState(board);
  const opponentIndex: CricketSideIndex = sideIndex === 0 ? 1 : 0;
  let scoreDelta = 0;

  for (const dart of darts) {
    const parsed = parseCricketDartNotation(dart);

    if (!parsed.targetKey || parsed.multiplier === 0) {
      continue;
    }

    const targetValue = parsed.targetKey === 25 ? 25 : parsed.targetKey;
    const marks = nextBoard.marksByTarget.get(parsed.targetKey) ?? [0, 0];
    const ownMarksBefore = marks[sideIndex];
    const opponentMarks = marks[opponentIndex];
    const hits = parsed.multiplier;
    const marksAdded = Math.min(hits, Math.max(0, 3 - ownMarksBefore));

    marks[sideIndex] = Math.min(3, ownMarksBefore + marksAdded);
    nextBoard.marksByTarget.set(parsed.targetKey, marks);

    if (opponentMarks < 3) {
      const scoringHits = Math.max(0, hits - marksAdded);
      if (scoringHits > 0) {
        const dartScore = scoringHits * targetValue;
        const bonuses = nextBoard.bonusByTarget.get(parsed.targetKey) ?? [0, 0];
        bonuses[sideIndex] += dartScore;
        nextBoard.bonusByTarget.set(parsed.targetKey, bonuses);
        nextBoard.scores[sideIndex] += dartScore;
        scoreDelta += dartScore;
      }
    }
  }

  return {
    boardAfter: nextBoard,
    scoreDelta,
  };
}

function buildCricketBoardFromLedger(turns: CricketTurnLedgerEntry[]): CricketBoardState {
  let board = createEmptyCricketBoardState();

  for (const turn of turns) {
    board = cloneCricketBoardState(turn.boardAfter);
  }

  return board;
}

function determineCricketWinner(board: CricketBoardState): CricketSideIndex | null {
  const isClosed = (sideIndex: CricketSideIndex) => CRICKET_TARGET_KEYS.every((targetKey) => {
    const marks = board.marksByTarget.get(targetKey) ?? [0, 0];
    return marks[sideIndex] >= 3;
  });

  if (isClosed(0) && board.scores[0] >= board.scores[1]) {
    return 0;
  }

  if (isClosed(1) && board.scores[1] >= board.scores[0]) {
    return 1;
  }

  return null;
}

export function GamesHomePage({
  gamesData,
  familyId,
  memberId,
  firstName,
}: GamesHomePageProps) {
  const scoreboardGridRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const emptySelectedPlayers = useMemo(
    () => Array(8).fill(null) as (SelectedPlayer | null)[],
    []
  );

  // State management
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [selectedGameState, setSelectedGameState] = useState<GameState | null>(
    null
  );
  const [selectedPlayers, setSelectedPlayers] = useState<(SelectedPlayer | null)[]>(
    emptySelectedPlayers
  );
  const [roundScores, setRoundScores] = useState<
    Map<number, Map<number, number>>
  >(new Map());
  const [persistedCumulativeScores, setPersistedCumulativeScores] = useState<
    Map<number, number> | null
  >(null);
  const [hasRoundScoreEdits, setHasRoundScoreEdits] = useState(false);
  const [gameTitleInput, setGameTitleInput] = useState("");
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isSavingGame, setIsSavingGame] = useState(false);
  const [isLoadingSavedGame, setIsLoadingSavedGame] = useState(false);
  const [isArchivingGame, setIsArchivingGame] = useState(false);
  const [isDeletingGame, setIsDeletingGame] = useState(false);
  const [localSelectablePlayers, setLocalSelectablePlayers] = useState(
    gamesData.selectablePlayers
  );
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [guestDialogColIndex, setGuestDialogColIndex] = useState<number | null>(null);
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [isContinueGameHidden, setIsContinueGameHidden] = useState(false);
  const [gameStatusFilter, setGameStatusFilter] = useState<string>("all");
  const [gameDateFilter, setGameDateFilter] = useState<string>("all");
  const [gameTitle, setGameTitle] = useState<string>("all");
  const [selectedGameTitleOption, setSelectedGameTitleOption] = useState<string>(
    NEW_GAME_OPTION_VALUE
  );
  const [requestedVisiblePlayerColumns, setRequestedVisiblePlayerColumns] = useState(1);
  const [cricketTurnLedger, setCricketTurnLedger] = useState<CricketTurnLedgerEntry[]>([]);
  const [cricketTurnDarts, setCricketTurnDarts] = useState(["", "", ""]);
  const [isSubmittingCricketTurn, setIsSubmittingCricketTurn] = useState(false);

  // Computed values
  const selectedGame = useMemo(
    () =>
      selectedGameId
        ? gamesData.availableGames.find((g) => g.id === selectedGameId)
        : null,
    [selectedGameId, gamesData.availableGames]
  );
  const isCricketGame = selectedGame?.name.trim().toLowerCase() === "cricket";
  const cricketBoardState = useMemo(
    () => buildCricketBoardFromLedger(cricketTurnLedger),
    [cricketTurnLedger]
  );
  const cricketWinnerSideIndex = useMemo(
    () => determineCricketWinner(cricketBoardState),
    [cricketBoardState]
  );
  const cricketActiveSideIndex = (cricketTurnLedger.length % 2) as CricketSideIndex;
  const cricketActiveSidePlayer = selectedPlayers[cricketActiveSideIndex];

  const getPlayerOptionLabel = (player: { firstName: string; lastName: string; isGuest?: boolean }) =>
    `${ player.firstName } ${ player.lastName }${ player.isGuest ? " (guest)" : "" }`;

  const orderedSelectablePlayers = useMemo(() => {
    return [...localSelectablePlayers].sort((a, b) => {
      if (a.isGuest !== b.isGuest) {
        return a.isGuest ? 1 : -1;
      }

      const firstCmp = a.firstName.localeCompare(b.firstName);
      if (firstCmp !== 0) {
        return firstCmp;
      }

      return a.lastName.localeCompare(b.lastName);
    });
  }, [localSelectablePlayers]);

  const isAcquireGame = selectedGame?.name.trim().toLowerCase() === "acquire";
  const isMexicanTrainGame = selectedGame?.name.trim().toLowerCase() === "mexican train";

  const gameStatesForSelectedMetadata = useMemo(() => {
    if (!selectedGameId) {
      return [];
    }

    return gamesData.activeGameStates
      .filter((state) => state.status !== "archived")
      .filter((state) => state.gameMetaId === selectedGameId)
      .sort((a, b) => a.gameTitle.localeCompare(b.gameTitle));
  }, [gamesData.activeGameStates, selectedGameId]);

  const roundEntries = useMemo(() => {
    if (isCricketGame) {
      return CRICKET_TARGETS.map((target) => ({
        roundKey: target.roundKey,
        roundNo: target.roundNo,
        label: target.label,
      }));
    }

    const scoreUomLabel = selectedGame?.scoreUom
      ? `${ selectedGame.scoreUom.charAt(0).toUpperCase() }${ selectedGame.scoreUom.slice(1) }`
      : "Score";

    if (selectedGame && !selectedGame.isRoundBased) {
      return [
        {
          roundKey: 1,
          roundNo: 1,
          label: `Final ${ scoreUomLabel }`,
        },
      ];
    }

    const maxRounds = selectedGame?.maxRounds || 12;
    const numberedRounds = Array.from(
      { length: maxRounds },
      (_, index) => maxRounds - index
    );

    return [
      ...numberedRounds.map((roundNo) => ({
        roundKey: roundNo,
        roundNo,
        label: String(roundNo),
      })),
      {
        roundKey: 0,
        roundNo: 0,
        label: "Blank",
      },
    ];
  }, [isCricketGame, selectedGame]);

  const visiblePlayerColumnIndices = useMemo(() => {
    if (isCricketGame) {
      return [0, 1];
    }

    if (isMexicanTrainGame) {
      return Array.from({ length: 8 }, (_, idx) => idx);
    }

    const visible = selectedPlayers
      .map((player, idx) => {
        const hasPlayer = Boolean(player);
        const hasRoundValue = roundEntries.some((roundEntry) =>
          roundScores.get(roundEntry.roundKey)?.has(idx)
        );
        return hasPlayer || hasRoundValue ? idx : null;
      })
      .filter((idx): idx is number => idx !== null);

    const highestForcedIndex = Math.min(requestedVisiblePlayerColumns, 8) - 1;
    for (let idx = 0; idx <= highestForcedIndex; idx += 1) {
      if (!visible.includes(idx)) {
        visible.push(idx);
      }
    }

    if (visible.length === 0) {
      visible.push(0);
    }

    return visible.sort((a, b) => a - b);
  }, [isCricketGame, isMexicanTrainGame, requestedVisiblePlayerColumns, roundEntries, roundScores, selectedPlayers]);

  // Filter game history
  const filteredGameHistory = useMemo(() => {
    return gamesData.gameHistory.filter((game) => {
      if (selectedGameId && game.gameMetaId !== selectedGameId) {
        return false;
      }
      if (gameStatusFilter !== "all" && game.gameStatus !== gameStatusFilter) {
        return false;
      }
      if (gameDateFilter !== "all" && game.gameStartDate !== gameDateFilter) {
        return false;
      }
      if (gameTitle !== "all" && game.gameTitle !== gameTitle) {
        return false;
      }
      return true;
    });
  }, [
    gamesData.gameHistory,
    selectedGameId,
    gameStatusFilter,
    gameDateFilter,
    gameTitle,
  ]);

  // Group game history by date, then by game
  const groupedGameHistory = useMemo(() => {
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
      // Sort players by score based on winner direction for selected metadata.
      gameRows.sort((a, b) =>
        selectedGame?.highOrLo === "high"
          ? b.gameScore - a.gameScore
          : a.gameScore - b.gameScore
      );
    });
    return groups;
  }, [filteredGameHistory, selectedGame?.highOrLo]);

  // Calculate cumulative scores from current round entries.
  const computedCumulativeScores = useMemo(() => {
    if (isCricketGame) {
      const scores = new Map<number, number>();
      scores.set(0, cricketBoardState.scores[0]);
      scores.set(1, cricketBoardState.scores[1]);

      return scores;
    }

    const scores = new Map<number, number>();
    selectedPlayers.forEach((player, colIndex) => {
      if (!player) return;
      let total = 0;
      for (const roundEntry of roundEntries) {
        const roundMap = roundScores.get(roundEntry.roundKey);
        if (roundMap && roundMap.has(colIndex)) {
          total += roundMap.get(colIndex)!;
        }
      }
      scores.set(colIndex, total);
    });
    return scores;
  }, [cricketBoardState.scores, isCricketGame, roundEntries, roundScores, selectedPlayers]);

  const cumulativeScores = useMemo(() => {
    if (persistedCumulativeScores && !hasRoundScoreEdits) {
      return persistedCumulativeScores;
    }

    return computedCumulativeScores;
  }, [computedCumulativeScores, hasRoundScoreEdits, persistedCumulativeScores]);

  const displayedScores = useMemo(
    () => selectedPlayers
      .map((player, colIndex) => player ? cumulativeScores.get(colIndex) ?? 0 : null)
      .filter((score): score is number => score !== null),
    [cumulativeScores, selectedPlayers]
  );

  // Get score styling based on winner direction.
  const getScoreStyle = (colIndex: number) => {
    const score = cumulativeScores.get(colIndex) ?? 0;
    if (displayedScores.length === 0) return "";

    const lowestScore = Math.min(...displayedScores);
    const highestScore = Math.max(...displayedScores);

    if (score === lowestScore && score === highestScore) return ""; // Only one non-zero
    if (selectedGame?.highOrLo === "high") {
      if (score === highestScore) return "!bg-emerald-100 !text-emerald-800";
      if (score === lowestScore) return "!bg-rose-100 !text-rose-700";
      return "";
    }

    if (score === lowestScore) return "!bg-emerald-100 !text-emerald-800";
    if (score === highestScore) return "!bg-rose-100 !text-rose-700";
    return "";
  };

  const handleSetNewGameMode = () => {
    setSelectedGameTitleOption(NEW_GAME_OPTION_VALUE);
    setSelectedGameState(null);
    setGameTitleInput("");
    setSelectedPlayers(emptySelectedPlayers);
    setRoundScores(new Map());
    setPersistedCumulativeScores(null);
    setCricketTurnLedger([]);
    setCricketTurnDarts(["", "", ""]);
    setHasRoundScoreEdits(false);
    setRequestedVisiblePlayerColumns(1);
  };

  const handleAddPlayerColumn = () => {
    setRequestedVisiblePlayerColumns((prev) => Math.min(prev + 1, 8));
  };

  const formatGameTitleWithDate = (title: string): string => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    return `${ title }: ${ mm }/${ dd }/${ yy }`;
  };

  const handleOpenStartGame = () => {
    if (!selectedGame) {
      return;
    }

    if (!gameTitleInput.trim()) {
      setGameTitleInput(selectedGame.name);
    }
    setIsStartDialogOpen(true);
  };

  const handleStartOrContinueGame = () => {
    if (!selectedGame) {
      return;
    }

    if (selectedGameState) {
      setIsContinueGameHidden(true);
      toast.success(`Continuing game \"${ selectedGameState.gameTitle }\".`);
      scoreboardGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scoreboardGridRef.current?.focus();
      return;
    }

    handleOpenStartGame();
  };

  const handleConfirmStartGame = () => {
    if (!selectedGame) {
      return;
    }

    const trimmedTitle = gameTitleInput.trim();
    if (!trimmedTitle) {
      toast.error("Enter a game title before starting the game.");
      return;
    }

    const titledWithDate = formatGameTitleWithDate(trimmedTitle);

    setIsStartingGame(true);
    startTransition(async () => {
      const result = await startGameAction({
        familyId,
        gameMetaId: selectedGame.id,
        gameTitle: titledWithDate,
        memberId,
      });

      setIsStartingGame(false);

      if (!result.success || !result.gameState) {
        toast.error(!result.success ? result.message : "Unable to start the game.");
        return;
      }

      setSelectedGameState(result.gameState);
      setSelectedGameTitleOption(String(result.gameState.id));
      setGameTitleInput(result.gameState.gameTitle);
      setSelectedPlayers(emptySelectedPlayers);
      setRoundScores(new Map());
      setPersistedCumulativeScores(null);
      setCricketTurnLedger([]);
      setCricketTurnDarts(["", "", ""]);
      setHasRoundScoreEdits(false);
      setRequestedVisiblePlayerColumns(isCricketGame ? 2 : 8);
      setIsStartDialogOpen(false);
      toast.success(`Started game \"${ result.gameState.gameTitle }\".`);
    });
  };

  const handleSaveGame = () => {
    if (!selectedGame || !selectedGameState) {
      toast.error("Start a game before saving it.");
      return;
    }

    const activePlayers = isCricketGame
      ? selectedPlayers
        .slice(0, 2)
        .map((player, index) => player ? { ...player, playPosition: index + 1 } : null)
        .filter((player): player is SelectedPlayer & { playPosition: number } => player !== null)
      : selectedPlayers
        .map((player, index) => player ? { ...player, playPosition: index + 1 } : null)
        .filter((player): player is SelectedPlayer & { playPosition: number } => player !== null);

    if (activePlayers.length === 0) {
      toast.error("Select at least one player before saving the game.");
      return;
    }

    const scoreboardRows = isCricketGame
      ? cricketTurnLedger.map((turnEntry) => ({
        roundNo: turnEntry.turnNo,
        roundLabel: `Turn ${ turnEntry.turnNo }`,
        scores: activePlayers.map((player) => ({
          memberId: player.id,
          playPosition: player.playPosition,
          roundScore: player.playPosition - 1 === turnEntry.sideIndex ? turnEntry.encodedValue : 0,
          cumulativeScore: turnEntry.boardAfter.scores[player.playPosition - 1],
        })),
      }))
      : roundEntries.map((roundEntry) => ({
        roundNo: roundEntry.roundNo,
        roundLabel: roundEntry.label,
        scores: activePlayers.map((player) => ({
          memberId: player.id,
          playPosition: player.playPosition,
          roundScore: roundScores.get(roundEntry.roundKey)?.get(player.playPosition - 1) ?? 0,
          cumulativeScore: cumulativeScores.get(player.playPosition - 1) ?? 0,
        })),
      }));

    const activeColIndices = activePlayers.map((p) => p.playPosition - 1);
    let saveStatus: "active" | "in_progress" | "completed" | "archived" = selectedGameState.status;

    if (isCricketGame) {
      saveStatus = cricketWinnerSideIndex !== null ? "completed" : "in_progress";
    }
    else {
      // Determine if all numbered round scores have been entered for all active players.
      const numberedRoundKeys = roundEntries
        .filter((re) => re.roundKey > 0)
        .map((re) => re.roundKey);
      const isAllScoresEntered = selectedGame.isRoundBased
        ? (
          numberedRoundKeys.length > 0 &&
          activeColIndices.length > 0 &&
          numberedRoundKeys.every((roundKey) =>
            activeColIndices.every((colIndex) => {
              const score = roundScores.get(roundKey)?.get(colIndex);
              return score !== undefined && score !== 0;
            })
          )
        )
        : (
          activeColIndices.length > 0 &&
          activeColIndices.every((colIndex) =>
            roundScores.get(1)?.get(colIndex) !== undefined
          )
        );
      saveStatus = isAllScoresEntered ? "completed" : selectedGameState.status;
    }

    setIsSavingGame(true);
    startTransition(async () => {
      const result = await saveGameScoreboardAction({
        familyId,
        gameId: selectedGameState.id > 0 ? selectedGameState.id : undefined,
        gameMetaId: selectedGameState.gameMetaId,
        gameTitle: gameTitleInput.trim() || selectedGameState.gameTitle,
        status: saveStatus,
        gamePlayerStates: activePlayers.map((player) => ({
          memberId: player.id,
          playPosition: player.playPosition,
          status: "active",
        })),
        gamePlayerRounds: scoreboardRows,
      });

      setIsSavingGame(false);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setSelectedGameState(result.gameState);
      setSelectedGameTitleOption(String(result.gameState.id));
      setGameTitleInput(result.gameState.gameTitle);

      if (result.gameState.status === 'completed') {
        router.refresh();
      }

      toast.success(
        result.gameState.status === 'completed'
          ? `Game "${ result.gameState.gameTitle }" completed!`
          : result.message,
        {
          description: result.gameState.status === 'completed'
            ? 'All scores entered. Game marked as completed and leaderboard updated.'
            : `${ activePlayers.length } players and ${ scoreboardRows.length } scoreboard rows prepared for persistence.`,
        }
      );
    });
  };

  // Handle round score change
  const handleRoundScoreChange = (
    roundNo: number,
    colIndex: number,
    value: string
  ) => {
    const parsed = value === "" ? 0 : parseInt(value, 10) || 0;
    const numValue = isCricketGame
      ? Math.max(0, Math.min(3, parsed))
      : Math.max(0, parsed);
    const roundMap = roundScores.get(roundNo) || new Map();
    roundMap.set(colIndex, numValue);
    setRoundScores(new Map(roundScores).set(roundNo, roundMap));
    setHasRoundScoreEdits(true);
    setPersistedCumulativeScores(null);
    // TODO: Trigger event to save to game_player_round table
  };

  const handleCricketBonusChange = (
    roundNo: number,
    colIndex: number,
    value: string
  ) => {
    setHasRoundScoreEdits(true);
    setPersistedCumulativeScores(null);
  };

  const handleSetCricketSidePlayer = (sideIndex: CricketSideIndex, value: string) => {
    if (value === ADD_GUEST_OPTION_VALUE) {
      setGuestDialogColIndex(sideIndex);
      setIsGuestDialogOpen(true);
      return;
    }

    if (value === CLEAR_PLAYER_OPTION_VALUE) {
      handleClearPlayerColumn(sideIndex);
      return;
    }

    const selectedMemberId = Number(value);
    const otherSideIndex = sideIndex === 0 ? 1 : 0;
    if (selectedPlayers[otherSideIndex]?.id === selectedMemberId) {
      return;
    }

    const selectedMember = localSelectablePlayers.find((member) => member.id === selectedMemberId);
    if (!selectedMember) {
      return;
    }

    const nextPlayers = [...selectedPlayers];
    nextPlayers[sideIndex] = {
      id: selectedMember.id,
      firstName: selectedMember.firstName,
      lastName: selectedMember.lastName,
      isGuest: selectedMember.isGuest,
    };
    setSelectedPlayers(nextPlayers);
  };

  const handleClearPlayerColumn = (colIndex: number) => {
    const nextPlayers = [...selectedPlayers];
    nextPlayers[colIndex] = null;
    setSelectedPlayers(nextPlayers);

    const updatedRoundScores = new Map<number, Map<number, number>>();
    roundScores.forEach((roundMap, roundKey) => {
      const nextRoundMap = new Map(roundMap);
      nextRoundMap.delete(colIndex);
      if (nextRoundMap.size > 0) {
        updatedRoundScores.set(roundKey, nextRoundMap);
      }
    });

    setRoundScores(updatedRoundScores);
    setPersistedCumulativeScores(null);
    setHasRoundScoreEdits(true);
  };

  const handleLoadPersistedGame = async (gameId: number) => {
    const matchedGameState = gamesData.activeGameStates.find(
      (state) => state.id === gameId
    );

    if (!matchedGameState) {
      toast.error("Unable to load this game into the scoreboard.");
      return;
    }

    setIsLoadingSavedGame(true);

    const result = await loadGameScoreboardAction({
      familyId,
      gameId,
    });

    setIsLoadingSavedGame(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    const loadedPlayers = Array(8).fill(null) as (SelectedPlayer | null)[];
    for (const player of result.scoreboard.players) {
      const positionIndex = player.playPosition - 1;
      if (positionIndex < 0 || positionIndex > 7) {
        continue;
      }

      loadedPlayers[positionIndex] = {
        id: player.memberId,
        firstName: player.firstName,
        lastName: player.lastName,
        isGuest: player.isGuest,
      };
    }

    const loadedGameMeta = gamesData.availableGames.find((game) => game.id === result.scoreboard.gameState.gameMetaId);
    const isLoadedCricketGame = loadedGameMeta?.name.trim().toLowerCase() === "cricket";

    if (isLoadedCricketGame) {
      const loadedLedger: CricketTurnLedgerEntry[] = [];
      const roundGroups = new Map<number, typeof result.scoreboard.rounds>();

      for (const roundRow of result.scoreboard.rounds) {
        const rows = roundGroups.get(roundRow.roundNo) ?? [];
        rows.push(roundRow);
        roundGroups.set(roundRow.roundNo, rows);
      }

      let board = createEmptyCricketBoardState();

      for (const turnNo of Array.from(roundGroups.keys()).sort((left, right) => left - right)) {
        const rows = roundGroups.get(turnNo) ?? [];
        const activeRow = rows.find((row) => row.roundScore > 0) ?? rows[0];

        if (!activeRow) {
          continue;
        }

        const decodedTurn = decodeCricketTurn(activeRow.roundScore);
        const applied = applyCricketTurn(board, decodedTurn.sideIndex, decodedTurn.darts);
        board = applied.boardAfter;
        loadedLedger.push({
          turnNo,
          sideIndex: decodedTurn.sideIndex,
          darts: decodedTurn.darts,
          encodedValue: activeRow.roundScore,
          scoreDelta: applied.scoreDelta,
          boardAfter: cloneCricketBoardState(board),
        });
      }

      setSelectedGameId(result.scoreboard.gameState.gameMetaId);
      setSelectedGameTitleOption(String(result.scoreboard.gameState.id));
      setSelectedGameState(result.scoreboard.gameState);
      setGameTitleInput(result.scoreboard.gameState.gameTitle);
      setSelectedPlayers(loadedPlayers);
      setRequestedVisiblePlayerColumns(2);
      setLocalSelectablePlayers((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const missing = loadedPlayers
          .filter((p): p is SelectedPlayer => p !== null && !existingIds.has(p.id));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
      setRoundScores(new Map());
      setCricketTurnLedger(loadedLedger);
      setCricketTurnDarts(["", "", ""]);
      setPersistedCumulativeScores(new Map([[0, board.scores[0]], [1, board.scores[1]]]));
      setHasRoundScoreEdits(false);
      return;
    }

    const loadedRoundScores = new Map<number, Map<number, number>>();
    const loadedCumulativeScoresByPosition = new Map<number, {
      roundNo: number;
      cumulativeScore: number;
    }>();

    for (const roundRow of result.scoreboard.rounds) {
      const positionIndex = roundRow.playPosition - 1;
      if (positionIndex < 0 || positionIndex > 7) {
        continue;
      }

      const scoreRow = loadedRoundScores.get(roundRow.roundNo) ?? new Map<number, number>();
      scoreRow.set(positionIndex, roundRow.roundScore);
      loadedRoundScores.set(roundRow.roundNo, scoreRow);

      const existingCumulative = loadedCumulativeScoresByPosition.get(positionIndex);
      if (!existingCumulative || roundRow.roundNo >= existingCumulative.roundNo) {
        loadedCumulativeScoresByPosition.set(positionIndex, {
          roundNo: roundRow.roundNo,
          cumulativeScore: roundRow.cumulativeScore,
        });
      }
    }

    const loadedCumulativeScores = new Map<number, number>();
    for (const [positionIndex, value] of loadedCumulativeScoresByPosition.entries()) {
      loadedCumulativeScores.set(positionIndex, value.cumulativeScore);
    }

    setSelectedGameId(result.scoreboard.gameState.gameMetaId);
    setSelectedGameTitleOption(String(result.scoreboard.gameState.id));
    setSelectedGameState(result.scoreboard.gameState);
    setGameTitleInput(result.scoreboard.gameState.gameTitle);
    setSelectedPlayers(loadedPlayers);
    const loadedPlayerCount = loadedPlayers.filter((player) => player !== null).length;
    setRequestedVisiblePlayerColumns(isLoadedCricketGame ? 2 : Math.max(1, loadedPlayerCount));
    setLocalSelectablePlayers((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const missing = loadedPlayers
        .filter((p): p is SelectedPlayer => p !== null && !existingIds.has(p.id));
      return missing.length > 0 ? [...prev, ...missing] : prev;
    });
    setRoundScores(loadedRoundScores);
    setPersistedCumulativeScores(loadedCumulativeScores);
    setHasRoundScoreEdits(false);
  };

  const handleResetGameBoard = () => {
    if (!selectedGameState) {
      return;
    }

    setRoundScores(new Map());
    setCricketTurnLedger([]);
    setCricketTurnDarts(["", "", ""]);
    setPersistedCumulativeScores(null);
    setHasRoundScoreEdits(true);
    toast.success("Game board reset. Save to persist changes.");
  };

  const handleSubmitCricketTurn = () => {
    if (!isCricketGame) {
      return;
    }

    if (!selectedPlayers[0] || !selectedPlayers[1]) {
      toast.error("Select both Cricket sides before submitting a turn.");
      return;
    }

    if (cricketWinnerSideIndex !== null) {
      toast.error("This Cricket game is already complete. Start a new game to continue.");
      return;
    }

    setIsSubmittingCricketTurn(true);
    startTransition(() => {
      const sanitizedDarts = cricketTurnDarts.map((dart) => dart.trim()).slice(0, 3);
      const applied = applyCricketTurn(cricketBoardState, cricketActiveSideIndex, sanitizedDarts);
      const encodedValue = encodeCricketTurn(sanitizedDarts, cricketActiveSideIndex);
      const nextTurn: CricketTurnLedgerEntry = {
        turnNo: cricketTurnLedger.length + 1,
        sideIndex: cricketActiveSideIndex,
        darts: sanitizedDarts,
        encodedValue,
        scoreDelta: applied.scoreDelta,
        boardAfter: applied.boardAfter,
      };

      setCricketTurnLedger((prev) => [...prev, nextTurn]);
      setCricketTurnDarts(["", "", ""]);
      setHasRoundScoreEdits(true);
      setPersistedCumulativeScores(null);
      setIsSubmittingCricketTurn(false);

      const winner = determineCricketWinner(applied.boardAfter);
      if (winner !== null) {
        toast.success(`Side ${ winner + 1 } has won Cricket.`);
      }
      else {
        toast.success(`Turn submitted for Side ${ cricketActiveSideIndex + 1 }.`);
      }
    });
  };

  const handleAddGuest = () => {
    if (guestDialogColIndex === null) return;

    const trimmedFirst = guestFirstName.trim();
    const trimmedLast = guestLastName.trim();
    const trimmedEmail = guestEmail.trim();

    if (!trimmedFirst || !trimmedLast || !trimmedEmail) {
      toast.error("First name, last name, and email are required.");
      return;
    }

    setIsAddingGuest(true);
    startTransition(async () => {
      const result = await addGuestMemberAction({
        familyId,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        email: trimmedEmail,
      });

      setIsAddingGuest(false);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setLocalSelectablePlayers((prev) => [...prev, result.guestMember]);

      const newPlayers = [...selectedPlayers];
      newPlayers[guestDialogColIndex] = {
        id: result.guestMember.id,
        firstName: result.guestMember.firstName,
        lastName: result.guestMember.lastName,
        isGuest: result.guestMember.isGuest,
      };
      setSelectedPlayers(newPlayers);

      setIsGuestDialogOpen(false);
      setGuestFirstName("");
      setGuestLastName("");
      setGuestEmail("");
      setGuestDialogColIndex(null);
      toast.success(`Guest ${ trimmedFirst } ${ trimmedLast } added.`);
    });
  };

  const handleArchiveSelectedGame = () => {
    if (!selectedGameState || selectedGameState.status !== "completed") {
      return;
    }

    setIsArchivingGame(true);
    startTransition(async () => {
      const result = await archiveGameAction({
        familyId,
        gameId: selectedGameState.id,
      });

      setIsArchivingGame(false);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      const archivedTitle = result.gameState.gameTitle;
      handleSetNewGameMode();
      setIsContinueGameHidden(false);
      router.refresh();
      toast.success(`Game "${ archivedTitle }" archived.`);
    });
  };

  const handleDeleteSelectedGame = () => {
    if (!selectedGameState) {
      return;
    }

    setIsDeletingGame(true);
    startTransition(async () => {
      const result = await deleteGameAction({
        familyId,
        gameId: selectedGameState.id,
      });

      setIsDeletingGame(false);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      handleSetNewGameMode();
      setIsContinueGameHidden(false);
      router.refresh();
      toast.success(result.message);
    });
  };

  // Get unique game statuses and dates for filters
  const uniqueStatuses = useMemo(
    () => Array.from(new Set(gamesData.gameHistory.map((g) => g.gameStatus))),
    [gamesData.gameHistory]
  );

  const uniqueDates = useMemo(
    () => Array.from(new Set(gamesData.gameHistory.map((g) => g.gameStartDate))),
    [gamesData.gameHistory]
  );

  const uniqueTitles = useMemo(
    () => Array.from(new Set(gamesData.gameHistory.map((g) => g.gameTitle))),
    [gamesData.gameHistory]
  );

  // Recalculate leaderboards based on selected game type
  const gameLeaderboards = useMemo(() => {
    if (!selectedGameId) {
      return gamesData.leaderboards;
    }

    const completedGamesByType = filteredGameHistory.filter(
      (row) => row.gameStatus === 'completed' && row.gameScore !== 0
    );

    if (completedGamesByType.length === 0) {
      return {
        lowScore: null,
        highScore: null,
        playerStats: [],
      };
    }

    const playerStatsMap = new Map<number, {
      playerId: number;
      playerFirstName: string;
      playerLastName: string;
      gamesPlayed: number;
      gamesWon: number;
    }>();

    // Calculate player stats
    const uniqueGameIds = new Set<number>();
    for (const game of completedGamesByType) {
      uniqueGameIds.add(game.gameId);
      const current = playerStatsMap.get(game.playerId) ?? {
        playerId: game.playerId,
        playerFirstName: game.playerFirstName,
        playerLastName: game.playerLastName,
        gamesPlayed: 0,
        gamesWon: 0,
      };

      const isWin = selectedGame?.highOrLo === "high" ? game.isHighest : game.isLowest;
      if (isWin) {
        current.gamesWon += 1;
      }

      playerStatsMap.set(game.playerId, current);
    }

    // Set games played based on unique games
    for (const [playerId, stats] of playerStatsMap) {
      const playerGames = new Set(
        completedGamesByType
          .filter((g) => g.playerId === playerId)
          .map((g) => g.gameId)
      );
      stats.gamesPlayed = playerGames.size;
    }

    const playerStatsArray = Array.from(playerStatsMap.values())
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

    const lowScore = completedGamesByType.length > 0
      ? {
        playerFirstName: completedGamesByType.reduce((acc, row) =>
          row.gameScore < acc.gameScore ? row : acc
        ).playerFirstName,
        playerLastName: completedGamesByType.reduce((acc, row) =>
          row.gameScore < acc.gameScore ? row : acc
        ).playerLastName,
        gameScore: completedGamesByType.reduce((acc, row) =>
          row.gameScore < acc.gameScore ? row : acc
        ).gameScore,
        gameStartDate: completedGamesByType.reduce((acc, row) =>
          row.gameScore < acc.gameScore ? row : acc
        ).gameStartDate,
      }
      : null;

    const highScore = completedGamesByType.length > 0
      ? {
        playerFirstName: completedGamesByType.reduce((acc, row) =>
          row.gameScore > acc.gameScore ? row : acc
        ).playerFirstName,
        playerLastName: completedGamesByType.reduce((acc, row) =>
          row.gameScore > acc.gameScore ? row : acc
        ).playerLastName,
        gameScore: completedGamesByType.reduce((acc, row) =>
          row.gameScore > acc.gameScore ? row : acc
        ).gameScore,
        gameStartDate: completedGamesByType.reduce((acc, row) =>
          row.gameScore > acc.gameScore ? row : acc
        ).gameStartDate,
      }
      : null;

    return {
      lowScore,
      highScore,
      playerStats: playerStatsArray,
    };
  }, [selectedGameId, filteredGameHistory]);

  const isHighWins = selectedGame?.highOrLo === "high";
  const scoreUom = selectedGame?.scoreUom || "points";
  const isDollarScore = scoreUom.toLowerCase() === "dollars";
  const formatScore = (value: number) => {
    const formatted = new Intl.NumberFormat("en-US").format(value);
    return isDollarScore ? `$${ formatted }` : `${ formatted } ${ scoreUom }`;
  };
  const lowestScore = gameLeaderboards.lowScore;
  const highestScore = gameLeaderboards.highScore;
  const playerStats = gameLeaderboards.playerStats;

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(70,36,8,0.95),rgba(124,63,16,0.86)_56%,rgba(181,115,44,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(70,36,8,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5">
            <div className="max-w-4xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#ffe0bc]">
                Family Game Scoreboards
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#fff0df] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ArrowLeft className="font-app mr-2 size-4" />
                  Back to Main Page
                </Link>
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Welcome back { firstName }! Track family game history, compare leaderboards, and start a new scorecard.
              </h1>
            </div>
          </div>
        </div>

        {/* Main Layout: Part A (Scoreboard) | Parts B & C (Leaderboard & History) */ }
        <div className="grid grid-cols-1 items-start gap-4 md:gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,1fr)]">
          {/* Part A: Game Scoreboard (left) */ }
          <div className="min-w-0">
            <Card className="rounded-[1.9rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_70px_-40px_rgba(96,52,20,0.75)] backdrop-blur">
              <div className="mb-6 flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-[#5c2e1a]">
                  Scoreboard
                </h2>
                <FeatureFaqHelp
                  href="/feature-faq?category=Game%20Scoreboards"
                  buttonClassName="h-4 w-4 md:h-7 md:w-7 border-[#e8c4a0] bg-gradient-to-b from-[#fffaf4] to-[#fde7d5] text-[#b8581a] shadow-[0_8px_18px_rgba(184,88,26,0.2)] group-hover:shadow-[0_12px_26px_rgba(184,88,26,0.28)]"
                  iconClassName="h-3 w-3 md:h-4 md:w-4 text-[#b8581a]"
                  tooltipClassName="bg-[#5c2e1a] text-[#fff6ef]"
                />
              </div>

              {/* Game Selection, Title, and Action Buttons */ }
              <div className="mb-6 flex flex-wrap items-end gap-4">
                <Select
                  value={ selectedGameId ? String(selectedGameId) : "" }
                  onValueChange={ (val) => {
                    const id = parseInt(val);
                    setSelectedGameId(id);
                    const game = gamesData.availableGames.find((g) => g.id === id);
                    const isSelectedCricket = game?.name.trim().toLowerCase() === "cricket";
                    if (game) {
                      setSelectedGameTitleOption(NEW_GAME_OPTION_VALUE);
                      setSelectedGameState(null);
                      setGameTitleInput("");
                    }
                    setSelectedPlayers(emptySelectedPlayers);
                    setRoundScores(new Map());
                    setCricketTurnLedger([]);
                    setCricketTurnDarts(["", "", ""]);
                    setPersistedCumulativeScores(null);
                    setHasRoundScoreEdits(false);
                    setRequestedVisiblePlayerColumns(isSelectedCricket ? 2 : 1);
                    router.refresh();
                  } }
                >
                  <SelectTrigger className="w-64 border-[#e8c4a0] bg-[#fffaf5] text-[#5c2e1a]">
                    <SelectValue placeholder="Select a game..." />
                  </SelectTrigger>
                  <SelectContent>
                    { gamesData.availableGames.map((game) => (
                      <SelectItem key={ game.id } value={ String(game.id) }>
                        { game.name }
                      </SelectItem>
                    )) }
                  </SelectContent>
                </Select>

                <Select
                  value={ selectedGameTitleOption }
                  onValueChange={ (val) => {
                    setSelectedGameTitleOption(val);

                    if (val === NEW_GAME_OPTION_VALUE) {
                      setSelectedGameState(null);
                      setGameTitleInput("");
                      setSelectedPlayers(emptySelectedPlayers);
                      setRoundScores(new Map());
                      setCricketTurnLedger([]);
                      setCricketTurnDarts(["", "", ""]);
                      setPersistedCumulativeScores(null);
                      setHasRoundScoreEdits(false);
                      setRequestedVisiblePlayerColumns(isCricketGame ? 2 : 1);
                      return;
                    }

                    const stateId = Number(val);
                    void handleLoadPersistedGame(stateId);
                  } }
                  disabled={ !selectedGameId }
                >
                  <SelectTrigger className="w-72 border-[#e8c4a0] bg-[#fffaf5] text-[#5c2e1a]">
                    <SelectValue placeholder="Select game title..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ NEW_GAME_OPTION_VALUE }>New Game</SelectItem>
                    { gameStatesForSelectedMetadata.map((state) => (
                      <SelectItem key={ state.id } value={ String(state.id) }>
                        { state.gameTitle }
                      </SelectItem>
                    )) }
                  </SelectContent>
                </Select>

                { !selectedGameState && (
                  <Button
                    onClick={ handleStartOrContinueGame }
                    disabled={ !selectedGame || isStartingGame || isLoadingSavedGame }
                    className="bg-[linear-gradient(135deg,#b76428,#df8a42)] text-white hover:bg-[linear-gradient(135deg,#9f5721,#c87934)]"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    { isStartingGame ? "Starting..." : "Start New Game" }
                  </Button>
                ) }

                { selectedGameState?.status === "in_progress" && !isContinueGameHidden && (
                  <Button
                    onClick={ handleStartOrContinueGame }
                    disabled={ isLoadingSavedGame }
                    className="bg-[linear-gradient(135deg,#b76428,#df8a42)] text-white hover:bg-[linear-gradient(135deg,#9f5721,#c87934)]"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Continue Game
                  </Button>
                ) }

                { !isCricketGame
                  && isAcquireGame
                  && selectedGameState?.status === "in_progress"
                  && !isContinueGameHidden
                  && requestedVisiblePlayerColumns < 8 && (
                    <Button
                      onClick={ handleAddPlayerColumn }
                      disabled={ isLoadingSavedGame }
                      variant="outline"
                      className="border-[#d8ab7f] bg-[#fff6ef] text-[#7b3306] hover:bg-[#ffefdf]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Player
                    </Button>
                  ) }

                { selectedGameState?.status === "completed" && (
                  <Button
                    onClick={ handleArchiveSelectedGame }
                    disabled={ isArchivingGame }
                    variant="outline"
                    className="border-[#d8ab7f] bg-[#fff6ef] text-[#7b3306] hover:bg-[#ffefdf]"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    { isArchivingGame ? "Archiving..." : "Archive Game" }
                  </Button>
                ) }

                { hasRoundScoreEdits && (
                  <Button
                    onClick={ handleSaveGame }
                    disabled={ !selectedGameState || isSavingGame }
                    variant="outline"
                    className="border-[#d8ab7f] bg-[#fff6ef] text-[#7b3306] hover:bg-[#ffefdf]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    { isSavingGame ? "Saving..." : "Save Game" }
                  </Button>
                ) }

                { selectedGameState?.status === "in_progress" && (
                  <Button
                    onClick={ handleResetGameBoard }
                    disabled={ isSavingGame || isLoadingSavedGame }
                    variant="outline"
                    className="border-[#d8ab7f] bg-[#fff6ef] text-[#7b3306] hover:bg-[#ffefdf]"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Board
                  </Button>
                ) }

                { selectedGameState && (
                  <Button
                    onClick={ handleDeleteSelectedGame }
                    disabled={ isDeletingGame || isSavingGame }
                    variant="outline"
                    className="border-[#e5b4b4] bg-[#fff5f5] text-[#9a2e2e] hover:bg-[#ffecec]"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    { isDeletingGame ? "Deleting..." : "Delete Game" }
                  </Button>
                ) }

                { selectedGameState && persistedCumulativeScores && !hasRoundScoreEdits && (
                  <span className="inline-flex items-center rounded-full border border-[#d8ab7f] bg-[#fff2e5] px-3 py-1 text-xs font-semibold text-[#8b5a3c]">
                    Loaded from Saved Game
                  </span>
                ) }
              </div>

              {/* Scoreboard Table */ }
              { selectedGameState ? (
                <div
                  ref={ scoreboardGridRef }
                  tabIndex={ -1 }
                  className="overflow-x-auto rounded-[1.35rem] border border-[#f0d9c4]"
                >
                  { isCricketGame ? (
                    <div className="space-y-5">
                      <div className="rounded-[1.6rem] border border-[#f0d9c4] bg-[#fffaf5] p-5 shadow-[0_16px_45px_-32px_rgba(96,52,20,0.55)]">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                          <div>
                            <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Cricket Turn Ledger</p>
                            <h3 className="mt-2 text-2xl font-black tracking-tight text-[#5c2e1a]">{ cricketWinnerSideIndex !== null ? `Side ${ cricketWinnerSideIndex + 1 } wins` : `Side ${ cricketActiveSideIndex + 1 } to throw` }</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8b5a3c]">
                              Enter the 3 darts for the current turn. The board, closure marks, and scoring totals update automatically.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-[#e8c4a0] bg-white px-3 py-1 text-xs font-semibold text-[#8b5a3c]">Side 1: { cricketBoardState.scores[0] }</span>
                            <span className="rounded-full border border-[#e8c4a0] bg-white px-3 py-1 text-xs font-semibold text-[#8b5a3c]">Side 2: { cricketBoardState.scores[1] }</span>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          { [0, 1].map((sideIndex) => {
                            const player = selectedPlayers[sideIndex];

                            return (
                              <div key={ `cricket-side-${ sideIndex }` } className="space-y-1">
                                <Label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a85a3a]">Side { sideIndex + 1 }</Label>
                                <Select
                                  value={ player ? String(player.id) : "" }
                                  onValueChange={ (value) => handleSetCricketSidePlayer(sideIndex as CricketSideIndex, value) }
                                >
                                  <SelectTrigger className="w-full border-[#e8c4a0] bg-white text-[#5c2e1a]">
                                    <SelectValue placeholder={ `Select Side ${ sideIndex + 1 } Player` } />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={ CLEAR_PLAYER_OPTION_VALUE } disabled={ !player }>
                                      Unselect player
                                    </SelectItem>
                                    <SelectItem value={ ADD_GUEST_OPTION_VALUE }>
                                      + Add a guest
                                    </SelectItem>
                                    { orderedSelectablePlayers.map((member) => {
                                      const otherSideIndex = sideIndex === 0 ? 1 : 0;
                                      const selectedInOtherSide = selectedPlayers[otherSideIndex]?.id === member.id;

                                      return (
                                        <SelectItem
                                          key={ member.id }
                                          value={ String(member.id) }
                                          disabled={ selectedInOtherSide }
                                        >
                                          { getPlayerOptionLabel(member) }
                                        </SelectItem>
                                      );
                                    }) }
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          }) }
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                          { cricketTurnDarts.map((dart, index) => (
                            <div key={ `cricket-dart-${ index }` } className="space-y-1">
                              <Label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a85a3a]">Dart { index + 1 }</Label>
                              <Input
                                value={ dart }
                                onChange={ (event) => {
                                  const next = [...cricketTurnDarts];
                                  next[index] = event.target.value;
                                  setCricketTurnDarts(next);
                                  setHasRoundScoreEdits(true);
                                } }
                                placeholder="S20, D18, T20, miss"
                                className="border-[#e8c4a0] bg-white text-[#5c2e1a]"
                                disabled={ cricketWinnerSideIndex !== null }
                              />
                            </div>
                          )) }
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            type="button"
                            onClick={ handleSubmitCricketTurn }
                            disabled={ cricketWinnerSideIndex !== null || isSubmittingCricketTurn }
                            className="bg-[linear-gradient(135deg,#b76428,#df8a42)] text-white hover:bg-[linear-gradient(135deg,#9f5721,#c87934)]"
                          >
                            { isSubmittingCricketTurn ? "Submitting..." : "Submit Turn" }
                          </Button>
                          <Button
                            type="button"
                            onClick={ handleResetGameBoard }
                            disabled={ isSubmittingCricketTurn }
                            variant="outline"
                            className="border-[#d8ab7f] bg-[#fff6ef] text-[#7b3306] hover:bg-[#ffefdf]"
                          >
                            <RotateCcw className="mr-2 size-4" />
                            Reset Board
                          </Button>
                        </div>
                      </div>

                      <table className="w-full min-w-208 table-fixed border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className="w-32 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-[#a85a3a]">Side 1 Bonus</th>
                            <th className="w-40 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-[#a85a3a]">Side 1 Marks</th>
                            <th className="w-24 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-center font-black text-[#5c2e1a]">Target</th>
                            <th className="w-40 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-[#a85a3a]">Side 2 Marks</th>
                            <th className="w-32 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-[#a85a3a]">Side 2 Bonus</th>
                          </tr>
                        </thead>
                        <tbody>
                          { CRICKET_TARGETS.map((target) => {
                            const marks = cricketBoardState.marksByTarget.get(target.roundKey) ?? [0, 0];
                            const bonuses = cricketBoardState.bonusByTarget.get(target.roundKey) ?? [0, 0];
                            const side1MarkDisplay = marks[0] === 0 ? "" : marks[0] === 1 ? "/" : marks[0] === 2 ? "X" : "O";
                            const side2MarkDisplay = marks[1] === 0 ? "" : marks[1] === 1 ? "/" : marks[1] === 2 ? "X" : "O";

                            return (
                              <tr key={ `cricket-board-${ target.roundKey }` }>
                                <td className="border border-[#f0d9c4] bg-white p-2 text-center font-semibold text-[#8b5a3c]">{ bonuses[0] || "-" }</td>
                                <td className="border border-[#f0d9c4] bg-white p-2 text-center">
                                  <span className="inline-flex min-w-8 justify-center rounded-full bg-[#fff6ef] px-2 py-1 text-sm font-black text-[#7b3306]">{ side1MarkDisplay || "-" }</span>
                                </td>
                                <td className="border border-[#f0d9c4] bg-[#fff8f2] p-2 text-center font-black text-[#8b5a3c]">{ target.label }</td>
                                <td className="border border-[#f0d9c4] bg-white p-2 text-center">
                                  <span className="inline-flex min-w-8 justify-center rounded-full bg-[#fff6ef] px-2 py-1 text-sm font-black text-[#7b3306]">{ side2MarkDisplay || "-" }</span>
                                </td>
                                <td className="border border-[#f0d9c4] bg-white p-2 text-center font-semibold text-[#8b5a3c]">{ bonuses[1] || "-" }</td>
                              </tr>
                            );
                          }) }
                          <tr>
                            <td className={ `border border-[#f0d9c4] bg-[#fff6ef] p-2 text-center font-bold text-[#5c2e1a] ${ getScoreStyle(0) }` } colSpan={ 2 }>
                              Side 1 Total: { cricketBoardState.scores[0] }
                            </td>
                            <td className="border border-[#f0d9c4] bg-[#fff6ef] p-2 text-center text-xs font-semibold text-[#a85a3a]">Totals</td>
                            <td className={ `border border-[#f0d9c4] bg-[#fff6ef] p-2 text-center font-bold text-[#5c2e1a] ${ getScoreStyle(1) }` } colSpan={ 2 }>
                              Side 2 Total: { cricketBoardState.scores[1] }
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="rounded-[1.6rem] border border-[#f0d9c4] bg-white p-4">
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Turn History</p>
                        <div className="mt-3 space-y-2">
                          { cricketTurnLedger.length > 0 ? cricketTurnLedger.slice().reverse().map((turn) => (
                            <div key={ `cricket-turn-${ turn.turnNo }` } className="rounded-xl border border-[#f0d9c4] bg-[#fffaf5] p-3 text-sm text-[#5c2e1a]">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-semibold">Turn { turn.turnNo } - Side { turn.sideIndex + 1 }</span>
                                <span className="text-[#8b5a3c]">+{ turn.scoreDelta } points</span>
                              </div>
                              <p className="mt-1 text-[#8b5a3c]">{ turn.darts.map((dart) => dart || "miss").join(", ") }</p>
                            </div>
                          )) : (
                            <p className="text-sm text-[#8b5a3c]">No turns entered yet.</p>
                          ) }
                        </div>
                      </div>
                    </div>
                  ) : (
                    <table className="w-full max-w-245 table-fixed text-sm border-collapse">
                      <thead>
                        {/* Header Row 1: Column Headers with Player Selection */ }
                        <tr>
                          <th className="w-16 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-left text-[#a85a3a]">
                            Round
                          </th>
                          { visiblePlayerColumnIndices.map((idx, visibleIdx) => {
                            const player = selectedPlayers[idx];
                            return (
                              <th
                                key={ `player-header-${ idx }` }
                                className="w-32 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-[#a85a3a]"
                              >
                                <Select
                                  value={ player ? String(player.id) : "" }
                                  onValueChange={ (val) => {
                                    if (val === ADD_GUEST_OPTION_VALUE) {
                                      setGuestDialogColIndex(idx);
                                      setIsGuestDialogOpen(true);
                                      return;
                                    }

                                    if (val === CLEAR_PLAYER_OPTION_VALUE) {
                                      handleClearPlayerColumn(idx);
                                      return;
                                    }

                                    const selectedMemberId = Number(val);
                                    const selectedInOtherColumn = selectedPlayers.some(
                                      (existingPlayer, existingIdx) =>
                                        existingIdx !== idx && existingPlayer?.id === selectedMemberId
                                    );

                                    if (selectedInOtherColumn) {
                                      return;
                                    }

                                    const selectedMember = localSelectablePlayers.find(
                                      (member) => member.id === selectedMemberId
                                    );

                                    if (!selectedMember) {
                                      return;
                                    }

                                    const newPlayers = [...selectedPlayers];
                                    newPlayers[idx] = {
                                      id: selectedMember.id,
                                      firstName: selectedMember.firstName,
                                      lastName: selectedMember.lastName,
                                      isGuest: selectedMember.isGuest,
                                    };
                                    setSelectedPlayers(newPlayers);
                                  } }
                                >
                                  <SelectTrigger className="w-full border-[#e8c4a0] bg-white text-xs text-[#5c2e1a]">
                                    <SelectValue placeholder={ `P${ visibleIdx + 1 }` } />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem
                                      value={ CLEAR_PLAYER_OPTION_VALUE }
                                      disabled={ !player }
                                    >
                                      Unselect player
                                    </SelectItem>
                                    <SelectItem value={ ADD_GUEST_OPTION_VALUE }>
                                      + Add a guest
                                    </SelectItem>
                                    { orderedSelectablePlayers.map((member) => {
                                      const selectedInOtherColumn = selectedPlayers.some(
                                        (existingPlayer, existingIdx) =>
                                          existingIdx !== idx && existingPlayer?.id === member.id
                                      );

                                      return (
                                        <SelectItem
                                          key={ member.id }
                                          value={ String(member.id) }
                                          disabled={ selectedInOtherColumn }
                                        >
                                          { getPlayerOptionLabel(member) }
                                        </SelectItem>
                                      );
                                    }) }
                                  </SelectContent>
                                </Select>
                              </th>
                            );
                          }) }
                        </tr>

                        {/* Header Row 2: Cumulative Scores */ }
                        { selectedGame?.isRoundBased !== false && (
                          <tr>
                            <th className="w-16 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-left text-[#a85a3a]">
                              Total
                            </th>
                            { visiblePlayerColumnIndices.map((idx) => {
                              const score = cumulativeScores.get(idx) ?? 0;
                              return (
                                <th
                                  key={ `score-total-${ idx }` }
                                  className={ `w-32 border border-[#f0d9c4] bg-[#fff6ef] p-2 font-bold text-[#5c2e1a] ${ getScoreStyle(idx) }` }
                                >
                                  { score || "-" }
                                </th>
                              );
                            }) }
                          </tr>
                        ) }
                      </thead>

                      {/* Round Scores */ }
                      <tbody>
                        { roundEntries.map((roundEntry) => {
                          const roundNo = roundEntry.roundNo;
                          return (
                            <tr key={ `round-${ roundEntry.label }` }>
                              <td className="w-16 border border-[#f0d9c4] bg-[#fff8f2] p-2 text-center font-semibold text-[#8b5a3c]">
                                { roundEntry.label }
                              </td>
                              { visiblePlayerColumnIndices.map((colIdx) => {
                                const isFinalOnlyRow = selectedGame?.isRoundBased === false && roundEntry.roundNo === 1;
                                return (
                                  <td
                                    key={ `round-score-${ roundEntry.label }-${ colIdx }` }
                                    className={ `w-32 border border-[#f0d9c4] bg-white p-2 ${ isFinalOnlyRow ? getScoreStyle(colIdx) : "" }` }
                                  >
                                    <Input
                                      type="number"
                                      className="w-full border-[#e8c4a0] bg-[#fffaf5] text-center text-[#5c2e1a]"
                                      placeholder="0"
                                      value={
                                        roundScores.get(roundEntry.roundKey)?.get(colIdx) ?? ""
                                      }
                                      onChange={ (e) =>
                                        handleRoundScoreChange(
                                          roundEntry.roundKey,
                                          colIdx,
                                          e.target.value
                                        )
                                      }
                                    />
                                  </td>
                                );
                              }) }
                            </tr>
                          );
                        }) }
                      </tbody>
                    </table>
                  ) }
                </div>
              ) : (
                <div className="py-12 text-center text-[#8b5a3c]">
                  Select a game and click &quot;Start Game&quot; to begin scoring
                </div>
              ) }
            </Card>
          </div>

          {/* Parts B & C: Leaderboard and History (right side) */ }
          { selectedGameId ? (
            <div className="min-w-0 space-y-6">
              {/* Part B: Leaderboard */ }
              <Card className="rounded-[1.9rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_70px_-40px_rgba(96,52,20,0.75)] backdrop-blur">
                <h2 className="mb-4 text-xl font-black tracking-tight text-[#5c2e1a]">
                  Leaderboard
                </h2>

                {/* High Score */ }
                <div className="mb-5 border-b border-[#f0d9c4] pb-5">
                  <p className="text-xs uppercase tracking-wide text-[#a85a3a]">
                    High Score
                  </p>
                  { highestScore ? (
                    <>
                      <p className={ `text-lg font-bold mt-1 ${ isHighWins ? "text-green-400" : "text-red-400" }` }>
                        { highestScore.playerFirstName } { highestScore.playerLastName }
                      </p>
                      <p className="text-sm text-[#734f3a]">
                        { formatScore(highestScore.gameScore) }
                      </p>
                      <p className="mt-1 text-xs text-[#8b5a3c]">
                        { highestScore.gameStartDate }
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-[#8b5a3c]">No games yet</p>
                  ) }
                </div>

                {/* Low Score */ }
                <div className="mb-5 border-b border-[#f0d9c4] pb-5">
                  <p className="text-xs uppercase tracking-wide text-[#a85a3a]">
                    Low Score
                  </p>
                  { lowestScore ? (
                    <>
                      <p className={ `text-lg font-bold mt-1 ${ isHighWins ? "text-red-400" : "text-green-400" }` }>
                        { lowestScore.playerFirstName } { lowestScore.playerLastName }
                      </p>
                      <p className="text-sm text-[#734f3a]">
                        { formatScore(lowestScore.gameScore) }
                      </p>
                      <p className="mt-1 text-xs text-[#8b5a3c]">
                        { lowestScore.gameStartDate }
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-[#8b5a3c]">No games yet</p>
                  ) }
                </div>

                {/* Player Stats */ }
                <div>
                  <p className="mb-3 text-xs uppercase tracking-wide text-[#a85a3a]">
                    Player Stats
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    { playerStats.length > 0 ? (
                      playerStats.map((stat, idx) => (
                        <div
                          key={ idx }
                          className="rounded bg-[#fff8f2] p-2 text-xs"
                        >
                          <p className="font-semibold text-[#5c2e1a]">
                            { stat.playerFirstName } { stat.playerLastName }
                          </p>
                          <p className="text-[#8b5a3c]">
                            Played: { stat.gamesPlayed } | Won: { stat.gamesWon } | Lost:{ " " }
                            { stat.gamesLost }
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[#8b5a3c]">No player stats yet</p>
                    ) }
                  </div>
                </div>
              </Card>

              {/* Part C: Game History with Filters */ }
              <Card className="rounded-[1.9rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_70px_-40px_rgba(96,52,20,0.75)] backdrop-blur">
                <h2 className="mb-4 text-xl font-black tracking-tight text-[#5c2e1a]">
                  Game History
                </h2>

                {/* Filter Controls */ }
                <div className="space-y-2 mb-4">
                  <Select value={ gameStatusFilter } onValueChange={ setGameStatusFilter }>
                    <SelectTrigger className="w-full border-[#e8c4a0] bg-[#fffaf5] text-xs text-[#5c2e1a]">
                      <SelectValue placeholder="Game Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      { uniqueStatuses.map((status) => (
                        <SelectItem key={ status } value={ status }>
                          { status }
                        </SelectItem>
                      )) }
                    </SelectContent>
                  </Select>

                  <Select value={ gameDateFilter } onValueChange={ setGameDateFilter }>
                    <SelectTrigger className="w-full border-[#e8c4a0] bg-[#fffaf5] text-xs text-[#5c2e1a]">
                      <SelectValue placeholder="Game Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      { uniqueDates.map((date) => (
                        <SelectItem key={ date } value={ date }>
                          { date }
                        </SelectItem>
                      )) }
                    </SelectContent>
                  </Select>

                  <Select value={ gameTitle } onValueChange={ setGameTitle }>
                    <SelectTrigger className="w-full border-[#e8c4a0] bg-[#fffaf5] text-xs text-[#5c2e1a]">
                      <SelectValue placeholder="Game Title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Games</SelectItem>
                      { uniqueTitles.map((title) => (
                        <SelectItem key={ title } value={ title }>
                          { title }
                        </SelectItem>
                      )) }
                    </SelectContent>
                  </Select>
                </div>

                {/* Game History Table */ }
                <div className="max-h-96 overflow-y-auto">
                  { groupedGameHistory.size > 0 ? (
                    Array.from(groupedGameHistory.entries()).map(
                      ([date, gamesByIdMap]) => (
                        <div key={ date } className="mb-4">
                          <p className="mb-2 text-xs font-semibold text-[#8b5a3c]">
                            { date }
                          </p>
                          <div className="space-y-1">
                            { Array.from(gamesByIdMap.entries()).map(([gameId, playersInGame]) => (
                              <div key={ `game-${ gameId }` } className="mb-2">
                                <div className="rounded bg-[#fff8f2] px-2 py-1 text-xs text-[#8b5a3c]">
                                  { playersInGame[0]?.gameTitle }
                                </div>
                                <div className="space-y-1 ml-2">
                                  { playersInGame.map((game, playerIdx) => {
                                    const isLowest = game.isLowest;
                                    const isHighest = game.isHighest;
                                    const bgColor = isHighWins
                                      ? (isHighest
                                        ? "bg-emerald-400/30"
                                        : isLowest
                                          ? "bg-red-200/60"
                                          : "bg-[#fff8f2]")
                                      : (isLowest
                                        ? "bg-emerald-400/30"
                                        : isHighest
                                          ? "bg-red-200/60"
                                          : "bg-[#fff8f2]");

                                    return (
                                      <div
                                        key={ `${ gameId }-player-${ playerIdx }` }
                                        className={ `cursor-pointer rounded p-2 transition hover:bg-[#ffefdf] ${ bgColor }` }
                                        onClick={ () => {
                                          void handleLoadPersistedGame(game.gameId);
                                        } }
                                      >
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-[#5c2e1a]">
                                            { game.playerFirstName } { game.playerLastName }
                                          </span>
                                          <span className="font-bold text-[#734f3a]">
                                            { formatScore(game.gameScore) }
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  }) }
                                </div>
                              </div>
                            )) }
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="py-8 text-center text-[#8b5a3c]">
                      No games matching filters
                    </div>
                  ) }
                </div>
                { isLoadingSavedGame && (
                  <p className="mt-3 text-xs text-[#a85a3a]">Loading selected game...</p>
                ) }
              </Card>
            </div>
          ) : (
            <div className="min-w-0">
              <Card className="rounded-[1.9rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_70px_-40px_rgba(96,52,20,0.75)] backdrop-blur">
                <p className="py-12 text-center text-[#8b5a3c]">
                  Select a game type to view leaderboards and game history.
                </p>
              </Card>
            </div>
          ) }
        </div>
      </div>

      <Dialog open={ isStartDialogOpen } onOpenChange={ setIsStartDialogOpen }>
        <DialogContent className="border-[#e8c4a0] bg-[#fffaf5] text-[#5c2e1a]">
          <DialogHeader>
            <DialogTitle>Start New Game</DialogTitle>
            <DialogDescription className="text-[#8b5a3c]">
              Enter a title for the new { selectedGame?.name ?? "game" } session. Today&apos;s date will be appended automatically.
            </DialogDescription>
          </DialogHeader>

          <Input
            autoFocus
            value={ gameTitleInput }
            onChange={ (e) => setGameTitleInput(e.target.value) }
            placeholder="Enter game title"
            className="border-[#e8c4a0] bg-white text-[#5c2e1a]"
            onKeyDown={ (e) => {
              if (e.key === "Enter") {
                handleConfirmStartGame();
              }
            } }
          />
          { gameTitleInput.trim() && (
            <p className="-mt-1 text-xs text-[#8b5a3c]">
              Will be saved as: <span className="text-[#5c2e1a]">{ formatGameTitleWithDate(gameTitleInput.trim()) }</span>
            </p>
          ) }

          <DialogFooter>
            <Button variant="outline" onClick={ () => setIsStartDialogOpen(false) }>
              Cancel
            </Button>
            <Button
              onClick={ handleConfirmStartGame }
              disabled={ isStartingGame }
              className="bg-[linear-gradient(135deg,#b76428,#df8a42)] text-white hover:bg-[linear-gradient(135deg,#9f5721,#c87934)]"
            >
              { isStartingGame ? "Starting..." : "Start Game" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={ isGuestDialogOpen }
        onOpenChange={ (open) => {
          if (!open) {
            setIsGuestDialogOpen(false);
            setGuestFirstName("");
            setGuestLastName("");
            setGuestEmail("");
            setGuestDialogColIndex(null);
          }
        } }
      >
        <DialogContent className="border-[#e8c4a0] bg-[#fffaf5] text-[#5c2e1a]">
          <DialogHeader>
            <DialogTitle>Add a Guest</DialogTitle>
            <DialogDescription className="text-[#8b5a3c]">
              Enter the guest&apos;s information. They will be added as a guest member.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="guest-first-name" className="text-[#734f3a]">First Name</Label>
              <Input
                id="guest-first-name"
                autoFocus
                value={ guestFirstName }
                onChange={ (e) => setGuestFirstName(e.target.value) }
                placeholder="First name"
                className="border-[#e8c4a0] bg-white text-[#5c2e1a]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="guest-last-name" className="text-[#734f3a]">Last Name</Label>
              <Input
                id="guest-last-name"
                value={ guestLastName }
                onChange={ (e) => setGuestLastName(e.target.value) }
                placeholder="Last name"
                className="border-[#e8c4a0] bg-white text-[#5c2e1a]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="guest-email" className="text-[#734f3a]">Email Address</Label>
              <Input
                id="guest-email"
                type="email"
                value={ guestEmail }
                onChange={ (e) => setGuestEmail(e.target.value) }
                placeholder="email@example.com"
                className="border-[#e8c4a0] bg-white text-[#5c2e1a]"
                onKeyDown={ (e) => {
                  if (e.key === "Enter") {
                    handleAddGuest();
                  }
                } }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={ () => {
                setIsGuestDialogOpen(false);
                setGuestFirstName("");
                setGuestLastName("");
                setGuestEmail("");
                setGuestDialogColIndex(null);
              } }
            >
              Cancel
            </Button>
            <Button
              onClick={ handleAddGuest }
              disabled={ isAddingGuest }
              className="bg-[linear-gradient(135deg,#b76428,#df8a42)] text-white hover:bg-[linear-gradient(135deg,#9f5721,#c87934)]"
            >
              { isAddingGuest ? "Adding..." : "Add Guest" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
