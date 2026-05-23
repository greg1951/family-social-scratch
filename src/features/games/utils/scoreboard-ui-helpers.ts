import type { SelectedPlayer } from "@/features/games/types/scoreboard-ui";

export function getDisplayedScores(
  selectedPlayers: Array<SelectedPlayer | null>,
  cumulativeScores: Map<number, number>
): number[] {
  return selectedPlayers
    .map((player, colIndex) => (player ? cumulativeScores.get(colIndex) ?? 0 : null))
    .filter((score): score is number => score !== null);
}

export function getScoreStyleClass(params: {
  colIndex: number;
  cumulativeScores: Map<number, number>;
  displayedScores: number[];
  winnerDirection: "high" | "low" | undefined;
}): string {
  const { colIndex, cumulativeScores, displayedScores, winnerDirection } = params;
  const score = cumulativeScores.get(colIndex) ?? 0;

  if (displayedScores.length === 0) {
    return "";
  }

  const lowestScore = Math.min(...displayedScores);
  const highestScore = Math.max(...displayedScores);

  if (score === lowestScore && score === highestScore) {
    return "";
  }

  if (winnerDirection === "high") {
    if (score === highestScore) {
      return "!bg-emerald-100 !text-emerald-800";
    }

    if (score === lowestScore) {
      return "!bg-rose-100 !text-rose-700";
    }

    return "";
  }

  if (score === lowestScore) {
    return "!bg-emerald-100 !text-emerald-800";
  }

  if (score === highestScore) {
    return "!bg-rose-100 !text-rose-700";
  }

  return "";
}

export function updateRoundScoresMap(params: {
  roundScores: Map<number, Map<number, number>>;
  roundKey: number;
  colIndex: number;
  value: string;
  isCricketGame: boolean;
}): Map<number, Map<number, number>> {
  const { roundScores, roundKey, colIndex, value, isCricketGame } = params;
  const parsed = value === "" ? 0 : Number.parseInt(value, 10) || 0;
  const normalizedValue = isCricketGame
    ? Math.max(0, Math.min(3, parsed))
    : Math.max(0, parsed);

  const nextRoundMap = new Map(roundScores.get(roundKey) ?? []);
  nextRoundMap.set(colIndex, normalizedValue);

  const nextRoundScores = new Map(roundScores);
  nextRoundScores.set(roundKey, nextRoundMap);
  return nextRoundScores;
}

export function formatGameScore(value: number, scoreUom: string): string {
  const formattedValue = new Intl.NumberFormat("en-US").format(value);
  return scoreUom.toLowerCase() === "dollars"
    ? `$${ formattedValue }`
    : `${ formattedValue } ${ scoreUom }`;
}
