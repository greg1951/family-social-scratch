import { startTransition, useMemo, useState } from "react";
import { toast } from "sonner";

import type { CricketFormat, SelectedPlayer } from "@/features/games/types/scoreboard-ui";
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
  const [cricketFormat, setCricketFormat] = useState<CricketFormat>("singles");

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

  function inferCricketFormatFromPlayers(players: (SelectedPlayer | null)[]): CricketFormat {
    return players[2] || players[3] ? "doubles" : "singles";
  }

  function getCricketSideIndexForSlot(slotIndex: number): CricketSideIndex {
    return slotIndex === 1 || slotIndex === 3 ? 1 : 0;
  }

  function isCricketSlotPrimary(slotIndex: number) {
    return slotIndex === 0 || slotIndex === 1;
  }

  function setCricketFormatValue(value: CricketFormat) {
    setCricketFormat(value);

    if (value === "singles") {
      setSelectedPlayers((current) => {
        const next = [...current];
        next[2] = null;
        next[3] = null;
        return next;
      });
    }
  }

  function setCricketTurnDart(index: number, value: string) {
    setCricketTurnDarts((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
    onBoardEdited();
  }

  function setCricketSidePlayer(sideIndex: CricketSideIndex, value: string) {
    setCricketPlayerSlot(sideIndex, value);
  }

  function setCricketPlayerSlot(slotIndex: number, value: string) {
    if (value === addGuestOptionValue) {
      onOpenGuestDialog(slotIndex);
      return;
    }

    if (value === clearPlayerOptionValue) {
      onClearPlayerColumn(slotIndex);
      return;
    }

    const selectedMemberId = Number(value);
    const selectedInAnotherSlot = selectedPlayers.some(
      (existingPlayer, existingIdx) => existingIdx !== slotIndex && existingPlayer?.id === selectedMemberId
    );
    if (selectedInAnotherSlot) {
      return;
    }

    const selectedMember = selectablePlayers.find((member) => member.id === selectedMemberId);
    if (!selectedMember) {
      return;
    }

    const nextPlayers = [...selectedPlayers];
    nextPlayers[slotIndex] = {
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

    const sideOneReady = Boolean(selectedPlayers[0]) && (cricketFormat === "singles" || Boolean(selectedPlayers[2]));
    const sideTwoReady = Boolean(selectedPlayers[1]) && (cricketFormat === "singles" || Boolean(selectedPlayers[3]));

    if (!sideOneReady || !sideTwoReady) {
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
    setCricketFormat("singles");
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
    cricketFormat,
    cricketBoardState,
    cricketWinnerSideIndex,
    cricketActiveSideIndex,
    cricketActiveSidePlayer,
    setCricketFormat: setCricketFormatValue,
    setCricketPlayerSlot,
    setCricketTurnDart,
    setCricketSidePlayer,
    submitCricketTurn,
    resetCricketState,
    loadCricketFromRounds,
    inferCricketFormatFromPlayers,
    getCricketSideIndexForSlot,
    isCricketSlotPrimary,
  };
}