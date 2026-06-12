import { useMemo } from "react";
import { Archive, Play, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  GameMetadata,
  GameState,
} from "@/components/db/types/game-scoreboard";

interface GamesScoreboardToolbarProps {
  availableGames: GameMetadata[];
  selectedGameId: number | null;
  onSelectedGameChange: (value: string) => void;
  selectedGameTitleOption: string;
  onSelectedGameTitleChange: (value: string) => void;
  newGameOptionValue: string;
  gameStatesForSelectedMetadata: GameState[];
  hasSelectedGame: boolean;
  selectedGameState: GameState | null;
  isStartingGame: boolean;
  isLoadingSavedGame: boolean;
  isContinueGameHidden: boolean;
  isCricketGame: boolean;
  isAcquireGame: boolean;
  requestedVisiblePlayerColumns: number;
  isArchivingGame: boolean;
  hasRoundScoreEdits: boolean;
  isSavingGame: boolean;
  isDeletingGame: boolean;
  hasLoadedSavedGame: boolean;
  onStartOrContinueGame: () => void;
  onAddPlayerColumn: () => void;
  onArchiveSelectedGame: () => void;
  onSaveGame: () => void;
  onResetGameBoard: () => void;
  onDeleteSelectedGame: () => void;
}

export function GamesScoreboardToolbar({
  availableGames,
  selectedGameId,
  onSelectedGameChange,
  selectedGameTitleOption,
  onSelectedGameTitleChange,
  newGameOptionValue,
  gameStatesForSelectedMetadata,
  hasSelectedGame,
  selectedGameState,
  isStartingGame,
  isLoadingSavedGame,
  isContinueGameHidden,
  isCricketGame,
  isAcquireGame,
  requestedVisiblePlayerColumns,
  isArchivingGame,
  hasRoundScoreEdits,
  isSavingGame,
  isDeletingGame,
  hasLoadedSavedGame,
  onStartOrContinueGame,
  onAddPlayerColumn,
  onArchiveSelectedGame,
  onSaveGame,
  onResetGameBoard,
  onDeleteSelectedGame,
}: GamesScoreboardToolbarProps) {
  const sortedAvailableGames = useMemo(
    () => [...availableGames].sort((left, right) => left.name.localeCompare(right.name)),
    [availableGames]
  );

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <Select
        value={ selectedGameId ? String(selectedGameId) : "" }
        onValueChange={ onSelectedGameChange }
      >
        <SelectTrigger className="w-64 border-[#e8c4a0] bg-[#fffaf5] text-[#5c2e1a]">
          <SelectValue placeholder="Select a game..." />
        </SelectTrigger>
        <SelectContent>
          { sortedAvailableGames.map((game) => (
            <SelectItem key={ game.id } value={ String(game.id) }>
              { game.name }
            </SelectItem>
          )) }
        </SelectContent>
      </Select>

      <Select
        value={ selectedGameTitleOption }
        onValueChange={ onSelectedGameTitleChange }
        disabled={ !selectedGameId }
      >
        <SelectTrigger className="w-72 border-[#e8c4a0] bg-[#fffaf5] text-[#5c2e1a]">
          <SelectValue placeholder="Select game title..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ newGameOptionValue }>New Game</SelectItem>
          { gameStatesForSelectedMetadata.map((state) => (
            <SelectItem key={ state.id } value={ String(state.id) }>
              { state.gameTitle }
            </SelectItem>
          )) }
        </SelectContent>
      </Select>

      { !selectedGameState && (
        <Button
          onClick={ onStartOrContinueGame }
          disabled={ !hasSelectedGame || isStartingGame || isLoadingSavedGame }
          className="bg-[linear-gradient(135deg,#b76428,#df8a42)] text-white hover:bg-[linear-gradient(135deg,#9f5721,#c87934)]"
        >
          <Play className="mr-2 h-4 w-4" />
          { isStartingGame ? "Starting..." : "Start New Game" }
        </Button>
      ) }

      { selectedGameState?.status === "in_progress" && !isContinueGameHidden && (
        <Button
          onClick={ onStartOrContinueGame }
          disabled={ isLoadingSavedGame }
          className="bg-[linear-gradient(135deg,#b76428,#df8a42)] text-white hover:bg-[linear-gradient(135deg,#9f5721,#c87934)]"
        >
          <Play className="mr-2 h-4 w-4" />
          Continue Game
        </Button>
      ) }

      { !isCricketGame
        && isAcquireGame
        && selectedGameState?.status === "in_progress"
        && !isContinueGameHidden
        && requestedVisiblePlayerColumns < 8 && (
          <Button
            onClick={ onAddPlayerColumn }
            disabled={ isLoadingSavedGame }
            variant="outline"
            className="border-[#d8ab7f] bg-[#fff6ef] text-[#7b3306] hover:bg-[#ffefdf]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Player
          </Button>
        ) }

      { selectedGameState?.status === "completed" && (
        <Button
          onClick={ onArchiveSelectedGame }
          disabled={ isArchivingGame }
          variant="outline"
          className="border-[#d8ab7f] bg-[#fff6ef] text-[#7b3306] hover:bg-[#ffefdf]"
        >
          <Archive className="mr-2 h-4 w-4" />
          { isArchivingGame ? "Archiving..." : "Archive Game" }
        </Button>
      ) }

      { hasRoundScoreEdits && (
        <Button
          onClick={ onSaveGame }
          disabled={ !selectedGameState || isSavingGame }
          variant="outline"
          className="border-[#d8ab7f] bg-[#fff6ef] text-[#7b3306] hover:bg-[#ffefdf]"
        >
          <Save className="mr-2 h-4 w-4" />
          { isSavingGame ? "Saving..." : "Save Game" }
        </Button>
      ) }

      { selectedGameState?.status === "in_progress" && (
        <Button
          onClick={ onResetGameBoard }
          disabled={ isSavingGame || isLoadingSavedGame }
          variant="outline"
          className="border-[#d8ab7f] bg-[#fff6ef] text-[#7b3306] hover:bg-[#ffefdf]"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset Board
        </Button>
      ) }

      { selectedGameState && (
        <Button
          onClick={ onDeleteSelectedGame }
          disabled={ isDeletingGame || isSavingGame }
          variant="outline"
          className="border-[#e5b4b4] bg-[#fff5f5] text-[#9a2e2e] hover:bg-[#ffecec]"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          { isDeletingGame ? "Deleting..." : "Delete Game" }
        </Button>
      ) }

      { selectedGameState && hasLoadedSavedGame && (
        <span className="inline-flex items-center rounded-full border border-[#d8ab7f] bg-[#fff2e5] px-3 py-1 text-xs font-semibold text-[#8b5a3c]">
          Loaded from Saved Game
        </span>
      ) }
    </div>
  );
}
