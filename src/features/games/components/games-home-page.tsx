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
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
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
}

const NEW_GAME_OPTION_VALUE = "new_game";

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

  const getPlayerOptionLabel = (player: { firstName: string; lastName: string }) =>
    `${ player.firstName } ${ player.lastName }`;

  const gameStatesForSelectedMetadata = useMemo(() => {
    if (!selectedGameId) {
      return [];
    }

    return gamesData.activeGameStates
      .filter((state) => state.gameMetaId === selectedGameId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [gamesData.activeGameStates, selectedGameId]);

  const roundEntries = useMemo(() => {
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

  // Filter game history
  const filteredGameHistory = useMemo(() => {
    return gamesData.gameHistory.filter((game) => {
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
    gameStatusFilter,
    gameDateFilter,
    gameTitle,
  ]);

  // Group game history by date
  const groupedGameHistory = useMemo(() => {
    const groups = new Map<string, GameHistoryRow[]>();
    filteredGameHistory.forEach((game) => {
      const date = game.gameStartDate;
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      const dateGames = groups.get(date)!;
      dateGames.push(game);
      // Sort by score (lowest first)
      dateGames.sort((a, b) => a.gameScore - b.gameScore);
    });
    return groups;
  }, [filteredGameHistory]);

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

  // Get score styling
  const getScoreStyle = (colIndex: number, isHeader: boolean = false) => {
    if (!isHeader) return "";
    const score = cumulativeScores.get(colIndex) ?? 0;
    if (displayedScores.length === 0) return "";

    const lowestScore = Math.min(...displayedScores);
    const highestScore = Math.max(...displayedScores);

    if (score === lowestScore && score === highestScore) return ""; // Only one non-zero
    if (score === lowestScore) return "!bg-emerald-300 !text-emerald-950";
    if (score === highestScore) return "!bg-pink-300 !text-pink-950";
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

    setIsStartingGame(true);
    startTransition(async () => {
      const result = await startGameAction({
        familyId,
        gameMetaId: selectedGame.id,
        gameTitle: trimmedTitle,
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
    const isAllScoresEntered =
      numberedRoundKeys.length > 0 &&
      activeColIndices.length > 0 &&
      numberedRoundKeys.every((roundKey) =>
        activeColIndices.every(
          (colIndex) => roundScores.get(roundKey)?.get(colIndex) !== undefined
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
    setRoundScores(loadedRoundScores);
    setPersistedCumulativeScores(loadedCumulativeScores);
    setHasRoundScoreEdits(false);
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

  const lowestScore = gamesData.leaderboards.lowScore;
  const highestScore = gamesData.leaderboards.highScore;
  const playerStats = gamesData.leaderboards.playerStats;

  return (
    <div className="font-app min-h-screen bg-linear-to-b from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */ }
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-fuchsia-400 via-purple-400 to-cyan-400">
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
      <div className="grid grid-cols-4 gap-6">
        {/* Part A: Game Scoreboard (left, spans 3 cols) */ }
        <div className="col-span-3">
          <Card className="bg-slate-800/50 border-purple-500/30 p-6">
            <h2 className="text-2xl font-bold text-purple-300 mb-6">
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
                } }
              >
                <SelectTrigger className="w-64 bg-slate-700 border-purple-500/50 text-white">
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
                <SelectTrigger className="w-72 bg-slate-700 border-purple-500/50 text-white">
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

              <Button
                onClick={ handleSetNewGameMode }
                disabled={ !selectedGameId }
                variant="outline"
                className="border-emerald-400/60 bg-slate-800 text-emerald-200 hover:bg-slate-700"
              >
                New Game
              </Button>

              <Button
                onClick={ handleStartOrContinueGame }
                disabled={ !selectedGame || isStartingGame || isLoadingSavedGame }
                className="bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                { selectedGameState ? "Continue Game" : isStartingGame ? "Starting..." : "Start New Game" }
              </Button>

              <Button
                onClick={ handleSaveGame }
                disabled={ !selectedGameState || isSavingGame }
                variant="outline"
                className="border-cyan-400/60 bg-slate-800 text-cyan-200 hover:bg-slate-700"
              >
                <Save className="w-4 h-4 mr-2" />
                { isSavingGame ? "Saving..." : "Save Game" }
              </Button>

              { selectedGameState && persistedCumulativeScores && !hasRoundScoreEdits && (
                <span className="inline-flex items-center rounded-full border border-cyan-400/60 bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-200">
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
                <table className="w-full text-sm border-collapse">
                  <thead>
                    {/* Header Row 1: Column Headers with Player Selection */ }
                    <tr>
                      <th className="bg-slate-700 text-purple-300 p-2 border border-slate-600 text-left">
                        Round
                      </th>
                      { selectedPlayers.map((player, idx) => (
                        <th
                          key={ `player-header-${ idx }` }
                          className="bg-slate-700 text-purple-300 p-2 border border-slate-600"
                        >
                          <Select
                            value={ player ? String(player.id) : "" }
                            onValueChange={ (val) => {
                              const selectedMemberId = Number(val);
                              const selectedInOtherColumn = selectedPlayers.some(
                                (existingPlayer, existingIdx) =>
                                  existingIdx !== idx && existingPlayer?.id === selectedMemberId
                              );

                              if (selectedInOtherColumn) {
                                return;
                              }

                              const selectedMember = gamesData.selectablePlayers.find(
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
                              };
                              setSelectedPlayers(newPlayers);
                            } }
                          >
                            <SelectTrigger className="w-full bg-slate-600 border-purple-400/50 text-white text-xs">
                              <SelectValue placeholder={ `P${ idx + 1 }` } />
                            </SelectTrigger>
                            <SelectContent>
                              { gamesData.selectablePlayers.map((member) => {
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
                      )) }
                    </tr>

                    {/* Header Row 2: Cumulative Scores */ }
                    <tr>
                      <th className="bg-slate-700 text-purple-300 p-2 border border-slate-600 text-left">
                        Total
                      </th>
                      { selectedPlayers.map((_, idx) => {
                        const score = cumulativeScores.get(idx) ?? 0;
                        return (
                          <th
                            key={ `score-total-${ idx }` }
                            className={ `bg-slate-700 text-white p-2 border border-slate-600 font-bold ${ getScoreStyle(idx, true) }` }
                          >
                            { score || "-" }
                          </th>
                        );
                      }) }
                    </tr>
                  </thead>

                  {/* Round Scores */ }
                  <tbody>
                    { roundEntries.map((roundEntry) => {
                      const roundNo = roundEntry.roundNo;
                      return (
                        <tr key={ `round-${ roundEntry.label }` }>
                          <td className="bg-slate-750 text-slate-300 p-2 border border-slate-600 text-center font-semibold">
                            { roundEntry.label }
                          </td>
                          { selectedPlayers.map((_, colIdx) => (
                            <td
                              key={ `round-score-${ roundEntry.label }-${ colIdx }` }
                              className="bg-slate-750 p-2 border border-slate-600"
                            >
                              <Input
                                type="number"
                                className="w-full bg-slate-600 border-purple-400/30 text-white text-center"
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
                          )) }
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
        <div className="col-span-1 space-y-6">
          {/* Part B: Leaderboard */ }
          <Card className="bg-slate-800/50 border-purple-500/30 p-6">
            <h2 className="text-xl font-bold text-purple-300 mb-4">
              Leaderboard
            </h2>

            {/* Low Score */ }
            <div className="mb-5 pb-5 border-b border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wide">
                Low Score
              </p>
              { lowestScore ? (
                <>
                  <p className="text-lg font-bold text-green-400 mt-1">
                    { lowestScore.playerFirstName } { lowestScore.playerLastName }
                  </p>
                  <p className="text-sm text-slate-300">
                    { lowestScore.gameScore } points
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    { lowestScore.gameStartDate }
                  </p>
                </>
              ) : (
                <p className="text-slate-500 mt-2">No games yet</p>
              ) }
            </div>

            {/* High Score */ }
            <div className="mb-5 pb-5 border-b border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wide">
                High Score
              </p>
              { highestScore ? (
                <>
                  <p className="text-lg font-bold text-pink-400 mt-1">
                    { highestScore.playerFirstName } { highestScore.playerLastName }
                  </p>
                  <p className="text-sm text-slate-300">
                    { highestScore.gameScore } points
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    { highestScore.gameStartDate }
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
          <Card className="bg-slate-800/50 border-purple-500/30 p-6">
            <h2 className="text-xl font-bold text-purple-300 mb-4">
              Game History
            </h2>

            {/* Filter Controls */ }
            <div className="space-y-2 mb-4">
              <Select value={ gameStatusFilter } onValueChange={ setGameStatusFilter }>
                <SelectTrigger className="w-full bg-slate-700 border-purple-500/50 text-white text-xs">
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
                <SelectTrigger className="w-full bg-slate-700 border-purple-500/50 text-white text-xs">
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
                <SelectTrigger className="w-full bg-slate-700 border-purple-500/50 text-white text-xs">
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
                  ([date, games]) => (
                    <div key={ date } className="mb-4">
                      <p className="text-xs font-semibold text-slate-400 mb-2">
                        { date }
                      </p>
                      <div className="space-y-1">
                        { games.map((game, idx) => {
                          const isLowest = game.isLowest;
                          const isHighest = game.isHighest;
                          const bgColor = isLowest
                            ? "bg-green-900/30"
                            : isHighest
                              ? "bg-pink-900/30"
                              : "bg-slate-700/30";

                          return (
                            <div
                              key={ `${ date }-${ idx }` }
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
                                  { game.gameScore }
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">
                                { game.gameTitle }
                              </p>
                            </div>
                          );
                        }) }
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
              <p className="text-xs text-cyan-300 mt-3">Loading selected game...</p>
            ) }
          </Card>
        </div>
      </div>

      <Dialog open={ isStartDialogOpen } onOpenChange={ setIsStartDialogOpen }>
        <DialogContent className="border-purple-500/40 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>Start New Game</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter a title for the new { selectedGame?.name ?? "game" } session.
            </DialogDescription>
          </DialogHeader>

          <Input
            autoFocus
            value={ gameTitleInput }
            onChange={ (e) => setGameTitleInput(e.target.value) }
            placeholder="Enter game title"
            className="bg-slate-800 border-purple-500/40 text-white"
            onKeyDown={ (e) => {
              if (e.key === "Enter") {
                handleConfirmStartGame();
              }
            } }
          />

          <DialogFooter>
            <Button variant="outline" onClick={ () => setIsStartDialogOpen(false) }>
              Cancel
            </Button>
            <Button
              onClick={ handleConfirmStartGame }
              disabled={ isStartingGame }
              className="bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white"
            >
              { isStartingGame ? "Starting..." : "Start Game" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
