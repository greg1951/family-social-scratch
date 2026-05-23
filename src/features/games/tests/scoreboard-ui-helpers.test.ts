import { describe, expect, it } from "vitest";
import {
  formatGameScore,
  getDisplayedScores,
  getScoreStyleClass,
  updateRoundScoresMap,
} from "@/features/games/utils/scoreboard-ui-helpers";

describe("scoreboard-ui-helpers", () => {
  it("returns only scores for selected player columns", () => {
    const selectedPlayers = [
      { id: 1, firstName: "Alex", lastName: "Rivera", isGuest: false },
      null,
      { id: 3, firstName: "Blair", lastName: "Ng", isGuest: true },
    ];
    const cumulativeScores = new Map<number, number>([
      [0, 12],
      [1, 99],
      [2, 7],
    ]);

    expect(getDisplayedScores(selectedPlayers, cumulativeScores)).toEqual([12, 7]);
  });

  it("highlights the highest score when high score wins", () => {
    const cumulativeScores = new Map<number, number>([
      [0, 14],
      [1, 26],
    ]);

    expect(getScoreStyleClass({
      colIndex: 1,
      cumulativeScores,
      displayedScores: [14, 26],
      winnerDirection: "high",
    })).toBe("!bg-emerald-100 !text-emerald-800");

    expect(getScoreStyleClass({
      colIndex: 0,
      cumulativeScores,
      displayedScores: [14, 26],
      winnerDirection: "high",
    })).toBe("!bg-rose-100 !text-rose-700");
  });

  it("highlights the lowest score when low score wins", () => {
    const cumulativeScores = new Map<number, number>([
      [0, 8],
      [1, 19],
    ]);

    expect(getScoreStyleClass({
      colIndex: 0,
      cumulativeScores,
      displayedScores: [8, 19],
      winnerDirection: "low",
    })).toBe("!bg-emerald-100 !text-emerald-800");

    expect(getScoreStyleClass({
      colIndex: 1,
      cumulativeScores,
      displayedScores: [8, 19],
      winnerDirection: "low",
    })).toBe("!bg-rose-100 !text-rose-700");
  });

  it("normalizes generic and cricket round score updates without mutating prior maps", () => {
    const initialScores = new Map<number, Map<number, number>>([
      [1, new Map([[0, 4]])],
    ]);

    const genericUpdate = updateRoundScoresMap({
      roundScores: initialScores,
      roundKey: 1,
      colIndex: 1,
      value: "11",
      isCricketGame: false,
    });

    const cricketUpdate = updateRoundScoresMap({
      roundScores: initialScores,
      roundKey: 2,
      colIndex: 0,
      value: "7",
      isCricketGame: true,
    });

    expect(initialScores.get(1)?.has(1)).toBe(false);
    expect(genericUpdate.get(1)?.get(1)).toBe(11);
    expect(cricketUpdate.get(2)?.get(0)).toBe(3);
  });

  it("formats score output for currency and plain units", () => {
    expect(formatGameScore(1250, "dollars")).toBe("$1,250");
    expect(formatGameScore(18, "points")).toBe("18 points");
  });
});
