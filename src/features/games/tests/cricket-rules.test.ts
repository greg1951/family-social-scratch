import { describe, expect, it } from "vitest";
import {
  applyCricketTurn,
  buildCricketLedgerFromPersistedRounds,
  createEmptyCricketBoardState,
  decodeCricketTurn,
  determineCricketWinner,
  encodeCricketTurn,
  parseCricketDartNotation,
} from "@/features/games/utils/cricket-rules";

describe("cricket-rules", () => {
  it("parses common dart notation aliases", () => {
    expect(parseCricketDartNotation("t20")).toEqual({ targetKey: 20, multiplier: 3 });
    expect(parseCricketDartNotation("bull")).toEqual({ targetKey: 25, multiplier: 1 });
    expect(parseCricketDartNotation("miss")).toEqual({ targetKey: null, multiplier: 0 });
    expect(parseCricketDartNotation("12")).toEqual({ targetKey: null, multiplier: 0 });
  });

  it("round-trips encoded turns including side ownership", () => {
    const encodedTurn = encodeCricketTurn(["T20", "D19", "B"], 1);

    expect(decodeCricketTurn(encodedTurn)).toEqual({
      sideIndex: 1,
      darts: ["T20", "D19", "S25"],
    });
  });

  it("scores only overflow marks when the throwing side has already closed the target", () => {
    let board = createEmptyCricketBoardState();

    const firstTurn = applyCricketTurn(board, 0, ["T20"]);
    board = firstTurn.boardAfter;

    expect(firstTurn.scoreDelta).toBe(0);
    expect(board.marksByTarget.get(20)).toEqual([3, 0]);
    expect(board.scores).toEqual([0, 0]);

    const secondTurn = applyCricketTurn(board, 0, ["T20"]);

    expect(secondTurn.scoreDelta).toBe(60);
    expect(secondTurn.boardAfter.scores).toEqual([60, 0]);
    expect(secondTurn.boardAfter.bonusByTarget.get(20)).toEqual([60, 0]);
  });

  it("does not declare a winner until a side closes all targets and is not behind on score", () => {
    const board = createEmptyCricketBoardState();

    for (const targetKey of board.marksByTarget.keys()) {
      board.marksByTarget.set(targetKey, [3, 0]);
    }

    board.scores = [40, 50];
    expect(determineCricketWinner(board)).toBeNull();

    board.scores = [50, 50];
    expect(determineCricketWinner(board)).toBe(0);
  });

  it("rebuilds persisted rounds into ordered ledger and board state", () => {
    const sideZeroOpen = encodeCricketTurn(["T20", "D19", ""], 0);
    const sideOneReply = encodeCricketTurn(["T20", "T19", ""], 1);

    const rebuilt = buildCricketLedgerFromPersistedRounds([
      { roundNo: 2, roundScore: sideOneReply },
      { roundNo: 1, roundScore: sideZeroOpen },
    ]);

    expect(rebuilt.ledger).toHaveLength(2);
    expect(rebuilt.ledger[0]?.turnNo).toBe(1);
    expect(rebuilt.ledger[0]?.sideIndex).toBe(0);
    expect(rebuilt.ledger[1]?.turnNo).toBe(2);
    expect(rebuilt.ledger[1]?.sideIndex).toBe(1);
    expect(rebuilt.board.marksByTarget.get(20)).toEqual([3, 3]);
    expect(rebuilt.board.marksByTarget.get(19)).toEqual([2, 3]);
    expect(rebuilt.board.scores).toEqual([0, 0]);
  });
});
