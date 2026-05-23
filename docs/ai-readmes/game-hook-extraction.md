1. [Game Scoreboard Hook Extraction Plan](#game-scoreboard-hook-extraction-plan)
   1. [Goal](#goal)
   2. [Proposed Target Shape](#proposed-target-shape)
   3. [Extraction Principles](#extraction-principles)
   4. [Proposed Hooks](#proposed-hooks)
      1. [1. `useGameBoardSession`](#1-usegameboardsession)
      2. [2. `useGameLifecycleActions`](#2-usegamelifecycleactions)
      3. [3. `useCricketScoreboard`](#3-usecricketscoreboard)
      4. [4. `useCrokinoleScoreboard`](#4-usecrokinolescoreboard)
      5. [5. `useGameHistoryInsights`](#5-usegamehistoryinsights)
   5. [Recommended Supporting Pure Modules](#recommended-supporting-pure-modules)
      1. [`game-scoreboard-helpers`](#game-scoreboard-helpers)
      2. [`cricket-rules`](#cricket-rules)
      3. [`history-leaderboard-helpers`](#history-leaderboard-helpers)
   6. [Suggested Extraction Order](#suggested-extraction-order)
      1. [Phase 1: Lowest risk, highest payoff](#phase-1-lowest-risk-highest-payoff)
      2. [Phase 2: Core scoreboard session](#phase-2-core-scoreboard-session)
      3. [Phase 3: Domain game hooks](#phase-3-domain-game-hooks)
      4. [Phase 4: Async orchestration](#phase-4-async-orchestration)
   7. [Proposed Final Page Responsibilities](#proposed-final-page-responsibilities)
   8. [Example Composition Sketch](#example-composition-sketch)
   9. [Key Risks To Watch](#key-risks-to-watch)
   10. [Expected Benefits](#expected-benefits)
   11. [Success Criteria](#success-criteria)

The plan is grounded in src/features/games/components/games-home-page.tsx, especially the state block near the top, the lifecycle handlers around games-home-page.tsx, games-home-page.tsx, games-home-page.tsx, and the history/leaderboard derivations at games-home-page.tsx and games-home-page.tsx.

# Game Scoreboard Hook Extraction Plan

## Goal

Reduce the size and maintenance cost of the Game Scoreboard home page by separating:

- scoreboard session state
- server-action lifecycle orchestration
- Cricket-specific rules and turn state
- Crokinole-specific team and winner state
- history and leaderboard derivation

The current page mixes all of those concerns in one component, which makes changes riskier and increases duplication around reset, load, and save flows.

## Proposed Target Shape

The page component should become mostly composition:

- page layout and JSX
- small view-local formatting helpers
- wiring between hooks and child sections

The extracted hooks should own the behavior.

## Extraction Principles

- Keep pure scoring rules as plain functions, not hooks.
- Extract one concern at a time.
- Move duplicated reset/load/save logic before moving cosmetic JSX.
- Prefer hooks that return a small public API over hooks that expose raw setters everywhere.

## Proposed Hooks

### 1. `useGameBoardSession`

Own the generic scoreboard session state that is currently spread across the top of the component.

#### Responsibilities

- selected game metadata and selected saved game title
- selected players
- round scores
- persisted cumulative scores
- visible player column tracking
- shared board reset logic
- shared player assignment and clearing logic
- local selectable players list
- derived helpers for visible columns and cumulative scores

#### State to own

- `selectedGameId`
- `selectedGameState`
- `selectedGameTitleOption`
- `selectedPlayers`
- `roundScores`
- `persistedCumulativeScores`
- `hasRoundScoreEdits`
- `requestedVisiblePlayerColumns`
- `localSelectablePlayers`

#### Derived values to produce

- `selectedGame`
- `isCricketGame`
- `isCrokinoleGame`
- `isAcquireGame`
- `isMexicanTrainGame`
- `orderedSelectablePlayers`
- `gameStatesForSelectedMetadata`
- `roundEntries`
- `visiblePlayerColumnIndices`
- `computedCumulativeScores`
- `cumulativeScores`
- `displayedScores`
- `getScoreStyle`

#### Commands to produce

- `selectGame(gameId: number): void`
- `selectSavedGameOption(value: string): void`
- `setRoundScore(roundKey: number, colIndex: number, value: string): void`
- `clearPlayerColumn(colIndex: number): void`
- `setPlayerSlot(colIndex: number, memberId: number): void`
- `addPlayerColumn(): void`
- `resetForNewGameMode(): void`
- `resetBoardForCurrentGame(): void`
- `replaceSelectablePlayers(players): void`
- `mergeSelectablePlayers(players): void`
- `applyLoadedStandardGame(payload): void`

#### Proposed signature

```ts
type UseGameBoardSessionArgs = {
  gamesData: GamesPageData;
};

type UseGameBoardSessionResult = {
  selectedGameId: number | null;
  selectedGameState: GameState | null;
  selectedGameTitleOption: string;
  selectedPlayers: (SelectedPlayer | null)[];
  roundScores: Map<number, Map<number, number>>;
  persistedCumulativeScores: Map<number, number> | null;
  hasRoundScoreEdits: boolean;
  requestedVisiblePlayerColumns: number;
  localSelectablePlayers: GamesPageData["selectablePlayers"];

  selectedGame: GamesPageData["availableGames"][number] | null;
  isCricketGame: boolean;
  isCrokinoleGame: boolean;
  isAcquireGame: boolean;
  isMexicanTrainGame: boolean;
  orderedSelectablePlayers: GamesPageData["selectablePlayers"];
  gameStatesForSelectedMetadata: GameState[];
  roundEntries: Array<{ roundKey: number; roundNo: number; label: string }>;
  visiblePlayerColumnIndices: number[];
  cumulativeScores: Map<number, number>;
  displayedScores: number[];

  setSelectedGameState: (state: GameState | null) => void;
  setSelectedGameTitleOption: (value: string) => void;
  setGameRoundScores: (scores: Map<number, Map<number, number>>) => void;
  setSelectedPlayers: React.Dispatch<React.SetStateAction<(SelectedPlayer | null)[]>>;
  setPersistedCumulativeScores: (scores: Map<number, number> | null) => void;
  setHasRoundScoreEdits: (value: boolean) => void;
  setRequestedVisiblePlayerColumns: (value: number) => void;
  setLocalSelectablePlayers: React.Dispatch<React.SetStateAction<GamesPageData["selectablePlayers"]>>;

  selectGame: (gameId: number) => void;
  selectSavedGameOption: (value: string) => void;
  setRoundScore: (roundKey: number, colIndex: number, value: string) => void;
  setPlayerSlot: (slotIndex: number, memberId: number) => void;
  clearPlayerColumn: (colIndex: number) => void;
  addPlayerColumn: () => void;
  resetForNewGameMode: () => void;
  resetBoardForCurrentGame: () => void;
  getScoreStyle: (colIndex: number) => string;
};
```

#### Why this is first

This removes the most duplicated logic with the least domain risk. It also gives the later hooks one stable owner for generic scoreboard state.

---

### 2. `useGameLifecycleActions`

Own all async server-action workflows.

#### Responsibilities

- start game
- save game
- load saved game
- archive completed game
- delete game
- guest creation
- transition loading flags
- toasts and router refresh behavior

#### State to own

- `isStartDialogOpen`
- `gameTitleInput`
- `isStartingGame`
- `isSavingGame`
- `isLoadingSavedGame`
- `isArchivingGame`
- `isDeletingGame`
- `isGuestDialogOpen`
- `guestDialogColIndex`
- `guestFirstName`
- `guestLastName`
- `guestEmail`
- `isAddingGuest`
- `isContinueGameHidden`

#### Commands to produce

- `openStartDialog(): void`
- `closeStartDialog(): void`
- `startOrContinueGame(): void`
- `confirmStartGame(): Promise<void>`
- `saveGame(): Promise<void>`
- `loadPersistedGame(gameId: number): Promise<void>`
- `archiveSelectedGame(): Promise<void>`
- `deleteSelectedGame(): Promise<void>`
- `openGuestDialog(slotIndex: number): void`
- `closeGuestDialog(): void`
- `addGuest(): Promise<void>`
- `formatGameTitleWithDate(title: string): string`

#### Proposed signature

```ts
type UseGameLifecycleActionsArgs = {
  familyId: number;
  memberId: number;
  router: ReturnType<typeof useRouter>;
  scoreboardGridRef: React.RefObject<HTMLDivElement | null>;

  boardSession: Pick<
    UseGameBoardSessionResult,
    | "selectedGame"
    | "selectedGameId"
    | "selectedGameState"
    | "selectedGameTitleOption"
    | "selectedPlayers"
    | "roundScores"
    | "roundEntries"
    | "cumulativeScores"
    | "hasRoundScoreEdits"
    | "isCricketGame"
    | "isCrokinoleGame"
    | "setSelectedGameState"
    | "setSelectedGameTitleOption"
    | "setSelectedPlayers"
    | "setGameRoundScores"
    | "setPersistedCumulativeScores"
    | "setHasRoundScoreEdits"
    | "setRequestedVisiblePlayerColumns"
    | "setLocalSelectablePlayers"
    | "resetForNewGameMode"
  >;

  cricket: {
    cricketTurnLedger: CricketTurnLedgerEntry[];
    cricketWinnerSideIndex: CricketSideIndex | null;
    resetCricketState: () => void;
    loadCricketFromScoreboard: (scoreboard: LoadedScoreboard) => {
      loadedPlayers: (SelectedPlayer | null)[];
      ledger: CricketTurnLedgerEntry[];
      scores: Map<number, number>;
    };
  };

  crokinole: {
    crokinoleFormat: CrokinoleFormat;
    crokinoleTeamNames: [string, string];
    crokinoleWinnerTeamIndex: 0 | 1 | null;
    crokinoleFinalRoundNo: number | null;
    resetCrokinoleState: () => void;
    inferFormatFromPlayers: (players: (SelectedPlayer | null)[]) => CrokinoleFormat;
  };
};

type UseGameLifecycleActionsResult = {
  gameTitleInput: string;
  isStartDialogOpen: boolean;
  isStartingGame: boolean;
  isSavingGame: boolean;
  isLoadingSavedGame: boolean;
  isArchivingGame: boolean;
  isDeletingGame: boolean;
  isGuestDialogOpen: boolean;
  guestDialogColIndex: number | null;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  isAddingGuest: boolean;
  isContinueGameHidden: boolean;

  setGameTitleInput: (value: string) => void;
  setGuestFirstName: (value: string) => void;
  setGuestLastName: (value: string) => void;
  setGuestEmail: (value: string) => void;
  setIsContinueGameHidden: (value: boolean) => void;

  formatGameTitleWithDate: (title: string) => string;
  openStartDialog: () => void;
  closeStartDialog: () => void;
  startOrContinueGame: () => void;
  confirmStartGame: () => Promise<void>;
  saveGame: () => Promise<void>;
  loadPersistedGame: (gameId: number) => Promise<void>;
  openGuestDialog: (slotIndex: number) => void;
  closeGuestDialog: () => void;
  addGuest: () => Promise<void>;
  archiveSelectedGame: () => Promise<void>;
  deleteSelectedGame: () => Promise<void>;
};
```

#### Why this is second

This isolates the action orchestration from rendering. It also removes the highest-volume handlers from the page.

---

### 3. `useCricketScoreboard`

Own Cricket-only state and behavior.

#### Responsibilities

- turn ledger
- active side
- current turn darts
- winner detection
- board reconstruction
- loading Cricket from persisted scoreboard rows
- encoding and decoding turns
- turn submission flow
- Cricket reset behavior

#### State to own

- `cricketTurnLedger`
- `cricketTurnDarts`
- `isSubmittingCricketTurn`

#### Derived values to produce

- `cricketBoardState`
- `cricketWinnerSideIndex`
- `cricketActiveSideIndex`
- `cricketActiveSidePlayer`

#### Commands to produce

- `setCricketSidePlayer(sideIndex, value): void`
- `setCricketTurnDart(index, value): void`
- `submitCricketTurn(): void`
- `resetCricketState(): void`
- `loadCricketFromScoreboard(scoreboard): LoadedCricketState`

#### Proposed signature

```ts
type UseCricketScoreboardArgs = {
  enabled: boolean;
  selectedPlayers: (SelectedPlayer | null)[];
  setSelectedPlayers: React.Dispatch<React.SetStateAction<(SelectedPlayer | null)[]>>;
  selectablePlayers: GamesPageData["selectablePlayers"];
  markBoardEdited: () => void;
  clearPersistedScores: () => void;
  onOpenGuestDialog: (slotIndex: number) => void;
  onClearPlayerColumn: (colIndex: number) => void;
};

type UseCricketScoreboardResult = {
  cricketTurnLedger: CricketTurnLedgerEntry[];
  cricketTurnDarts: string[];
  isSubmittingCricketTurn: boolean;

  cricketBoardState: CricketBoardState;
  cricketWinnerSideIndex: CricketSideIndex | null;
  cricketActiveSideIndex: CricketSideIndex;
  cricketActiveSidePlayer: SelectedPlayer | null;

  setCricketTurnDart: (index: number, value: string) => void;
  setCricketSidePlayer: (sideIndex: CricketSideIndex, value: string) => void;
  submitCricketTurn: () => void;
  resetCricketState: () => void;
  loadCricketFromScoreboard: (scoreboard: LoadedScoreboard) => {
    loadedPlayers: (SelectedPlayer | null)[];
    ledger: CricketTurnLedgerEntry[];
    cumulativeScores: Map<number, number>;
  };
};
```

#### Important note

The following should stay outside the hook in a plain domain module:

- `parseCricketDartNotation`
- `encodeCricketDartNotation`
- `decodeCricketDartCode`
- `encodeCricketTurn`
- `decodeCricketTurn`
- `applyCricketTurn`
- `buildCricketBoardFromLedger`
- `determineCricketWinner`

That keeps the rules testable without React.

---

### 4. `useCrokinoleScoreboard`

Own Crokinole-only state and behavior.

#### Responsibilities

- format selection
- team names
- team readiness
- winner detection
- final round trimming after winner
- Crokinole-specific player slot assignment
- round winner styling
- scoring enablement rules
- reset and load normalization

#### State to own

- `crokinoleFormat`
- `crokinoleTeamNames`

#### Derived values to produce

- `crokinoleWinnerTeamIndex`
- `crokinoleFinalRoundNo`
- `displayedRoundEntries`
- `isCrokinoleScoringEnabled`

#### Commands to produce

- `setCrokinolePlayerSlot(slotIndex, value): void`
- `setCrokinoleFormat(value): void`
- `setCrokinoleTeamName(teamIndex, value): void`
- `resetCrokinoleState(): void`
- `inferFormatFromPlayers(players): CrokinoleFormat`
- `getRoundWinnerStyle(roundKey, colIndex): string`

#### Proposed signature

```ts
type UseCrokinoleScoreboardArgs = {
  enabled: boolean;
  selectedPlayers: (SelectedPlayer | null)[];
  setSelectedPlayers: React.Dispatch<React.SetStateAction<(SelectedPlayer | null)[]>>;
  roundEntries: Array<{ roundKey: number; roundNo: number; label: string }>;
  roundScores: Map<number, Map<number, number>>;
  cumulativeScores: Map<number, number>;
  selectablePlayers: GamesPageData["selectablePlayers"];
  onOpenGuestDialog: (slotIndex: number) => void;
  onClearPlayerColumn: (colIndex: number) => void;
};

type UseCrokinoleScoreboardResult = {
  crokinoleFormat: CrokinoleFormat;
  crokinoleTeamNames: [string, string];
  crokinoleWinnerTeamIndex: 0 | 1 | null;
  crokinoleFinalRoundNo: number | null;
  displayedRoundEntries: Array<{ roundKey: number; roundNo: number; label: string }>;
  isCrokinoleScoringEnabled: boolean;

  setCrokinoleFormat: (value: CrokinoleFormat) => void;
  setCrokinoleTeamName: (teamIndex: 0 | 1, value: string) => void;
  setCrokinolePlayerSlot: (slotIndex: number, value: string) => void;
  resetCrokinoleState: () => void;
  inferFormatFromPlayers: (players: (SelectedPlayer | null)[]) => CrokinoleFormat;
  getRoundWinnerStyle: (roundKey: number, colIndex: number) => string;
};
```

---

### 5. `useGameHistoryInsights`

Own right-panel filter state and derived history/leaderboard data.

#### Responsibilities

- filter state
- unique filter option lists
- filtered game history
- grouped history by date and game id
- derived leaderboard stats for selected game type

#### State to own

- `gameStatusFilter`
- `gameDateFilter`
- `gameTitleFilter`

#### Derived values to produce

- `uniqueStatuses`
- `uniqueDates`
- `uniqueTitles`
- `filteredGameHistory`
- `groupedGameHistory`
- `gameLeaderboards`

#### Commands to produce

- `setGameStatusFilter`
- `setGameDateFilter`
- `setGameTitleFilter`

#### Proposed signature

```ts
type UseGameHistoryInsightsArgs = {
  gamesData: GamesPageData;
  selectedGameId: number | null;
  selectedGame: GamesPageData["availableGames"][number] | null;
};

type UseGameHistoryInsightsResult = {
  gameStatusFilter: string;
  gameDateFilter: string;
  gameTitleFilter: string;

  setGameStatusFilter: (value: string) => void;
  setGameDateFilter: (value: string) => void;
  setGameTitleFilter: (value: string) => void;

  uniqueStatuses: string[];
  uniqueDates: string[];
  uniqueTitles: string[];

  filteredGameHistory: GameHistoryRow[];
  groupedGameHistory: Map<string, Map<number, GameHistoryRow[]>>;
  gameLeaderboards: {
    lowScore: {
      playerFirstName: string;
      playerLastName: string;
      gameScore: number;
      gameStartDate: string;
    } | null;
    highScore: {
      playerFirstName: string;
      playerLastName: string;
      gameScore: number;
      gameStartDate: string;
    } | null;
    playerStats: Array<{
      playerFirstName: string;
      playerLastName: string;
      gamesPlayed: number;
      gamesWon: number;
      gamesLost: number;
    }>;
  };
};
```

#### Why this is separate

This concern does not need to know anything about dialog state, turn ledgers, or scoreboard input. Separating it reduces mental load immediately.

---

## Recommended Supporting Pure Modules

Not every extraction should be a hook.

### `game-scoreboard-helpers`

Move generic pure logic here:

- round entry builders
- visible player column calculation
- cumulative score calculation
- score-style calculation
- player label formatting
- save-status determination for non-Cricket and non-Crokinole games

### `cricket-rules`

Move Cricket pure logic here:

- dart parsing
- turn encoding and decoding
- board application
- winner detection
- board reconstruction

### `history-leaderboard-helpers`

Move history grouping and leaderboard derivation here.

This will keep the hooks thin and reduce hook unit test setup.

---

## Suggested Extraction Order

### Phase 1: Lowest risk, highest payoff

Extract:

- `useGameHistoryInsights`
- pure helper modules for history and score calculations

This reduces file size quickly without disturbing save/load flows.

### Phase 2: Core scoreboard session

Extract:

- `useGameBoardSession`

This centralizes shared state and removes repeated reset logic.

### Phase 3: Domain game hooks

Extract:

- `useCricketScoreboard`
- `useCrokinoleScoreboard`

This removes the biggest conditional branches from the page body.

### Phase 4: Async orchestration

Extract:

- `useGameLifecycleActions`

Do this after the other hooks exist so lifecycle code can compose against stable APIs instead of raw local setters.

---

## Proposed Final Page Responsibilities

After extraction, the page should mainly do this:

- create `router` and `scoreboardGridRef`
- instantiate the hooks
- connect hook outputs to the JSX
- pass focused props into child sections

At that point, the main page should read more like composition than implementation.

---

## Example Composition Sketch

```ts
export function GamesHomePage(props: GamesHomePageProps) {
  const router = useRouter();
  const scoreboardGridRef = useRef<HTMLDivElement | null>(null);

  const boardSession = useGameBoardSession({
    gamesData: props.gamesData,
  });

  const cricket = useCricketScoreboard({
    enabled: boardSession.isCricketGame,
    selectedPlayers: boardSession.selectedPlayers,
    setSelectedPlayers: boardSession.setSelectedPlayers,
    selectablePlayers: boardSession.localSelectablePlayers,
    markBoardEdited: () => boardSession.setHasRoundScoreEdits(true),
    clearPersistedScores: () => boardSession.setPersistedCumulativeScores(null),
    onOpenGuestDialog: lifecycle.openGuestDialog,
    onClearPlayerColumn: boardSession.clearPlayerColumn,
  });

  const crokinole = useCrokinoleScoreboard({
    enabled: boardSession.isCrokinoleGame,
    selectedPlayers: boardSession.selectedPlayers,
    setSelectedPlayers: boardSession.setSelectedPlayers,
    roundEntries: boardSession.roundEntries,
    roundScores: boardSession.roundScores,
    cumulativeScores: boardSession.cumulativeScores,
    selectablePlayers: boardSession.localSelectablePlayers,
    onOpenGuestDialog: lifecycle.openGuestDialog,
    onClearPlayerColumn: boardSession.clearPlayerColumn,
  });

  const history = useGameHistoryInsights({
    gamesData: props.gamesData,
    selectedGameId: boardSession.selectedGameId,
    selectedGame: boardSession.selectedGame,
  });

  const lifecycle = useGameLifecycleActions({
    familyId: props.familyId,
    memberId: props.memberId,
    router,
    scoreboardGridRef,
    boardSession,
    cricket,
    crokinole,
  });

  return (
    // layout only
  );
}
```

---

## Key Risks To Watch

- Over-exposing raw setters from hooks can recreate the same coupling under a different name.
- A single lifecycle hook can become too large if it owns business rules that should live in Cricket or Crokinole hooks.
- Hooks that both derive state and mutate remote data can become hard to test; keep derivation in pure helpers when possible.
- Avoid circular dependencies between lifecycle, session, and game-specific hooks.

---

## Expected Benefits

- smaller page component
- fewer duplicated reset sequences
- clearer separation between generic scoreboard behavior and game-specific rules
- easier unit testing of scoring and leaderboard logic
- safer changes to Cricket and Crokinole without touching unrelated history or dialog code
- easier future extraction of child presentational sections

## Success Criteria

The extraction is successful when:

- the main page primarily wires hooks into JSX
- Cricket rules no longer sit beside leaderboard filtering logic
- load/save/archive/delete flows are isolated from render-heavy markup
- reset logic exists in one place per concern
- game-specific changes can usually be made in one hook or one helper module
```

If you want, the next useful step is either:
1. I can turn this into a phased implementation checklist with exact “move these lines into this hook” guidance.
2. I can draft the first hook in detail, starting with `useGameBoardSession`, including the internal reducer/state shape and the minimal API I would keep public.