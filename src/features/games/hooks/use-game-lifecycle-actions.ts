import { startTransition, useState } from "react";
import { toast } from "sonner";

import {
  addGuestMemberAction,
  archiveGameAction,
  deleteGameAction,
  loadGameScoreboardAction,
  saveGameScoreboardAction,
  startGameAction,
} from "@/app/(features)/(games)/games/actions";
import type { GameState } from "@/components/db/types/game-scoreboard";
import type { CricketFormat, CrokinoleFormat, RoundEntry, SelectedPlayer } from "@/features/games/types/scoreboard-ui";
import type { CricketTurnLedgerEntry } from "@/features/games/utils/cricket-rules";

type LifecycleSelectablePlayer = {
  id: number;
  firstName: string;
  lastName: string;
  isGuest: boolean;
};

type LoadedScoreboard = {
  gameState: GameState;
  players: Array<{
    playPosition: number;
    memberId: number;
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

type UseGameLifecycleActionsArgs = {
  familyId: number;
  memberId: number;
  router: { refresh: () => void };
  scoreboardGridRef: React.RefObject<HTMLDivElement | null>;
  newGameOptionValue: string;
  crokinoleWinScore: number;

  selectedGame: {
    id: number;
    name: string;
    isRoundBased: boolean;
    scoreUom: string;
  } | null;
  selectedGameState: GameState | null;
  selectedPlayers: (SelectedPlayer | null)[];
  roundScores: Map<number, Map<number, number>>;
  roundEntries: RoundEntry[];
  cumulativeScores: Map<number, number>;
  hasRoundScoreEdits: boolean;
  isCricketGame: boolean;
  isCrokinoleGame: boolean;
  cricketFormat: CricketFormat;
  selectedGameTitleOption: string;
  crokinoleFormat: CrokinoleFormat;
  crokinoleTeamNames: [string, string];
  crokinoleWinnerTeamIndex: 0 | 1 | null;
  crokinoleFinalRoundNo: number | null;
  cricketTurnLedger: CricketTurnLedgerEntry[];
  cricketWinnerSideIndex: 0 | 1 | null;

  setSelectedGameId: (value: number) => void;
  setSelectedGameState: (value: GameState | null) => void;
  setSelectedGameTitleOption: (value: string) => void;
  setSelectedPlayers: React.Dispatch<React.SetStateAction<(SelectedPlayer | null)[]>>;
  setRoundScores: (value: Map<number, Map<number, number>>) => void;
  setPersistedCumulativeScores: (value: Map<number, number> | null) => void;
  setHasRoundScoreEdits: (value: boolean) => void;
  setRequestedVisiblePlayerColumns: (value: number) => void;
  setLocalSelectablePlayers: React.Dispatch<React.SetStateAction<LifecycleSelectablePlayer[]>>;
  resetSharedBoardState: (nextVisiblePlayerColumns?: number) => void;

  resetCricketState: () => void;
  setCricketTurnLedger: React.Dispatch<React.SetStateAction<CricketTurnLedgerEntry[]>>;
  setCricketTurnDarts: React.Dispatch<React.SetStateAction<string[]>>;
  loadCricketFromRounds: (rounds: LoadedScoreboard["rounds"]) => {
    ledger: CricketTurnLedgerEntry[];
    board: { scores: [number, number] };
  };
  setCricketFormat: (value: CricketFormat) => void;
  inferCricketFormatFromPlayers: (players: (SelectedPlayer | null)[]) => CricketFormat;

  resetCrokinoleState: () => void;
  setCrokinoleFormat: (value: CrokinoleFormat) => void;
  inferCrokinoleFormatFromPlayers: (players: (SelectedPlayer | null)[]) => CrokinoleFormat;
};

function formatGameTitleWithDate(title: string) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  return `${ title }: ${ mm }/${ dd }/${ yy }`;
}

export function useGameLifecycleActions({
  familyId,
  memberId,
  router,
  scoreboardGridRef,
  newGameOptionValue,
  crokinoleWinScore,
  selectedGame,
  selectedGameState,
  selectedPlayers,
  roundScores,
  roundEntries,
  cumulativeScores,
  isCricketGame,
  isCrokinoleGame,
  cricketFormat,
  crokinoleFormat,
  crokinoleTeamNames,
  crokinoleWinnerTeamIndex,
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
  resetCricketState,
  setCricketTurnLedger,
  setCricketTurnDarts,
  loadCricketFromRounds,
  setCricketFormat,
  inferCricketFormatFromPlayers,
  resetCrokinoleState,
  setCrokinoleFormat,
  inferCrokinoleFormatFromPlayers,
}: UseGameLifecycleActionsArgs) {
  const [gameTitleInput, setGameTitleInput] = useState("");
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isSavingGame, setIsSavingGame] = useState(false);
  const [isLoadingSavedGame, setIsLoadingSavedGame] = useState(false);
  const [isArchivingGame, setIsArchivingGame] = useState(false);
  const [isDeletingGame, setIsDeletingGame] = useState(false);
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [guestDialogColIndex, setGuestDialogColIndex] = useState<number | null>(null);
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [isContinueGameHidden, setIsContinueGameHidden] = useState(false);

  function openGuestDialog(slotIndex: number) {
    setGuestDialogColIndex(slotIndex);
    setIsGuestDialogOpen(true);
  }

  function closeGuestDialog() {
    setIsGuestDialogOpen(false);
    setGuestFirstName("");
    setGuestLastName("");
    setGuestEmail("");
    setGuestDialogColIndex(null);
  }

  function openStartDialog() {
    if (!selectedGame) {
      return;
    }

    if (!gameTitleInput.trim()) {
      setGameTitleInput(selectedGame.name);
    }

    setIsStartDialogOpen(true);
  }

  function closeStartDialog() {
    setIsStartDialogOpen(false);
  }

  function startOrContinueGame() {
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

    openStartDialog();
  }

  function confirmStartGame() {
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
      resetSharedBoardState(isCricketGame || isCrokinoleGame ? 2 : 8);
      setPersistedCumulativeScores(null);
      resetCricketState();
      resetCrokinoleState();
      setIsStartDialogOpen(false);
      toast.success(`Started game \"${ result.gameState.gameTitle }\".`);
    });
  }

  function saveGame() {
    if (!selectedGame || !selectedGameState) {
      toast.error("Start a game before saving it.");
      return;
    }

    const activePlayers = (isCricketGame || isCrokinoleGame)
      ? selectedPlayers
        .slice(0,
          isCricketGame && cricketFormat === "doubles"
            ? 4
            : isCrokinoleGame && crokinoleFormat === "doubles"
              ? 4
              : 2)
        .map((player, index) => player ? { ...player, playPosition: index + 1 } : null)
        .filter((player): player is SelectedPlayer & { playPosition: number } => player !== null)
      : selectedPlayers
        .map((player, index) => player ? { ...player, playPosition: index + 1 } : null)
        .filter((player): player is SelectedPlayer & { playPosition: number } => player !== null);

    if (activePlayers.length === 0) {
      toast.error("Select at least one player before saving the game.");
      return;
    }

    if (isCrokinoleGame && activePlayers.length < 2) {
      toast.error("Select both Crokinole teams before saving the game.");
      return;
    }

    if (isCricketGame && activePlayers.length < 2) {
      toast.error("Select both Cricket sides before saving the game.");
      return;
    }

    if (isCricketGame && cricketFormat === "doubles") {
      const requiredSlots = [0, 1, 2, 3];
      const hasMissingTeamMember = requiredSlots.some((slotIndex) => !selectedPlayers[slotIndex]);
      if (hasMissingTeamMember) {
        toast.error("Select two players per Cricket side before saving.");
        return;
      }
    }

    if (isCrokinoleGame && crokinoleFormat === "doubles") {
      const requiredSlots = [0, 1, 2, 3];
      const hasMissingTeamMember = requiredSlots.some((slotIndex) => !selectedPlayers[slotIndex]);
      if (hasMissingTeamMember) {
        toast.error("Select two players per team for Crokinole doubles before saving.");
        return;
      }
    }

    const rowsToPersist = isCrokinoleGame && crokinoleWinnerTeamIndex !== null && crokinoleFinalRoundNo !== null
      ? roundEntries.filter((roundEntry) => roundEntry.roundNo <= crokinoleFinalRoundNo)
      : roundEntries;

    const scoreboardRows = isCricketGame
      ? cricketTurnLedger.map((turnEntry) => ({
        roundNo: turnEntry.turnNo,
        roundLabel: `Turn ${ turnEntry.turnNo }`,
        scores: activePlayers.map((player) => {
          const cricketSideIndex = cricketFormat === "doubles" && player.playPosition > 2
            ? player.playPosition - 3
            : player.playPosition - 1;
          const isPrimarySideSlot = cricketSideIndex === 0
            ? player.playPosition === 1
            : player.playPosition === 2;

          return {
            memberId: player.id,
            playPosition: player.playPosition,
            roundScore: isPrimarySideSlot && cricketSideIndex === turnEntry.sideIndex ? turnEntry.encodedValue : 0,
            cumulativeScore: turnEntry.boardAfter.scores[cricketSideIndex],
          };
        }),
      }))
      : rowsToPersist.map((roundEntry) => ({
        roundNo: roundEntry.roundNo,
        roundLabel: roundEntry.label,
        scores: activePlayers.map((player) => {
          const teamColumnIndex = isCrokinoleGame && player.playPosition > 2
            ? player.playPosition - 3
            : player.playPosition - 1;

          return {
            memberId: player.id,
            playPosition: player.playPosition,
            roundScore: roundScores.get(roundEntry.roundKey)?.get(teamColumnIndex) ?? 0,
            cumulativeScore: cumulativeScores.get(teamColumnIndex) ?? 0,
          };
        }),
      }));

    const activeColIndices = activePlayers.map((player) => player.playPosition - 1);
    let saveStatus: "active" | "in_progress" | "completed" | "archived" = selectedGameState.status;

    if (isCricketGame) {
      saveStatus = cricketWinnerSideIndex !== null ? "completed" : "in_progress";
    } else if (isCrokinoleGame) {
      saveStatus = crokinoleWinnerTeamIndex !== null ? "completed" : "in_progress";
    } else {
      const numberedRoundKeys = roundEntries
        .filter((roundEntry) => roundEntry.roundKey > 0)
        .map((roundEntry) => roundEntry.roundKey);
      const isAllScoresEntered = selectedGame.isRoundBased
        ? (
          numberedRoundKeys.length > 0
          && activeColIndices.length > 0
          && numberedRoundKeys.every((roundKey) =>
            activeColIndices.every((colIndex) => {
              const score = roundScores.get(roundKey)?.get(colIndex);
              return score !== undefined && score !== 0;
            })
          )
        )
        : (
          activeColIndices.length > 0
          && activeColIndices.every((colIndex) => roundScores.get(1)?.get(colIndex) !== undefined)
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

      if (result.gameState.status === "completed") {
        router.refresh();
      }

      toast.success(
        result.gameState.status === "completed"
          ? `Game "${ result.gameState.gameTitle }" completed!`
          : result.message,
        {
          description: result.gameState.status === "completed"
            ? (isCrokinoleGame && crokinoleWinnerTeamIndex !== null
              ? `${ crokinoleTeamNames[crokinoleWinnerTeamIndex] || `Team ${ crokinoleWinnerTeamIndex + 1 }` } reached ${ crokinoleWinScore }+ and has been declared the winner.`
              : "All scores entered. Game marked as completed and leaderboard updated.")
            : `${ activePlayers.length } players and ${ scoreboardRows.length } scoreboard rows prepared for persistence.`,
        }
      );
    });
  }

  async function loadPersistedGame(gameId: number) {
    if (!selectedGame) {
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

    const scoreboard = result.scoreboard as LoadedScoreboard;
    const loadedPlayers = Array(8).fill(null) as (SelectedPlayer | null)[];
    for (const player of scoreboard.players) {
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

    const loadedGameName = selectedGame.name.trim().toLowerCase();
    const isLoadedCricketGame = loadedGameName === "cricket";
    const isLoadedCrokinoleGame = loadedGameName === "crokinole";

    if (isLoadedCricketGame) {
      const { ledger, board } = loadCricketFromRounds(scoreboard.rounds);

      setSelectedGameId(scoreboard.gameState.gameMetaId);
      setSelectedGameTitleOption(String(scoreboard.gameState.id));
      setSelectedGameState(scoreboard.gameState);
      setGameTitleInput(scoreboard.gameState.gameTitle);
      setSelectedPlayers(loadedPlayers);
      setRequestedVisiblePlayerColumns(2);
      setCricketFormat(inferCricketFormatFromPlayers(loadedPlayers));
      setLocalSelectablePlayers((current) => {
        const existingIds = new Set(current.map((player) => player.id));
        const missing = loadedPlayers
          .filter((player): player is SelectedPlayer => player !== null && !existingIds.has(player.id));
        return missing.length > 0 ? [...current, ...missing] : current;
      });
      setRoundScores(new Map());
      setCricketTurnLedger(ledger);
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

    for (const roundRow of scoreboard.rounds) {
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

    setSelectedGameId(scoreboard.gameState.gameMetaId);
    setSelectedGameTitleOption(String(scoreboard.gameState.id));
    setSelectedGameState(scoreboard.gameState);
    setGameTitleInput(scoreboard.gameState.gameTitle);
    setSelectedPlayers(loadedPlayers);
    const loadedPlayerCount = loadedPlayers.filter((player) => player !== null).length;
    setRequestedVisiblePlayerColumns(isLoadedCrokinoleGame ? 2 : Math.max(1, loadedPlayerCount));
    setLocalSelectablePlayers((current) => {
      const existingIds = new Set(current.map((player) => player.id));
      const missing = loadedPlayers
        .filter((player): player is SelectedPlayer => player !== null && !existingIds.has(player.id));
      return missing.length > 0 ? [...current, ...missing] : current;
    });
    setRoundScores(loadedRoundScores);
    setPersistedCumulativeScores(loadedCumulativeScores);
    setHasRoundScoreEdits(false);
    if (isLoadedCrokinoleGame) {
      setCrokinoleFormat(inferCrokinoleFormatFromPlayers(loadedPlayers));
    }
  }

  function addGuest() {
    if (guestDialogColIndex === null) {
      return;
    }

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

      setLocalSelectablePlayers((current) => [...current, result.guestMember]);

      const nextPlayers = [...selectedPlayers];
      nextPlayers[guestDialogColIndex] = {
        id: result.guestMember.id,
        firstName: result.guestMember.firstName,
        lastName: result.guestMember.lastName,
        isGuest: result.guestMember.isGuest,
      };
      setSelectedPlayers(nextPlayers);

      closeGuestDialog();
      toast.success(`Guest ${ trimmedFirst } ${ trimmedLast } added.`);
    });
  }

  function archiveSelectedGame() {
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
      setSelectedGameTitleOption(newGameOptionValue);
      setSelectedGameState(null);
      setGameTitleInput("");
      resetSharedBoardState();
      setPersistedCumulativeScores(null);
      resetCricketState();
      resetCrokinoleState();
      setIsContinueGameHidden(false);
      router.refresh();
      toast.success(`Game "${ archivedTitle }" archived.`);
    });
  }

  function deleteSelectedGame() {
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

      setSelectedGameTitleOption(newGameOptionValue);
      setSelectedGameState(null);
      setGameTitleInput("");
      resetSharedBoardState();
      setPersistedCumulativeScores(null);
      resetCricketState();
      resetCrokinoleState();
      setIsContinueGameHidden(false);
      router.refresh();
      toast.success(result.message);
    });
  }

  return {
    gameTitleInput,
    setGameTitleInput,
    isStartDialogOpen,
    setIsStartDialogOpen,
    isStartingGame,
    isSavingGame,
    isLoadingSavedGame,
    isArchivingGame,
    isDeletingGame,
    isGuestDialogOpen,
    setIsGuestDialogOpen,
    guestDialogColIndex,
    guestFirstName,
    setGuestFirstName,
    guestLastName,
    setGuestLastName,
    guestEmail,
    setGuestEmail,
    isAddingGuest,
    isContinueGameHidden,
    setIsContinueGameHidden,
    formatGameTitleWithDate,
    openGuestDialog,
    closeGuestDialog,
    openStartDialog,
    closeStartDialog,
    startOrContinueGame,
    confirmStartGame,
    saveGame,
    loadPersistedGame,
    addGuest,
    archiveSelectedGame,
    deleteSelectedGame,
  };
}