"use client";

import { startTransition, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Play, Save } from "lucide-react";
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
import {
  addGuestMemberAction,
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

  // Computed values
  const selectedGame = useMemo(
    () =>
      selectedGameId
        ? gamesData.availableGames.find((g) => g.id === selectedGameId)
        : null,
    [selectedGameId, gamesData.availableGames]
  );

  const getPlayerOptionLabel = (player: { firstName: string; lastName: string; isGuest?: boolean }) =>
    `${ player.firstName } ${ player.lastName }${ player.isGuest ? " (g)" : "" }`;

  const gameStatesForSelectedMetadata = useMemo(() => {
    if (!selectedGameId) {
      return [];
    }

    return gamesData.activeGameStates
      .filter((state) => state.gameMetaId === selectedGameId)
      .sort((a, b) => a.gameTitle.localeCompare(b.gameTitle));
  }, [gamesData.activeGameStates, selectedGameId]);

  const roundEntries = useMemo(() => {
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
  }, [selectedGame]);

  const visiblePlayerColumnIndices = useMemo(() => {
    const visible = selectedPlayers
      .map((player, idx) => {
        const hasPlayer = Boolean(player);
        const hasRoundValue = roundEntries.some((roundEntry) =>
          roundScores.get(roundEntry.roundKey)?.has(idx)
        );
        return hasPlayer || hasRoundValue ? idx : null;
      })
      .filter((idx): idx is number => idx !== null);

    // Keep one column available so a brand-new game can still select players.
    return visible.length > 0 ? visible : [0];
  }, [roundEntries, roundScores, selectedPlayers]);

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
  }, [roundEntries, roundScores, selectedPlayers]);

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
      if (score === highestScore) return "!bg-green-400/30 !text-green-400";
      if (score === lowestScore) return "!bg-red-400/30 !text-red-400";
      return "";
    }

    if (score === lowestScore) return "!bg-green-400/30 !text-green-400";
    if (score === highestScore) return "!bg-red-400/30 !text-red-400";
    return "";
  };

  const handleSetNewGameMode = () => {
    setSelectedGameTitleOption(NEW_GAME_OPTION_VALUE);
    setSelectedGameState(null);
    setGameTitleInput("");
    setSelectedPlayers(emptySelectedPlayers);
    setRoundScores(new Map());
    setPersistedCumulativeScores(null);
    setHasRoundScoreEdits(false);
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
      setHasRoundScoreEdits(false);
      setIsStartDialogOpen(false);
      toast.success(`Started game \"${ result.gameState.gameTitle }\".`);
    });
  };

  const handleSaveGame = () => {
    if (!selectedGame || !selectedGameState) {
      toast.error("Start a game before saving it.");
      return;
    }

    const activePlayers = selectedPlayers
      .map((player, index) => player ? { ...player, playPosition: index + 1 } : null)
      .filter((player): player is SelectedPlayer & { playPosition: number } => player !== null);

    if (activePlayers.length === 0) {
      toast.error("Select at least one player before saving the game.");
      return;
    }

    const scoreboardRows = roundEntries.map((roundEntry) => ({
      roundNo: roundEntry.roundNo,
      roundLabel: roundEntry.label,
      scores: activePlayers.map((player) => ({
        memberId: player.id,
        playPosition: player.playPosition,
        roundScore: roundScores.get(roundEntry.roundKey)?.get(player.playPosition - 1) ?? 0,
        cumulativeScore: cumulativeScores.get(player.playPosition - 1) ?? 0,
      })),
    }));

    // Determine if all numbered round scores have been entered for all active players.
    const numberedRoundKeys = roundEntries
      .filter((re) => re.roundKey > 0)
      .map((re) => re.roundKey);
    const activeColIndices = activePlayers.map((p) => p.playPosition - 1);
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
    const saveStatus = isAllScoresEntered ? "completed" : selectedGameState.status;

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
    const numValue = value === "" ? 0 : parseInt(value) || 0;
    const roundMap = roundScores.get(roundNo) || new Map();
    roundMap.set(colIndex, numValue);
    setRoundScores(new Map(roundScores).set(roundNo, roundMap));
    setHasRoundScoreEdits(true);
    setPersistedCumulativeScores(null);
    // TODO: Trigger event to save to game_player_round table
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
    <div className="font-app min-h-screen bg-linear-to-b from-slate-900 via-amber-900 to-slate-900 p-6">
      {/* Header */ }
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-amber-300 via-yellow-300 to-orange-300">
          Game Scoreboards
        </h1>
        <div className="px-6 pt-6 pb-0">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#efe8ff] transition hover:bg-white/25"
          >
            Back to Main Page
          </Link>
        </div>
        <p className="text-slate-400 mt-2">
          Welcome back, { firstName }! Here you will find your family game history, leaderboards, and where you can start a new game.
        </p>
      </div>


      {/* Main Layout: Part A (Scoreboard) | Parts B & C (Leaderboard & History) */ }
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,1fr)]">
        {/* Part A: Game Scoreboard (left) */ }
        <div className="min-w-0">
          <Card className="bg-slate-800/50 border-amber-500/30 p-6">
            <h2 className="text-2xl font-bold text-amber-300 mb-6">
              Scoreboard
            </h2>

            {/* Game Selection, Title, and Action Buttons */ }
            <div className="mb-6 flex flex-wrap items-end gap-4">
              <Select
                value={ selectedGameId ? String(selectedGameId) : "" }
                onValueChange={ (val) => {
                  const id = parseInt(val);
                  setSelectedGameId(id);
                  const game = gamesData.availableGames.find((g) => g.id === id);
                  if (game) {
                    setSelectedGameTitleOption(NEW_GAME_OPTION_VALUE);
                    setSelectedGameState(null);
                    setGameTitleInput("");
                  }
                  setSelectedPlayers(emptySelectedPlayers);
                  setRoundScores(new Map());
                  setPersistedCumulativeScores(null);
                  setHasRoundScoreEdits(false);
                  router.refresh();
                } }
              >
                <SelectTrigger className="w-64 bg-slate-700 border-amber-500/50 text-white">
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
                    setPersistedCumulativeScores(null);
                    setHasRoundScoreEdits(false);
                    return;
                  }

                  const stateId = Number(val);
                  void handleLoadPersistedGame(stateId);
                } }
                disabled={ !selectedGameId }
              >
                <SelectTrigger className="w-72 bg-slate-700 border-amber-500/50 text-white">
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
                  className="bg-linear-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  { isStartingGame ? "Starting..." : "Start New Game" }
                </Button>
              ) }

              { selectedGameState?.status === "in_progress" && !isContinueGameHidden && (
                <Button
                  onClick={ handleStartOrContinueGame }
                  disabled={ isLoadingSavedGame }
                  className="bg-linear-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Continue Game
                </Button>
              ) }

              { hasRoundScoreEdits && (
                <Button
                  onClick={ handleSaveGame }
                  disabled={ !selectedGameState || isSavingGame }
                  variant="outline"
                  className="border-amber-400/60 bg-slate-800 text-amber-200 hover:bg-slate-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  { isSavingGame ? "Saving..." : "Save Game" }
                </Button>
              ) }

              { selectedGameState && persistedCumulativeScores && !hasRoundScoreEdits && (
                <span className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200">
                  Loaded from Saved Game
                </span>
              ) }
            </div>

            {/* Scoreboard Table */ }
            { selectedGameState ? (
              <div
                ref={ scoreboardGridRef }
                tabIndex={ -1 }
                className="overflow-x-auto"
              >
                <table className="w-full max-w-245 table-fixed text-sm border-collapse">
                  <thead>
                    {/* Header Row 1: Column Headers with Player Selection */ }
                    <tr>
                      <th className="w-16 bg-slate-700 text-amber-300 p-2 border border-slate-600 text-left">
                        Round
                      </th>
                      { visiblePlayerColumnIndices.map((idx, visibleIdx) => {
                        const player = selectedPlayers[idx];
                        return (
                        <th
                          key={ `player-header-${ idx }` }
                          className="w-32 bg-slate-700 text-amber-300 p-2 border border-slate-600"
                        >
                          <Select
                            value={ player ? String(player.id) : "" }
                            onValueChange={ (val) => {
                              if (val === ADD_GUEST_OPTION_VALUE) {
                                setGuestDialogColIndex(idx);
                                setIsGuestDialogOpen(true);
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
                            <SelectTrigger className="w-full bg-slate-600 border-amber-400/50 text-white text-xs">
                              <SelectValue placeholder={ `P${ visibleIdx + 1 }` } />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ ADD_GUEST_OPTION_VALUE }>
                                + Add a guest
                              </SelectItem>
                              { localSelectablePlayers.map((member) => {
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
                                )
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
                        <th className="w-16 bg-slate-700 text-amber-300 p-2 border border-slate-600 text-left">
                          Total
                        </th>
                        { visiblePlayerColumnIndices.map((idx) => {
                          const score = cumulativeScores.get(idx) ?? 0;
                          return (
                            <th
                              key={ `score-total-${ idx }` }
                              className={ `w-32 bg-slate-700 text-white p-2 border border-slate-600 font-bold ${ getScoreStyle(idx) }` }
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
                          <td className="w-16 bg-slate-750 text-slate-300 p-2 border border-slate-600 text-center font-semibold">
                            { roundEntry.label }
                          </td>
                          { visiblePlayerColumnIndices.map((colIdx) => {
                            const isFinalOnlyRow = selectedGame?.isRoundBased === false && roundEntry.roundNo === 1;
                            return (
                              <td
                                key={ `round-score-${ roundEntry.label }-${ colIdx }` }
                                className={ `w-32 bg-slate-750 p-2 border border-slate-600 ${ isFinalOnlyRow ? getScoreStyle(colIdx) : "" }` }
                              >
                                <Input
                                  type="number"
                                  className="w-full bg-slate-600 border-amber-400/30 text-white text-center"
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
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                Select a game and click "Start Game" to begin scoring
              </div>
            ) }
          </Card>
        </div>

        {/* Parts B & C: Leaderboard and History (right side) */ }
        { selectedGameId ? (
          <div className="min-w-0 space-y-6">
            {/* Part B: Leaderboard */ }
            <Card className="bg-slate-800/50 border-amber-500/30 p-6">
              <h2 className="text-xl font-bold text-amber-300 mb-4">
                Leaderboard
              </h2>

              {/* High Score */ }
              <div className="mb-5 pb-5 border-b border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  High Score
                </p>
                { highestScore ? (
                  <>
                    <p className={ `text-lg font-bold mt-1 ${ isHighWins ? "text-green-400" : "text-red-400" }` }>
                      { highestScore.playerFirstName } { highestScore.playerLastName }
                    </p>
                    <p className="text-sm text-slate-300">
                      { formatScore(highestScore.gameScore) }
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      { highestScore.gameStartDate }
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500 mt-2">No games yet</p>
                ) }
              </div>

              {/* Low Score */ }
              <div className="mb-5 pb-5 border-b border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  Low Score
                </p>
                { lowestScore ? (
                  <>
                    <p className={ `text-lg font-bold mt-1 ${ isHighWins ? "text-red-400" : "text-green-400" }` }>
                      { lowestScore.playerFirstName } { lowestScore.playerLastName }
                    </p>
                    <p className="text-sm text-slate-300">
                      { formatScore(lowestScore.gameScore) }
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      { lowestScore.gameStartDate }
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500 mt-2">No games yet</p>
                ) }
              </div>

              {/* Player Stats */ }
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
                  Player Stats
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  { playerStats.length > 0 ? (
                    playerStats.map((stat, idx) => (
                      <div
                        key={ idx }
                        className="text-xs bg-slate-700/50 p-2 rounded"
                      >
                        <p className="font-semibold text-slate-200">
                          { stat.playerFirstName } { stat.playerLastName }
                        </p>
                        <p className="text-slate-400">
                          Played: { stat.gamesPlayed } | Won: { stat.gamesWon } | Lost:{ " " }
                          { stat.gamesLost }
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">No player stats yet</p>
                  ) }
                </div>
              </div>
            </Card>

            {/* Part C: Game History with Filters */ }
            <Card className="bg-slate-800/50 border-amber-500/30 p-6">
              <h2 className="text-xl font-bold text-amber-300 mb-4">
                Game History
              </h2>

              {/* Filter Controls */ }
              <div className="space-y-2 mb-4">
                <Select value={ gameStatusFilter } onValueChange={ setGameStatusFilter }>
                  <SelectTrigger className="w-full bg-slate-700 border-amber-500/50 text-white text-xs">
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
                  <SelectTrigger className="w-full bg-slate-700 border-amber-500/50 text-white text-xs">
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
                  <SelectTrigger className="w-full bg-slate-700 border-amber-500/50 text-white text-xs">
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
                        <p className="text-xs font-semibold text-slate-400 mb-2">
                          { date }
                        </p>
                        <div className="space-y-1">
                          { Array.from(gamesByIdMap.entries()).map(([gameId, playersInGame]) => (
                            <div key={ `game-${ gameId }` } className="mb-2">
                              <div className="text-xs text-slate-500 px-2 py-1 bg-slate-800/50 rounded">
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
                                        ? "bg-red-900/30"
                                        : "bg-slate-700/30")
                                    : (isLowest
                                      ? "bg-emerald-400/30"
                                      : isHighest
                                        ? "bg-red-900/30"
                                        : "bg-slate-700/30");

                                  return (
                                    <div
                                      key={ `${ gameId }-player-${ playerIdx }` }
                                      className={ `p-2 rounded cursor-pointer hover:bg-slate-600/50 transition ${ bgColor }` }
                                      onClick={ () => {
                                        void handleLoadPersistedGame(game.gameId);
                                      } }
                                    >
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-200">
                                          { game.playerFirstName } { game.playerLastName }
                                        </span>
                                        <span className="font-bold text-slate-300">
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
                  <div className="text-center py-8 text-slate-500">
                    No games matching filters
                  </div>
                ) }
              </div>
              { isLoadingSavedGame && (
                <p className="text-xs text-amber-300 mt-3">Loading selected game...</p>
              ) }
            </Card>
          </div>
        ) : (
          <div className="min-w-0">
            <Card className="bg-slate-800/50 border-amber-500/30 p-6">
              <p className="text-center text-slate-400 py-12">
                Select a game type to view leaderboards and game history.
              </p>
            </Card>
          </div>
        ) }
      </div>

      <Dialog open={ isStartDialogOpen } onOpenChange={ setIsStartDialogOpen }>
        <DialogContent className="border-amber-500/40 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>Start New Game</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter a title for the new { selectedGame?.name ?? "game" } session. Today&apos;s date will be appended automatically.
            </DialogDescription>
          </DialogHeader>

          <Input
            autoFocus
            value={ gameTitleInput }
            onChange={ (e) => setGameTitleInput(e.target.value) }
            placeholder="Enter game title"
            className="bg-slate-800 border-amber-500/40 text-white"
            onKeyDown={ (e) => {
              if (e.key === "Enter") {
                handleConfirmStartGame();
              }
            } }
          />
          { gameTitleInput.trim() && (
            <p className="text-xs text-slate-400 -mt-1">
              Will be saved as: <span className="text-slate-200">{ formatGameTitleWithDate(gameTitleInput.trim()) }</span>
            </p>
          ) }

          <DialogFooter>
            <Button variant="outline" onClick={ () => setIsStartDialogOpen(false) }>
              Cancel
            </Button>
            <Button
              onClick={ handleConfirmStartGame }
              disabled={ isStartingGame }
              className="bg-linear-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white"
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
        <DialogContent className="border-amber-500/40 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>Add a Guest</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter the guest&apos;s information. They will be added as a guest member.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="guest-first-name" className="text-slate-300">First Name</Label>
              <Input
                id="guest-first-name"
                autoFocus
                value={ guestFirstName }
                onChange={ (e) => setGuestFirstName(e.target.value) }
                placeholder="First name"
                className="bg-slate-800 border-amber-500/40 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="guest-last-name" className="text-slate-300">Last Name</Label>
              <Input
                id="guest-last-name"
                value={ guestLastName }
                onChange={ (e) => setGuestLastName(e.target.value) }
                placeholder="Last name"
                className="bg-slate-800 border-amber-500/40 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="guest-email" className="text-slate-300">Email Address</Label>
              <Input
                id="guest-email"
                type="email"
                value={ guestEmail }
                onChange={ (e) => setGuestEmail(e.target.value) }
                placeholder="email@example.com"
                className="bg-slate-800 border-amber-500/40 text-white"
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
              className="bg-linear-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white"
            >
              { isAddingGuest ? "Adding..." : "Add Guest" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
