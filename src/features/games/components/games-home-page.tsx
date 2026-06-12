"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
import type { GamesPageData } from "@/components/db/types/game-scoreboard";
import Link from "next/link";
import { useGameBoardSession } from "@/features/games/hooks/use-game-board-session";
import { useCricketScoreboard } from "@/features/games/hooks/use-cricket-scoreboard";
import { useCrokinoleScoreboard } from "@/features/games/hooks/use-crokinole-scoreboard";
import { useGameLifecycleActions } from "@/features/games/hooks/use-game-lifecycle-actions";
import { useGameHistoryInsights } from "@/features/games/hooks/use-game-history-insights";
import type { SelectedPlayer } from "@/features/games/types/scoreboard-ui";
import { GamesScoreboardToolbar } from "@/features/games/components/games-scoreboard-toolbar";
import { GamesCricketPanel } from "@/features/games/components/games-cricket-panel";
import { GamesCrokinoleSetup } from "@/features/games/components/games-crokinole-setup";
import { HideNoPlayerColumnsToggle } from "@/features/games/components/hide-no-player-columns-toggle";
import {
  formatGameScore,
  getDisplayedScores,
  getScoreStyleClass,
  updateRoundScoresMap,
} from "@/features/games/utils/scoreboard-ui-helpers";

interface GamesHomePageProps {
  gamesData: GamesPageData;
  familyId: number;
  memberId: number;
  firstName: string;
}

const NEW_GAME_OPTION_VALUE = "new_game";
const ADD_GUEST_OPTION_VALUE = "add_guest";
const CLEAR_PLAYER_OPTION_VALUE = "clear_player";
const CROKINOLE_DEFAULT_WIN_SCORE = 100;

export function GamesHomePage({
  gamesData,
  familyId,
  memberId,
  firstName,
}: GamesHomePageProps) {
  const scoreboardGridRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [hideNoPlayerColumns, setHideNoPlayerColumns] = useState(false);

  const {
    emptySelectedPlayers,
    selectedGameId,
    setSelectedGameId,
    selectedGameState,
    setSelectedGameState,
    selectedPlayers,
    setSelectedPlayers,
    roundScores,
    setRoundScores,
    persistedCumulativeScores,
    setPersistedCumulativeScores,
    hasRoundScoreEdits,
    setHasRoundScoreEdits,
    localSelectablePlayers,
    setLocalSelectablePlayers,
    selectedGameTitleOption,
    setSelectedGameTitleOption,
    requestedVisiblePlayerColumns,
    setRequestedVisiblePlayerColumns,
    selectedGame,
    isCricketGame,
    isCrokinoleGame,
    isMexicanTrainGame,
    isAcquireGame,
    orderedSelectablePlayers,
    gameStatesForSelectedMetadata,
    roundEntries,
    visiblePlayerColumnIndices,
    getPlayerOptionLabel,
    addPlayerColumn: handleAddPlayerColumn,
    clearPlayerColumn: handleClearPlayerColumn,
    resetSharedBoardState,
  } = useGameBoardSession({
    gamesData,
    newGameOptionValue: NEW_GAME_OPTION_VALUE,
  });

  const handleOpenGuestDialog = (slotIndex: number) => {
    lifecycle.openGuestDialog(slotIndex);
  };

  const cricket = useCricketScoreboard({
    enabled: isCricketGame,
    selectedPlayers,
    setSelectedPlayers,
    selectablePlayers: localSelectablePlayers,
    addGuestOptionValue: ADD_GUEST_OPTION_VALUE,
    clearPlayerOptionValue: CLEAR_PLAYER_OPTION_VALUE,
    onOpenGuestDialog: handleOpenGuestDialog,
    onClearPlayerColumn: handleClearPlayerColumn,
    onBoardEdited: () => setHasRoundScoreEdits(true),
    onPersistedScoresCleared: () => setPersistedCumulativeScores(null),
  });
  const cricketTurnLedger = cricket.cricketTurnLedger;
  const cricketTurnDarts = cricket.cricketTurnDarts;
  const isSubmittingCricketTurn = cricket.isSubmittingCricketTurn;
  const cricketFormat = cricket.cricketFormat;
  const cricketBoardState = cricket.cricketBoardState;
  const cricketWinnerSideIndex = cricket.cricketWinnerSideIndex;
  const cricketActiveSideIndex = cricket.cricketActiveSideIndex;

  const computedCumulativeScores = useMemo(() => {
    if (isCricketGame) {
      const scores = new Map<number, number>();
      scores.set(0, cricketBoardState.scores[0]);
      scores.set(1, cricketBoardState.scores[1]);

      return scores;
    }

    if (isCrokinoleGame) {
      const scores = new Map<number, number>([[0, 0], [1, 0]]);
      for (const roundEntry of roundEntries) {
        const roundMap = roundScores.get(roundEntry.roundKey);
        const hasTeamOneScore = roundMap?.has(0) ?? false;
        const hasTeamTwoScore = roundMap?.has(1) ?? false;

        if (!hasTeamOneScore || !hasTeamTwoScore) {
          continue;
        }

        scores.set(0, (scores.get(0) ?? 0) + (roundMap?.get(0) ?? 0));
        scores.set(1, (scores.get(1) ?? 0) + (roundMap?.get(1) ?? 0));
      }

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
  }, [cricketBoardState.scores, isCricketGame, isCrokinoleGame, roundEntries, roundScores, selectedPlayers]);

  const crokinole = useCrokinoleScoreboard({
    enabled: isCrokinoleGame,
    selectedPlayers,
    setSelectedPlayers,
    roundEntries,
    roundScores,
    cumulativeScores: persistedCumulativeScores && !hasRoundScoreEdits ? persistedCumulativeScores : computedCumulativeScores,
    winScore: selectedGame?.winningScore && selectedGame.winningScore > 0
      ? selectedGame.winningScore
      : CROKINOLE_DEFAULT_WIN_SCORE,
    addGuestOptionValue: ADD_GUEST_OPTION_VALUE,
    clearPlayerOptionValue: CLEAR_PLAYER_OPTION_VALUE,
    selectablePlayers: localSelectablePlayers,
    onOpenGuestDialog: handleOpenGuestDialog,
    onClearPlayerColumn: handleClearPlayerColumn,
  });

  const cumulativeScores = useMemo(() => {
    if (persistedCumulativeScores && !hasRoundScoreEdits) {
      return persistedCumulativeScores;
    }

    return computedCumulativeScores;
  }, [computedCumulativeScores, hasRoundScoreEdits, persistedCumulativeScores]);

  const displayedScores = useMemo(
    () => getDisplayedScores(selectedPlayers, cumulativeScores),
    [cumulativeScores, selectedPlayers]
  );

  const renderedPlayerColumnIndices = useMemo(() => {
    if (!hideNoPlayerColumns) {
      return visiblePlayerColumnIndices;
    }

    return visiblePlayerColumnIndices.filter((colIndex) => Boolean(selectedPlayers[colIndex]));
  }, [hideNoPlayerColumns, isMexicanTrainGame, selectedPlayers, visiblePlayerColumnIndices]);

  const scoreStyleByColumn = useMemo(() => {
    const styleMap = new Map<number, string>();

    selectedPlayers.forEach((player, colIndex) => {
      if (!player) {
        return;
      }

      styleMap.set(
        colIndex,
        getScoreStyleClass({
          colIndex,
          cumulativeScores,
          displayedScores,
          winnerDirection: selectedGame?.highOrLo,
        })
      );
    });

    return styleMap;
  }, [cumulativeScores, displayedScores, selectedGame?.highOrLo, selectedPlayers]);

  const crokinoleFormat = crokinole.crokinoleFormat;
  const crokinoleTeamNames = crokinole.crokinoleTeamNames;
  const crokinoleWinnerTeamIndex = crokinole.crokinoleWinnerTeamIndex;
  const crokinoleFinalRoundNo = crokinole.crokinoleFinalRoundNo;
  const displayedRoundEntries = crokinole.displayedRoundEntries;
  const isCrokinoleScoringEnabled = crokinole.isCrokinoleScoringEnabled;
  const crokinoleWinScore = selectedGame?.winningScore && selectedGame.winningScore > 0
    ? selectedGame.winningScore
    : CROKINOLE_DEFAULT_WIN_SCORE;

  const lifecycle = useGameLifecycleActions({
    familyId,
    memberId,
    router,
    scoreboardGridRef,
    newGameOptionValue: NEW_GAME_OPTION_VALUE,
    crokinoleWinScore,
    selectedGame,
    selectedGameState,
    selectedPlayers,
    roundScores,
    roundEntries,
    cumulativeScores,
    hasRoundScoreEdits,
    isCricketGame,
    isCrokinoleGame,
    cricketFormat,
    selectedGameTitleOption,
    crokinoleFormat,
    crokinoleTeamNames,
    crokinoleWinnerTeamIndex: crokinoleWinnerTeamIndex as 0 | 1 | null,
    crokinoleFinalRoundNo,
    cricketTurnLedger,
    cricketWinnerSideIndex,
    setSelectedGameId,
    setSelectedGameState,
    setSelectedGameTitleOption,
    setSelectedPlayers,
    setRoundScores,
    setPersistedCumulativeScores,
    setHasRoundScoreEdits,
    setRequestedVisiblePlayerColumns,
    setLocalSelectablePlayers,
    resetSharedBoardState,
    resetCricketState: cricket.resetCricketState,
    setCricketTurnLedger: cricket.setCricketTurnLedger,
    setCricketTurnDarts: cricket.setCricketTurnDarts,
    loadCricketFromRounds: cricket.loadCricketFromRounds,
    setCricketFormat: cricket.setCricketFormat,
    inferCricketFormatFromPlayers: cricket.inferCricketFormatFromPlayers,
    resetCrokinoleState: crokinole.resetCrokinoleState,
    setCrokinoleFormat: crokinole.setCrokinoleFormat,
    inferCrokinoleFormatFromPlayers: crokinole.inferFormatFromPlayers,
  });

  const gameTitleInput = lifecycle.gameTitleInput;
  const setGameTitleInput = lifecycle.setGameTitleInput;
  const isStartDialogOpen = lifecycle.isStartDialogOpen;
  const setIsStartDialogOpen = lifecycle.setIsStartDialogOpen;
  const isStartingGame = lifecycle.isStartingGame;
  const isSavingGame = lifecycle.isSavingGame;
  const isLoadingSavedGame = lifecycle.isLoadingSavedGame;
  const isArchivingGame = lifecycle.isArchivingGame;
  const isDeletingGame = lifecycle.isDeletingGame;
  const isGuestDialogOpen = lifecycle.isGuestDialogOpen;
  const guestFirstName = lifecycle.guestFirstName;
  const setGuestFirstName = lifecycle.setGuestFirstName;
  const guestLastName = lifecycle.guestLastName;
  const setGuestLastName = lifecycle.setGuestLastName;
  const guestEmail = lifecycle.guestEmail;
  const setGuestEmail = lifecycle.setGuestEmail;
  const isAddingGuest = lifecycle.isAddingGuest;
  const isContinueGameHidden = lifecycle.isContinueGameHidden;
  const setIsContinueGameHidden = lifecycle.setIsContinueGameHidden;

  const formatGameTitleWithDate = lifecycle.formatGameTitleWithDate;

  const handleRoundScoreChange = (
    roundKey: number,
    colIndex: number,
    value: string
  ) => {
    if (isCrokinoleGame && !isCrokinoleScoringEnabled) {
      return;
    }

    setRoundScores(updateRoundScoresMap({
      roundScores,
      roundKey,
      colIndex,
      value,
      isCricketGame,
    }));
    setHasRoundScoreEdits(true);
    setPersistedCumulativeScores(null);
    // TODO: Trigger event to save to game_player_round table
  };

  const handleLoadPersistedGame = lifecycle.loadPersistedGame;

  const handleSelectedGameChange = (value: string) => {
    const id = Number.parseInt(value, 10);
    setSelectedGameId(id);
    const game = gamesData.availableGames.find((entry) => entry.id === id);
    const selectedMaxPlayers = Math.min(Math.max(game?.maxPlayers ?? 1, 1), 8);

    if (game) {
      setSelectedGameTitleOption(NEW_GAME_OPTION_VALUE);
      setSelectedGameState(null);
      setGameTitleInput("");
    }

    setSelectedPlayers(emptySelectedPlayers);
    setRoundScores(new Map());
    cricket.resetCricketState();
    crokinole.resetCrokinoleState();
    setPersistedCumulativeScores(null);
    setHasRoundScoreEdits(false);
    setIsContinueGameHidden(false);
    setRequestedVisiblePlayerColumns(selectedMaxPlayers);
    router.refresh();
  };

  const handleSelectedGameTitleChange = (value: string) => {
    setSelectedGameTitleOption(value);

    if (value === NEW_GAME_OPTION_VALUE) {
      setSelectedGameState(null);
      setGameTitleInput("");
      setSelectedPlayers(emptySelectedPlayers);
      setRoundScores(new Map());
      cricket.resetCricketState();
      crokinole.resetCrokinoleState();
      setPersistedCumulativeScores(null);
      setHasRoundScoreEdits(false);
      setRequestedVisiblePlayerColumns(Math.min(Math.max(selectedGame?.maxPlayers ?? 1, 1), 8));
      return;
    }

    const stateId = Number(value);
    void handleLoadPersistedGame(stateId);
  };

  const handleResetGameBoard = () => {
    if (!selectedGameState) {
      return;
    }

    setRoundScores(new Map());
    cricket.resetCricketState();
    if (isCrokinoleGame) {
      setSelectedPlayers(emptySelectedPlayers);
      crokinole.resetCrokinoleState();
    }
    setPersistedCumulativeScores(null);
    setHasRoundScoreEdits(true);
    toast.success("Game board reset. Save to persist changes.");
  };

  const handleAddGuest = lifecycle.addGuest;
  const handleArchiveSelectedGame = lifecycle.archiveSelectedGame;
  const handleDeleteSelectedGame = lifecycle.deleteSelectedGame;

  const {
    gameStatusFilter,
    setGameStatusFilter,
    gameDateFilter,
    setGameDateFilter,
    gameTitleFilter,
    setGameTitleFilter,
    groupedGameHistory,
    uniqueStatuses,
    uniqueDates,
    uniqueTitles,
    gameLeaderboards,
  } = useGameHistoryInsights({
    gamesData,
    selectedGameId,
    winnerDirection: selectedGame?.highOrLo,
    includeZeroScores: isMexicanTrainGame,
  });

  const isHighWins = selectedGame?.highOrLo === "high";
  const scoreUom = selectedGame?.scoreUom || "points";
  const formatScore = (value: number) => formatGameScore(value, scoreUom);
  const lowestScore = gameLeaderboards.lowScore;
  const highestScore = gameLeaderboards.highScore;
  const playerStats = gameLeaderboards.playerStats;

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(70,36,8,0.95),rgba(124,63,16,0.86)_56%,rgba(181,115,44,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(70,36,8,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-1">
            <div className="max-w-3xl">
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
              <div className="flex flex-col gap-1">
                <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                  Review Leaderboard or start a new scorecard.
                </h1>
                {/* <p className="mt-3 max-w-2xl text-sm leading-7 text-[#ffe0bc] sm:text-base">
                  Welcome back { firstName }! Start or continue a game. Remember, you can add guests to a game.
                </p> */}
              </div>
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

              <GamesScoreboardToolbar
                availableGames={ gamesData.availableGames }
                selectedGameId={ selectedGameId }
                onSelectedGameChange={ handleSelectedGameChange }
                selectedGameTitleOption={ selectedGameTitleOption }
                onSelectedGameTitleChange={ handleSelectedGameTitleChange }
                newGameOptionValue={ NEW_GAME_OPTION_VALUE }
                gameStatesForSelectedMetadata={ gameStatesForSelectedMetadata }
                hasSelectedGame={ Boolean(selectedGame) }
                selectedGameState={ selectedGameState }
                isStartingGame={ isStartingGame }
                isLoadingSavedGame={ isLoadingSavedGame }
                isContinueGameHidden={ isContinueGameHidden }
                isCricketGame={ isCricketGame }
                isAcquireGame={ isAcquireGame }
                requestedVisiblePlayerColumns={ requestedVisiblePlayerColumns }
                isArchivingGame={ isArchivingGame }
                hasRoundScoreEdits={ hasRoundScoreEdits }
                isSavingGame={ isSavingGame }
                isDeletingGame={ isDeletingGame }
                hasLoadedSavedGame={ Boolean(selectedGameState && persistedCumulativeScores && !hasRoundScoreEdits) }
                onStartOrContinueGame={ lifecycle.startOrContinueGame }
                onAddPlayerColumn={ handleAddPlayerColumn }
                onArchiveSelectedGame={ handleArchiveSelectedGame }
                onSaveGame={ lifecycle.saveGame }
                onResetGameBoard={ handleResetGameBoard }
                onDeleteSelectedGame={ handleDeleteSelectedGame }
              />

              {/* Scoreboard Table */ }
              { selectedGameState ? (
                <>
                  { !isCricketGame ? (
                    <HideNoPlayerColumnsToggle
                      checked={ hideNoPlayerColumns }
                      onCheckedChange={ setHideNoPlayerColumns }
                    />
                  ) : null }

                  <div
                    ref={ scoreboardGridRef }
                    tabIndex={ -1 }
                    className="overflow-x-auto rounded-[1.35rem] border border-[#f0d9c4]"
                  >
                  { isCricketGame ? (
                    <GamesCricketPanel
                      selectedPlayers={ selectedPlayers }
                      cricketFormat={ cricketFormat }
                      orderedSelectablePlayers={ orderedSelectablePlayers }
                      getPlayerOptionLabel={ getPlayerOptionLabel }
                      clearPlayerOptionValue={ CLEAR_PLAYER_OPTION_VALUE }
                      addGuestOptionValue={ ADD_GUEST_OPTION_VALUE }
                      cricketTurnDarts={ cricketTurnDarts }
                      cricketTurnLedger={ cricketTurnLedger }
                      cricketBoardState={ cricketBoardState }
                      cricketWinnerSideIndex={ cricketWinnerSideIndex }
                      cricketActiveSideIndex={ cricketActiveSideIndex }
                      isSubmittingCricketTurn={ isSubmittingCricketTurn }
                      scoreStyleByColumn={ scoreStyleByColumn }
                      onSetCricketFormat={ cricket.setCricketFormat }
                      onSetCricketPlayerSlot={ cricket.setCricketPlayerSlot }
                      onSetCricketTurnDart={ cricket.setCricketTurnDart }
                      onSubmitCricketTurn={ cricket.submitCricketTurn }
                      onResetBoard={ handleResetGameBoard }
                    />
                  ) : (
                    <>
                      <GamesCrokinoleSetup
                        isVisible={ isCrokinoleGame }
                        crokinoleFormat={ crokinoleFormat }
                        crokinoleTeamNames={ crokinoleTeamNames }
                        crokinoleWinnerTeamIndex={ crokinoleWinnerTeamIndex as 0 | 1 | null }
                        crokinoleWinScore={ crokinoleWinScore }
                        selectedPlayers={ selectedPlayers }
                        orderedSelectablePlayers={ orderedSelectablePlayers }
                        clearPlayerOptionValue={ CLEAR_PLAYER_OPTION_VALUE }
                        addGuestOptionValue={ ADD_GUEST_OPTION_VALUE }
                        getPlayerOptionLabel={ getPlayerOptionLabel }
                        onSetFormat={ crokinole.setCrokinoleFormat }
                        onSetTeamName={ crokinole.setCrokinoleTeamName }
                        onSetPlayerSlot={ crokinole.setCrokinolePlayerSlot }
                      />

                      <table className="w-full max-w-245 table-fixed text-sm border-collapse">
                        <thead>
                          {/* Header Row 1: Column Headers with Player Selection */ }
                          <tr>
                            <th className="w-16 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-left text-[#a85a3a]">
                              Round
                            </th>
                            { renderedPlayerColumnIndices.map((idx, visibleIdx) => {
                              const player = selectedPlayers[idx];
                              const crokinoleTeamLabel = idx === 0 ? crokinoleTeamNames[0] : crokinoleTeamNames[1];
                              const crokinoleTeamMembers = idx === 0
                                ? [selectedPlayers[0], selectedPlayers[2]].filter((entry): entry is SelectedPlayer => entry !== null)
                                : [selectedPlayers[1], selectedPlayers[3]].filter((entry): entry is SelectedPlayer => entry !== null);

                              if (isCrokinoleGame) {
                                return (
                                  <th
                                    key={ `player-header-${ idx }` }
                                    className="w-32 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-[#a85a3a]"
                                  >
                                    <div className="text-left">
                                      <p className="text-xs font-bold text-[#7b3306]">{ crokinoleTeamLabel || `Team ${ visibleIdx + 1 }` }</p>
                                      <p className="mt-1 text-[11px] font-medium text-[#8b5a3c]">
                                        { crokinoleTeamMembers.length > 0
                                          ? crokinoleTeamMembers.map((member) => `${ member.firstName } ${ member.lastName }`).join(" + ")
                                          : "No players selected" }
                                      </p>
                                    </div>
                                  </th>
                                );
                              }

                              return (
                                <th
                                  key={ `player-header-${ idx }` }
                                  className="w-32 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-[#a85a3a]"
                                >
                                  <Select
                                    value={ player ? String(player.id) : "" }
                                    onValueChange={ (val) => {
                                      if (val === ADD_GUEST_OPTION_VALUE) {
                                        lifecycle.openGuestDialog(idx);
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
                              { renderedPlayerColumnIndices.map((idx) => {
                                const score = cumulativeScores.get(idx) ?? 0;
                                return (
                                  <th
                                    key={ `score-total-${ idx }` }
                                    className={ `w-32 border border-[#f0d9c4] bg-[#fff6ef] p-2 font-bold text-[#5c2e1a] ${ scoreStyleByColumn.get(idx) ?? "" }` }
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
                          { displayedRoundEntries.map((roundEntry) => {
                            return (
                              <tr key={ `round-${ roundEntry.label }` }>
                                <td className="w-16 border border-[#f0d9c4] bg-[#fff8f2] p-2 text-center font-semibold text-[#8b5a3c]">
                                  { roundEntry.label }
                                </td>
                                { renderedPlayerColumnIndices.map((colIdx) => {
                                  const isFinalOnlyRow = selectedGame?.isRoundBased === false && roundEntry.roundNo === 1;
                                  const hasAssignedPlayer = Boolean(selectedPlayers[colIdx]);
                                  return (
                                    <td
                                      key={ `round-score-${ roundEntry.label }-${ colIdx }` }
                                      className={ `w-32 border border-[#f0d9c4] bg-white p-2 ${ isFinalOnlyRow ? scoreStyleByColumn.get(colIdx) ?? "" : "" } ${ crokinole.getRoundWinnerStyle(roundEntry.roundKey, colIdx) }` }
                                    >
                                      <Input
                                        type="number"
                                        className="w-full border-[#e8c4a0] bg-[#fffaf5] text-center text-[#5c2e1a]"
                                        placeholder={ hasAssignedPlayer ? "0" : "" }
                                        disabled={ !hasAssignedPlayer || (isCrokinoleGame && !isCrokinoleScoringEnabled) }
                                        value={
                                          hasAssignedPlayer
                                            ? (roundScores.get(roundEntry.roundKey)?.get(colIdx) ?? "")
                                            : ""
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
                    </>
                  ) }
                  </div>
                </>
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

                  <Select value={ gameTitleFilter } onValueChange={ setGameTitleFilter }>
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
                                <div className="flex items-center justify-between rounded bg-[#fff8f2] px-2 py-1 text-xs text-[#8b5a3c]">
                                  <span>{ playersInGame[0]?.gameTitle }</span>
                                  <span
                                    className={ `inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] ${
                                      playersInGame[0]?.gameStatus === "completed"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : playersInGame[0]?.gameStatus === "in_progress"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-slate-100 text-slate-700"
                                    }` }
                                  >
                                    { playersInGame[0]?.gameStatus?.replace("_", " ") }
                                  </span>
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
                lifecycle.confirmStartGame();
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
              onClick={ lifecycle.confirmStartGame }
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
            lifecycle.closeGuestDialog();
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
              onClick={ lifecycle.closeGuestDialog }
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
