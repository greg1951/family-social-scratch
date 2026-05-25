import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CricketFormat, SelectedPlayer } from "@/features/games/types/scoreboard-ui";
import {
  CRICKET_TARGETS,
  type CricketBoardState,
  type CricketSideIndex,
  type CricketTurnLedgerEntry,
} from "@/features/games/utils/cricket-rules";

type CricketSelectablePlayer = {
  id: number;
  firstName: string;
  lastName: string;
  isGuest: boolean;
};

interface GamesCricketPanelProps {
  selectedPlayers: Array<SelectedPlayer | null>;
  cricketFormat: CricketFormat;
  orderedSelectablePlayers: CricketSelectablePlayer[];
  getPlayerOptionLabel: (player: CricketSelectablePlayer) => string;
  clearPlayerOptionValue: string;
  addGuestOptionValue: string;
  cricketTurnDarts: string[];
  cricketTurnLedger: CricketTurnLedgerEntry[];
  cricketBoardState: CricketBoardState;
  cricketWinnerSideIndex: CricketSideIndex | null;
  cricketActiveSideIndex: CricketSideIndex;
  isSubmittingCricketTurn: boolean;
  scoreStyleByColumn: Map<number, string>;
  onSetCricketFormat: (value: CricketFormat) => void;
  onSetCricketPlayerSlot: (slotIndex: number, value: string) => void;
  onSetCricketTurnDart: (index: number, value: string) => void;
  onSubmitCricketTurn: () => void;
  onResetBoard: () => void;
}

export function GamesCricketPanel({
  selectedPlayers,
  cricketFormat,
  orderedSelectablePlayers,
  getPlayerOptionLabel,
  clearPlayerOptionValue,
  addGuestOptionValue,
  cricketTurnDarts,
  cricketTurnLedger,
  cricketBoardState,
  cricketWinnerSideIndex,
  cricketActiveSideIndex,
  isSubmittingCricketTurn,
  scoreStyleByColumn,
  onSetCricketFormat,
  onSetCricketPlayerSlot,
  onSetCricketTurnDart,
  onSubmitCricketTurn,
  onResetBoard,
}: GamesCricketPanelProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-[1.6rem] border border-[#f0d9c4] bg-[#fffaf5] p-5 shadow-[0_16px_45px_-32px_rgba(96,52,20,0.55)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Cricket Turn Ledger</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-[#5c2e1a]">{ cricketWinnerSideIndex !== null ? `Side ${ cricketWinnerSideIndex + 1 } wins` : `Side ${ cricketActiveSideIndex + 1 } to throw` }</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8b5a3c]">
              Enter the 3 darts for the current turn. The board, closure marks, and scoring totals update automatically.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[#e8c4a0] bg-white px-3 py-1 text-xs font-semibold text-[#8b5a3c]">Side 1: { cricketBoardState.scores[0] }</span>
            <span className="rounded-full border border-[#e8c4a0] bg-white px-3 py-1 text-xs font-semibold text-[#8b5a3c]">Side 2: { cricketBoardState.scores[1] }</span>
          </div>
        </div>

        <div className="mt-5 space-y-4 rounded-xl border border-[#f0d9c4] bg-white p-4">
          <div className="space-y-1 md:max-w-56">
            <Label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a85a3a]">Format</Label>
            <Select value={ cricketFormat } onValueChange={ (value) => onSetCricketFormat(value as CricketFormat) }>
              <SelectTrigger className="w-full border-[#e8c4a0] bg-white text-[#5c2e1a]">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="singles">Singles</SelectItem>
                <SelectItem value="doubles">Doubles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            { [0, 1].map((sideIndex) => {
              const player = selectedPlayers[sideIndex];
              const partner = selectedPlayers[sideIndex + 2];

              return (
                <div key={ `cricket-side-team-${ sideIndex }` } className="space-y-3 rounded-xl border border-[#f0d9c4] bg-[#fffaf5] p-3">
                  <Label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a85a3a]">Side { sideIndex + 1 } Team</Label>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a85a3a]">Primary Player</Label>
                    <Select
                      value={ player ? String(player.id) : "" }
                      onValueChange={ (value) => onSetCricketPlayerSlot(sideIndex, value) }
                    >
                      <SelectTrigger className="w-full border-[#e8c4a0] bg-white text-[#5c2e1a]">
                        <SelectValue placeholder={ `Select Side ${ sideIndex + 1 } Player` } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ clearPlayerOptionValue } disabled={ !player }>
                          Unselect player
                        </SelectItem>
                        <SelectItem value={ addGuestOptionValue }>
                          + Add a guest
                        </SelectItem>
                        { orderedSelectablePlayers.map((member) => {
                          const selectedInOtherSlot = selectedPlayers.some(
                            (existingPlayer, existingIdx) => existingIdx !== sideIndex && existingPlayer?.id === member.id
                          );

                          return (
                            <SelectItem
                              key={ `cricket-primary-${ sideIndex }-${ member.id }` }
                              value={ String(member.id) }
                              disabled={ selectedInOtherSlot }
                            >
                              { getPlayerOptionLabel(member) }
                            </SelectItem>
                          );
                        }) }
                      </SelectContent>
                    </Select>
                  </div>

                  { cricketFormat === "doubles" && (
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a85a3a]">Partner</Label>
                      <Select
                        value={ partner ? String(partner.id) : "" }
                        onValueChange={ (value) => onSetCricketPlayerSlot(sideIndex + 2, value) }
                      >
                        <SelectTrigger className="w-full border-[#e8c4a0] bg-white text-[#5c2e1a]">
                          <SelectValue placeholder={ `Select Side ${ sideIndex + 1 } Partner` } />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ clearPlayerOptionValue } disabled={ !partner }>
                            Unselect player
                          </SelectItem>
                          <SelectItem value={ addGuestOptionValue }>
                            + Add a guest
                          </SelectItem>
                          { orderedSelectablePlayers.map((member) => {
                            const selectedInOtherSlot = selectedPlayers.some(
                              (existingPlayer, existingIdx) => existingIdx !== sideIndex + 2 && existingPlayer?.id === member.id
                            );

                            return (
                              <SelectItem
                                key={ `cricket-partner-${ sideIndex }-${ member.id }` }
                                value={ String(member.id) }
                                disabled={ selectedInOtherSlot }
                              >
                                { getPlayerOptionLabel(member) }
                              </SelectItem>
                            );
                          }) }
                        </SelectContent>
                      </Select>
                    </div>
                  ) }
                </div>
              );
            }) }
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          { cricketTurnDarts.map((dart, index) => (
            <div key={ `cricket-dart-${ index }` } className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a85a3a]">Dart { index + 1 }</Label>
              <Input
                value={ dart }
                onChange={ (event) => onSetCricketTurnDart(index, event.target.value) }
                placeholder="S20, D18, T20, miss"
                className="border-[#e8c4a0] bg-white text-[#5c2e1a]"
                disabled={ cricketWinnerSideIndex !== null }
              />
            </div>
          )) }
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={ onSubmitCricketTurn }
            disabled={ cricketWinnerSideIndex !== null || isSubmittingCricketTurn }
            className="bg-[linear-gradient(135deg,#b76428,#df8a42)] text-white hover:bg-[linear-gradient(135deg,#9f5721,#c87934)]"
          >
            { isSubmittingCricketTurn ? "Submitting..." : "Submit Turn" }
          </Button>
          <Button
            type="button"
            onClick={ onResetBoard }
            disabled={ isSubmittingCricketTurn }
            variant="outline"
            className="border-[#d8ab7f] bg-[#fff6ef] text-[#7b3306] hover:bg-[#ffefdf]"
          >
            <RotateCcw className="mr-2 size-4" />
            Reset Board
          </Button>
        </div>
      </div>

      <table className="w-full min-w-208 table-fixed border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-32 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-[#a85a3a]">Side 1 Bonus</th>
            <th className="w-40 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-[#a85a3a]">Side 1 Marks</th>
            <th className="w-24 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-center font-black text-[#5c2e1a]">Target</th>
            <th className="w-40 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-[#a85a3a]">Side 2 Marks</th>
            <th className="w-32 border border-[#f0d9c4] bg-[#fff6ef] p-2 text-[#a85a3a]">Side 2 Bonus</th>
          </tr>
        </thead>
        <tbody>
          { CRICKET_TARGETS.map((target) => {
            const marks = cricketBoardState.marksByTarget.get(target.roundKey) ?? [0, 0];
            const bonuses = cricketBoardState.bonusByTarget.get(target.roundKey) ?? [0, 0];
            const side1MarkDisplay = marks[0] === 0 ? "" : marks[0] === 1 ? "/" : marks[0] === 2 ? "X" : "O";
            const side2MarkDisplay = marks[1] === 0 ? "" : marks[1] === 1 ? "/" : marks[1] === 2 ? "X" : "O";

            return (
              <tr key={ `cricket-board-${ target.roundKey }` }>
                <td className="border border-[#f0d9c4] bg-white p-2 text-center font-semibold text-[#8b5a3c]">{ bonuses[0] || "-" }</td>
                <td className="border border-[#f0d9c4] bg-white p-2 text-center">
                  <span className="inline-flex min-w-8 justify-center rounded-full bg-[#fff6ef] px-2 py-1 text-sm font-black text-[#7b3306]">{ side1MarkDisplay || "-" }</span>
                </td>
                <td className="border border-[#f0d9c4] bg-[#fff8f2] p-2 text-center font-black text-[#8b5a3c]">{ target.label }</td>
                <td className="border border-[#f0d9c4] bg-white p-2 text-center">
                  <span className="inline-flex min-w-8 justify-center rounded-full bg-[#fff6ef] px-2 py-1 text-sm font-black text-[#7b3306]">{ side2MarkDisplay || "-" }</span>
                </td>
                <td className="border border-[#f0d9c4] bg-white p-2 text-center font-semibold text-[#8b5a3c]">{ bonuses[1] || "-" }</td>
              </tr>
            );
          }) }
          <tr>
            <td className={ `border border-[#f0d9c4] bg-[#fff6ef] p-2 text-center font-bold text-[#5c2e1a] ${ scoreStyleByColumn.get(0) ?? "" }` } colSpan={ 2 }>
              Side 1 Total: { cricketBoardState.scores[0] }
            </td>
            <td className="border border-[#f0d9c4] bg-[#fff6ef] p-2 text-center text-xs font-semibold text-[#a85a3a]">Totals</td>
            <td className={ `border border-[#f0d9c4] bg-[#fff6ef] p-2 text-center font-bold text-[#5c2e1a] ${ scoreStyleByColumn.get(1) ?? "" }` } colSpan={ 2 }>
              Side 2 Total: { cricketBoardState.scores[1] }
            </td>
          </tr>
        </tbody>
      </table>

      <div className="rounded-[1.6rem] border border-[#f0d9c4] bg-white p-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Turn History</p>
        <div className="mt-3 space-y-2">
          { cricketTurnLedger.length > 0 ? cricketTurnLedger.slice().reverse().map((turn) => (
            <div key={ `cricket-turn-${ turn.turnNo }` } className="rounded-xl border border-[#f0d9c4] bg-[#fffaf5] p-3 text-sm text-[#5c2e1a]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">Turn { turn.turnNo } - Side { turn.sideIndex + 1 }</span>
                <span className="text-[#8b5a3c]">+{ turn.scoreDelta } points</span>
              </div>
              <p className="mt-1 text-[#8b5a3c]">{ turn.darts.map((dart) => dart || "miss").join(", ") }</p>
            </div>
          )) : (
            <p className="text-sm text-[#8b5a3c]">No turns entered yet.</p>
          ) }
        </div>
      </div>
    </div>
  );
}
