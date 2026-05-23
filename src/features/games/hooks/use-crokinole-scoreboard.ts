import { useMemo, useState } from "react";

import type { CrokinoleFormat, RoundEntry, SelectedPlayer } from "@/features/games/types/scoreboard-ui";

type UseCrokinoleScoreboardArgs = {
  enabled: boolean;
  selectedPlayers: (SelectedPlayer | null)[];
  setSelectedPlayers: React.Dispatch<React.SetStateAction<(SelectedPlayer | null)[]>>;
  roundEntries: RoundEntry[];
  roundScores: Map<number, Map<number, number>>;
  cumulativeScores: Map<number, number>;
  winScore: number;
  addGuestOptionValue: string;
  clearPlayerOptionValue: string;
  selectablePlayers: Array<{ id: number; firstName: string; lastName: string; isGuest: boolean }>;
  onOpenGuestDialog: (slotIndex: number) => void;
  onClearPlayerColumn: (colIndex: number) => void;
};

export function useCrokinoleScoreboard({
  enabled,
  selectedPlayers,
  setSelectedPlayers,
  roundEntries,
  roundScores,
  cumulativeScores,
  winScore,
  addGuestOptionValue,
  clearPlayerOptionValue,
  selectablePlayers,
  onOpenGuestDialog,
  onClearPlayerColumn,
}: UseCrokinoleScoreboardArgs) {
  const [crokinoleFormat, setCrokinoleFormatState] = useState<CrokinoleFormat>("singles");
  const [crokinoleTeamNames, setCrokinoleTeamNames] = useState<[string, string]>(["Team 1", "Team 2"]);

  const crokinoleWinnerTeamIndex = useMemo(() => {
    if (!enabled) {
      return null;
    }

    const teamOneScore = cumulativeScores.get(0) ?? 0;
    const teamTwoScore = cumulativeScores.get(1) ?? 0;
    const teamOneReached = teamOneScore >= winScore;
    const teamTwoReached = teamTwoScore >= winScore;

    if (!teamOneReached && !teamTwoReached) {
      return null;
    }

    if (teamOneScore === teamTwoScore) {
      return null;
    }

    return teamOneScore > teamTwoScore ? 0 : 1;
  }, [cumulativeScores, enabled, winScore]);

  const crokinoleFinalRoundNo = useMemo(() => {
    if (!enabled) {
      return null;
    }

    let lastRoundNo: number | null = null;
    for (const roundEntry of roundEntries) {
      const roundMap = roundScores.get(roundEntry.roundKey);
      const hasTeamOneScore = roundMap?.has(0) ?? false;
      const hasTeamTwoScore = roundMap?.has(1) ?? false;

      if (hasTeamOneScore && hasTeamTwoScore) {
        lastRoundNo = roundEntry.roundNo;
      }
    }

    return lastRoundNo;
  }, [enabled, roundEntries, roundScores]);

  const displayedRoundEntries = useMemo(() => {
    if (!enabled || crokinoleWinnerTeamIndex === null || crokinoleFinalRoundNo === null) {
      return roundEntries;
    }

    return roundEntries.filter((roundEntry) => roundEntry.roundNo <= crokinoleFinalRoundNo);
  }, [crokinoleFinalRoundNo, crokinoleWinnerTeamIndex, enabled, roundEntries]);

  function isCrokinoleTeamReady(teamIndex: 0 | 1) {
    const primarySelected = Boolean(selectedPlayers[teamIndex]);
    if (!primarySelected) {
      return false;
    }

    if (crokinoleFormat === "singles") {
      return true;
    }

    return Boolean(selectedPlayers[teamIndex + 2]);
  }

  const isCrokinoleScoringEnabled = !enabled
    || (isCrokinoleTeamReady(0) && isCrokinoleTeamReady(1) && crokinoleWinnerTeamIndex === null);

  function setCrokinoleFormat(value: CrokinoleFormat) {
    setCrokinoleFormatState(value);
    if (value === "singles") {
      setSelectedPlayers((current) => {
        const nextPlayers = [...current];
        nextPlayers[2] = null;
        nextPlayers[3] = null;
        return nextPlayers;
      });
    }
  }

  function setCrokinoleTeamName(teamIndex: 0 | 1, value: string) {
    setCrokinoleTeamNames((current) => {
      const nextNames: [string, string] = [...current] as [string, string];
      nextNames[teamIndex] = value;
      return nextNames;
    });
  }

  function setCrokinolePlayerSlot(slotIndex: number, value: string) {
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
      (existingPlayer, existingIndex) => existingIndex !== slotIndex && existingPlayer?.id === selectedMemberId
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

  function getRoundWinnerStyle(roundKey: number, colIndex: number) {
    if (!enabled) {
      return "";
    }

    const leftScore = roundScores.get(roundKey)?.get(0);
    const rightScore = roundScores.get(roundKey)?.get(1);
    if (leftScore === undefined || rightScore === undefined || leftScore === rightScore) {
      return "";
    }

    const winnerColIndex = leftScore > rightScore ? 0 : 1;
    return colIndex === winnerColIndex ? "!bg-emerald-100 !text-emerald-800" : "";
  }

  function inferFormatFromPlayers(players: (SelectedPlayer | null)[]) {
    return players[2] || players[3] ? "doubles" : "singles";
  }

  function resetCrokinoleState() {
    setCrokinoleFormatState("singles");
    setCrokinoleTeamNames(["Team 1", "Team 2"]);
  }

  return {
    crokinoleFormat,
    crokinoleTeamNames,
    crokinoleWinnerTeamIndex,
    crokinoleFinalRoundNo,
    displayedRoundEntries,
    isCrokinoleScoringEnabled,
    setCrokinoleFormat,
    setCrokinoleTeamName,
    setCrokinolePlayerSlot,
    getRoundWinnerStyle,
    inferFormatFromPlayers,
    resetCrokinoleState,
  };
}