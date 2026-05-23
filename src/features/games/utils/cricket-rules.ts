export const CRICKET_TARGETS = [
  { roundKey: 20, roundNo: 20, label: "20", scoreValue: 20 },
  { roundKey: 19, roundNo: 19, label: "19", scoreValue: 19 },
  { roundKey: 18, roundNo: 18, label: "18", scoreValue: 18 },
  { roundKey: 17, roundNo: 17, label: "17", scoreValue: 17 },
  { roundKey: 16, roundNo: 16, label: "16", scoreValue: 16 },
  { roundKey: 15, roundNo: 15, label: "15", scoreValue: 15 },
  { roundKey: 25, roundNo: 25, label: "B", scoreValue: 25 },
] as const;

export const CRICKET_TARGET_KEYS = CRICKET_TARGETS.map((target) => target.roundKey);
const CRICKET_TARGET_INDEX = new Map<number, number>(CRICKET_TARGETS.map((target, index) => [target.roundKey, index]));

export type CricketSideIndex = 0 | 1;

export interface CricketBoardState {
  marksByTarget: Map<number, [number, number]>;
  bonusByTarget: Map<number, [number, number]>;
  scores: [number, number];
}

export interface CricketTurnLedgerEntry {
  turnNo: number;
  sideIndex: CricketSideIndex;
  darts: string[];
  encodedValue: number;
  scoreDelta: number;
  boardAfter: CricketBoardState;
}

export function createEmptyCricketBoardState(): CricketBoardState {
  return {
    marksByTarget: new Map(CRICKET_TARGET_KEYS.map((targetKey) => [targetKey, [0, 0] as [number, number]])),
    bonusByTarget: new Map(CRICKET_TARGET_KEYS.map((targetKey) => [targetKey, [0, 0] as [number, number]])),
    scores: [0, 0],
  };
}

export function cloneCricketBoardState(board: CricketBoardState): CricketBoardState {
  return {
    marksByTarget: new Map(
      Array.from(board.marksByTarget.entries()).map(([targetKey, marks]) => [targetKey, [marks[0], marks[1]] as [number, number]])
    ),
    bonusByTarget: new Map(
      Array.from(board.bonusByTarget.entries()).map(([targetKey, bonus]) => [targetKey, [bonus[0], bonus[1]] as [number, number]])
    ),
    scores: [board.scores[0], board.scores[1]],
  };
}

export function parseCricketDartNotation(input: string): { targetKey: number | null; multiplier: 0 | 1 | 2 | 3 } {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed || trimmed === "0" || trimmed === "miss" || trimmed === "m") {
    return { targetKey: null, multiplier: 0 };
  }

  if (trimmed === "b" || trimmed === "bull" || trimmed === "bullseye" || trimmed === "25") {
    return { targetKey: 25, multiplier: 1 };
  }

  const match = trimmed.match(/^([sdt])?(\d{1,2})$/);
  if (!match) {
    return { targetKey: null, multiplier: 0 };
  }

  const prefix = match[1] ?? "s";
  const number = Number(match[2]);
  if (!Number.isFinite(number) || !CRICKET_TARGET_INDEX.has(number)) {
    return { targetKey: null, multiplier: 0 };
  }

  const multiplier = prefix === "d" ? 2 : prefix === "t" ? 3 : 1;
  return { targetKey: number, multiplier: multiplier as 0 | 1 | 2 | 3 };
}

export function encodeCricketDartNotation(input: string): number {
  const parsed = parseCricketDartNotation(input);
  if (!parsed.targetKey || parsed.multiplier === 0) {
    return 0;
  }

  const targetIndex = CRICKET_TARGET_INDEX.get(parsed.targetKey);
  if (targetIndex === undefined) {
    return 0;
  }

  return 1 + targetIndex * 3 + (parsed.multiplier - 1);
}

export function decodeCricketDartCode(code: number): string {
  if (code <= 0) {
    return "";
  }

  const normalized = code - 1;
  const targetIndex = Math.floor(normalized / 3);
  const multiplier = (normalized % 3) + 1;
  const target = CRICKET_TARGETS[targetIndex];

  if (!target) {
    return "";
  }

  const prefix = multiplier === 2 ? "D" : multiplier === 3 ? "T" : "S";
  return `${ prefix }${ target.roundKey === 25 ? 25 : target.roundKey }`;
}

export function encodeCricketTurn(darts: string[], sideIndex: CricketSideIndex): number {
  const [first, second, third] = [darts[0] ?? "", darts[1] ?? "", darts[2] ?? ""];
  const firstCode = encodeCricketDartNotation(first);
  const secondCode = encodeCricketDartNotation(second);
  const thirdCode = encodeCricketDartNotation(third);
  return 1 + (sideIndex * 32768) + firstCode + (secondCode * 32) + (thirdCode * 1024);
}

export function decodeCricketTurn(encodedValue: number): { sideIndex: CricketSideIndex; darts: string[] } {
  const normalized = Math.max(0, encodedValue - 1);
  const sideIndex = normalized >= 32768 ? 1 : 0;
  const payload = normalized % 32768;
  const firstCode = payload % 32;
  const secondCode = Math.floor(payload / 32) % 32;
  const thirdCode = Math.floor(payload / 1024) % 32;

  return {
    sideIndex: sideIndex as CricketSideIndex,
    darts: [
      decodeCricketDartCode(firstCode),
      decodeCricketDartCode(secondCode),
      decodeCricketDartCode(thirdCode),
    ],
  };
}

export function applyCricketTurn(
  board: CricketBoardState,
  sideIndex: CricketSideIndex,
  darts: string[]
): { boardAfter: CricketBoardState; scoreDelta: number } {
  const nextBoard = cloneCricketBoardState(board);
  const opponentIndex: CricketSideIndex = sideIndex === 0 ? 1 : 0;
  let scoreDelta = 0;

  for (const dart of darts) {
    const parsed = parseCricketDartNotation(dart);

    if (!parsed.targetKey || parsed.multiplier === 0) {
      continue;
    }

    const targetValue = parsed.targetKey === 25 ? 25 : parsed.targetKey;
    const marks = nextBoard.marksByTarget.get(parsed.targetKey) ?? [0, 0];
    const ownMarksBefore = marks[sideIndex];
    const opponentMarks = marks[opponentIndex];
    const hits = parsed.multiplier;
    const marksAdded = Math.min(hits, Math.max(0, 3 - ownMarksBefore));

    marks[sideIndex] = Math.min(3, ownMarksBefore + marksAdded);
    nextBoard.marksByTarget.set(parsed.targetKey, marks);

    if (opponentMarks < 3) {
      const scoringHits = Math.max(0, hits - marksAdded);
      if (scoringHits > 0) {
        const dartScore = scoringHits * targetValue;
        const bonuses = nextBoard.bonusByTarget.get(parsed.targetKey) ?? [0, 0];
        bonuses[sideIndex] += dartScore;
        nextBoard.bonusByTarget.set(parsed.targetKey, bonuses);
        nextBoard.scores[sideIndex] += dartScore;
        scoreDelta += dartScore;
      }
    }
  }

  return {
    boardAfter: nextBoard,
    scoreDelta,
  };
}

export function buildCricketBoardFromLedger(turns: CricketTurnLedgerEntry[]): CricketBoardState {
  let board = createEmptyCricketBoardState();

  for (const turn of turns) {
    board = cloneCricketBoardState(turn.boardAfter);
  }

  return board;
}

export function determineCricketWinner(board: CricketBoardState): CricketSideIndex | null {
  const isClosed = (sideIndex: CricketSideIndex) => CRICKET_TARGET_KEYS.every((targetKey) => {
    const marks = board.marksByTarget.get(targetKey) ?? [0, 0];
    return marks[sideIndex] >= 3;
  });

  if (isClosed(0) && board.scores[0] >= board.scores[1]) {
    return 0;
  }

  if (isClosed(1) && board.scores[1] >= board.scores[0]) {
    return 1;
  }

  return null;
}

export function buildCricketLedgerFromPersistedRounds(
  rounds: Array<{ roundNo: number; roundScore: number }>
) {
  const loadedLedger: CricketTurnLedgerEntry[] = [];
  const roundGroups = new Map<number, Array<{ roundNo: number; roundScore: number }>>();

  for (const roundRow of rounds) {
    const rows = roundGroups.get(roundRow.roundNo) ?? [];
    rows.push(roundRow);
    roundGroups.set(roundRow.roundNo, rows);
  }

  let board = createEmptyCricketBoardState();

  for (const turnNo of Array.from(roundGroups.keys()).sort((left, right) => left - right)) {
    const rows = roundGroups.get(turnNo) ?? [];
    const activeRow = rows.find((row) => row.roundScore > 0) ?? rows[0];

    if (!activeRow) {
      continue;
    }

    const decodedTurn = decodeCricketTurn(activeRow.roundScore);
    const applied = applyCricketTurn(board, decodedTurn.sideIndex, decodedTurn.darts);
    board = applied.boardAfter;
    loadedLedger.push({
      turnNo,
      sideIndex: decodedTurn.sideIndex,
      darts: decodedTurn.darts,
      encodedValue: activeRow.roundScore,
      scoreDelta: applied.scoreDelta,
      boardAfter: cloneCricketBoardState(board),
    });
  }

  return {
    ledger: loadedLedger,
    board,
  };
}