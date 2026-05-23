import { startTransition, useMemo, useState } from "react";
import { toast } from "sonner";

import type { SelectedPlayer } from "@/features/games/types/scoreboard-ui";
import {
  applyCricketTurn,
  buildCricketBoardFromLedger,
  buildCricketLedgerFromPersistedRounds,
  determineCricketWinner,
  encodeCricketTurn,
  type CricketSideIndex,
  type CricketTurnLedgerEntry,
} from "@/features/games/utils/cricket-rules";

type UseCricketScoreboardArgs = {
  enabled: boolean;
  selectedPlayers: (SelectedPlayer | null)[];
  setSelectedPlayers: React.Dispatch<React.SetStateAction<(SelectedPlayer | null)[]>>;
  selectablePlayers: Array<{ id: number; firstName: string; lastName: string; isGuest: boolean }>;
  addGuestOptionValue: string;
  clearPlayerOptionValue: string;
  onOpenGuestDialog: (slotIndex: number) => void;
  onClearPlayerColumn: (colIndex: number) => void;
  onBoardEdited: () => void;
  onPersistedScoresCleared: () => void;
};

export function useCricketScoreboard({
  enabled,
  selectedPlayers,
  setSelectedPlayers,
  selectablePlayers,
  addGuestOptionValue,
  clearPlayerOptionValue,
  onOpenGuestDialog,
  onClearPlayerColumn,
  onBoardEdited,
  onPersistedScoresCleared,
}: UseCricketScoreboardArgs) {
  const [cricketTurnLedger, setCricketTurnLedger] = useState<CricketTurnLedgerEntry[]>([]);
  const [cricketTurnDarts, setCricketTurnDarts] = useState(["", "", ""]);
  const [isSubmittingCricketTurn, setIsSubmittingCricketTurn] = useState(false);

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

  function setCricketTurnDart(index: number, value: string) {
    setCricketTurnDarts((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
    onBoardEdited();
  }

  function setCricketSidePlayer(sideIndex: CricketSideIndex, value: string) {
    if (value === addGuestOptionValue) {
      onOpenGuestDialog(sideIndex);
      return;
    }

    if (value === clearPlayerOptionValue) {
      onClearPlayerColumn(sideIndex);
      return;
    }

    const selectedMemberId = Number(value);
    const otherSideIndex = sideIndex === 0 ? 1 : 0;
    if (selectedPlayers[otherSideIndex]?.id === selectedMemberId) {
      return;
    }

    const selectedMember = selectablePlayers.find((member) => member.id === selectedMemberId);
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
  }

  function submitCricketTurn() {
    if (!enabled) {
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

      setCricketTurnLedger((current) => [...current, nextTurn]);
      setCricketTurnDarts(["", "", ""]);
      onBoardEdited();
      onPersistedScoresCleared();
      setIsSubmittingCricketTurn(false);

      const winner = determineCricketWinner(applied.boardAfter);
      if (winner !== null) {
        toast.success(`Side ${ winner + 1 } has won Cricket.`);
      } else {
        toast.success(`Turn submitted for Side ${ cricketActiveSideIndex + 1 }.`);
      }
    });
  }

  function resetCricketState() {
    setCricketTurnLedger([]);
    setCricketTurnDarts(["", "", ""]);
  }

  function loadCricketFromRounds(rounds: Array<{ roundNo: number; roundScore: number }>) {
    return buildCricketLedgerFromPersistedRounds(rounds);
  }

  return {
    cricketTurnLedger,
    setCricketTurnLedger,
    cricketTurnDarts,
    setCricketTurnDarts,
    isSubmittingCricketTurn,
    cricketBoardState,
    cricketWinnerSideIndex,
    cricketActiveSideIndex,
    cricketActiveSidePlayer,
    setCricketTurnDart,
    setCricketSidePlayer,
    submitCricketTurn,
    resetCricketState,
    loadCricketFromRounds,
  };
}