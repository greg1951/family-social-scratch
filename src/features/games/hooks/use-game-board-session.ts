import { useMemo, useState } from "react";

import type { GamesPageData, GameState } from "@/components/db/types/game-scoreboard";
import type { RoundEntry, SelectedPlayer } from "@/features/games/types/scoreboard-ui";

type UseGameBoardSessionArgs = {
  gamesData: GamesPageData;
  newGameOptionValue: string;
};

export function useGameBoardSession({
  gamesData,
  newGameOptionValue,
}: UseGameBoardSessionArgs) {
  const emptySelectedPlayers = useMemo(
    () => Array(8).fill(null) as (SelectedPlayer | null)[],
    []
  );

  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [selectedGameState, setSelectedGameState] = useState<GameState | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<(SelectedPlayer | null)[]>(
    emptySelectedPlayers
  );
  const [roundScores, setRoundScores] = useState<Map<number, Map<number, number>>>(new Map());
  const [persistedCumulativeScores, setPersistedCumulativeScores] = useState<Map<number, number> | null>(null);
  const [hasRoundScoreEdits, setHasRoundScoreEdits] = useState(false);
  const [localSelectablePlayers, setLocalSelectablePlayers] = useState(gamesData.selectablePlayers);
  const [selectedGameTitleOption, setSelectedGameTitleOption] = useState<string>(newGameOptionValue);
  const [requestedVisiblePlayerColumns, setRequestedVisiblePlayerColumns] = useState(1);

  const selectedGame = useMemo(
    () => selectedGameId
      ? gamesData.availableGames.find((game) => game.id === selectedGameId) ?? null
      : null,
    [gamesData.availableGames, selectedGameId]
  );

  const isCricketGame = selectedGame?.name.trim().toLowerCase() === "cricket";
  const isCrokinoleGame = selectedGame?.name.trim().toLowerCase() === "crokinole";
  const isAcquireGame = selectedGame?.name.trim().toLowerCase() === "acquire";
  const isMexicanTrainGame = selectedGame?.name.trim().toLowerCase() === "mexican train";

  const orderedSelectablePlayers = useMemo(() => {
    return [...localSelectablePlayers].sort((left, right) => {
      if (left.isGuest !== right.isGuest) {
        return left.isGuest ? 1 : -1;
      }

      const firstCmp = left.firstName.localeCompare(right.firstName);
      if (firstCmp !== 0) {
        return firstCmp;
      }

      return left.lastName.localeCompare(right.lastName);
    });
  }, [localSelectablePlayers]);

  const gameStatesForSelectedMetadata = useMemo(() => {
    if (!selectedGameId) {
      return [];
    }

    return gamesData.activeGameStates
      .filter((state) => state.status !== "archived")
      .filter((state) => state.gameMetaId === selectedGameId)
      .sort((left, right) => left.gameTitle.localeCompare(right.gameTitle));
  }, [gamesData.activeGameStates, selectedGameId]);

  const roundEntries = useMemo<RoundEntry[]>(() => {
    if (isCricketGame) {
      return [
        { roundKey: 20, roundNo: 20, label: "20" },
        { roundKey: 19, roundNo: 19, label: "19" },
        { roundKey: 18, roundNo: 18, label: "18" },
        { roundKey: 17, roundNo: 17, label: "17" },
        { roundKey: 16, roundNo: 16, label: "16" },
        { roundKey: 15, roundNo: 15, label: "15" },
        { roundKey: 25, roundNo: 25, label: "B" },
      ];
    }

    if (isCrokinoleGame) {
      const maxRounds = Math.max(1, selectedGame?.maxRounds || 20);
      return Array.from({ length: maxRounds }, (_, index) => ({
        roundKey: index + 1,
        roundNo: index + 1,
        label: String(index + 1),
      }));
    }

    const scoreUomLabel = selectedGame?.scoreUom
      ? `${ selectedGame.scoreUom.charAt(0).toUpperCase() }${ selectedGame.scoreUom.slice(1) }`
      : "Score";

    if (selectedGame && !selectedGame.isRoundBased) {
      return [{
        roundKey: 1,
        roundNo: 1,
        label: `Final ${ scoreUomLabel }`,
      }];
    }

    const maxRounds = selectedGame?.maxRounds || 12;
    const numberedRounds = Array.from({ length: maxRounds }, (_, index) => maxRounds - index);

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
  }, [isCricketGame, isCrokinoleGame, selectedGame]);

  const visiblePlayerColumnIndices = useMemo(() => {
    if (isCricketGame || isCrokinoleGame) {
      return [0, 1];
    }

    if (isMexicanTrainGame) {
      return Array.from({ length: 8 }, (_, index) => index);
    }

    const visible = selectedPlayers
      .map((player, index) => {
        const hasPlayer = Boolean(player);
        const hasRoundValue = roundEntries.some((roundEntry) =>
          roundScores.get(roundEntry.roundKey)?.has(index)
        );

        return hasPlayer || hasRoundValue ? index : null;
      })
      .filter((index): index is number => index !== null);

    const highestForcedIndex = Math.min(requestedVisiblePlayerColumns, 8) - 1;
    for (let index = 0; index <= highestForcedIndex; index += 1) {
      if (!visible.includes(index)) {
        visible.push(index);
      }
    }

    if (visible.length === 0) {
      visible.push(0);
    }

    return visible.sort((left, right) => left - right);
  }, [
    isCricketGame,
    isCrokinoleGame,
    isMexicanTrainGame,
    requestedVisiblePlayerColumns,
    roundEntries,
    roundScores,
    selectedPlayers,
  ]);

  function getPlayerOptionLabel(player: { firstName: string; lastName: string; isGuest?: boolean }) {
    return `${ player.firstName } ${ player.lastName }${ player.isGuest ? " (guest)" : "" }`;
  }

  function addPlayerColumn() {
    setRequestedVisiblePlayerColumns((current) => Math.min(current + 1, 8));
  }

  function clearPlayerColumn(colIndex: number) {
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
  }

  function resetSharedBoardState(nextVisiblePlayerColumns = 1) {
    setSelectedPlayers(emptySelectedPlayers);
    setRoundScores(new Map());
    setPersistedCumulativeScores(null);
    setHasRoundScoreEdits(false);
    setRequestedVisiblePlayerColumns(nextVisiblePlayerColumns);
  }

  return {
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
    isAcquireGame,
    isMexicanTrainGame,
    orderedSelectablePlayers,
    gameStatesForSelectedMetadata,
    roundEntries,
    visiblePlayerColumnIndices,
    getPlayerOptionLabel,
    addPlayerColumn,
    clearPlayerColumn,
    resetSharedBoardState,
  };
}