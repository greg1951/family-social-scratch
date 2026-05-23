import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CrokinoleFormat, SelectedPlayer } from "@/features/games/types/scoreboard-ui";

type CrokinoleSelectablePlayer = {
  id: number;
  firstName: string;
  lastName: string;
  isGuest: boolean;
};

interface GamesCrokinoleSetupProps {
  isVisible: boolean;
  crokinoleFormat: CrokinoleFormat;
  crokinoleTeamNames: [string, string];
  crokinoleWinnerTeamIndex: 0 | 1 | null;
  crokinoleWinScore: number;
  selectedPlayers: Array<SelectedPlayer | null>;
  orderedSelectablePlayers: CrokinoleSelectablePlayer[];
  clearPlayerOptionValue: string;
  addGuestOptionValue: string;
  getPlayerOptionLabel: (player: CrokinoleSelectablePlayer) => string;
  onSetFormat: (format: CrokinoleFormat) => void;
  onSetTeamName: (teamIndex: 0 | 1, value: string) => void;
  onSetPlayerSlot: (slotIndex: number, value: string) => void;
}

export function GamesCrokinoleSetup({
  isVisible,
  crokinoleFormat,
  crokinoleTeamNames,
  crokinoleWinnerTeamIndex,
  crokinoleWinScore,
  selectedPlayers,
  orderedSelectablePlayers,
  clearPlayerOptionValue,
  addGuestOptionValue,
  getPlayerOptionLabel,
  onSetFormat,
  onSetTeamName,
  onSetPlayerSlot,
}: GamesCrokinoleSetupProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="mb-5 rounded-[1.2rem] border border-[#f0d9c4] bg-[#fffaf5] p-4">
      { crokinoleWinnerTeamIndex !== null && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Winner declared: { crokinoleTeamNames[crokinoleWinnerTeamIndex] || `Team ${ crokinoleWinnerTeamIndex + 1 }` } reached { crokinoleWinScore }+.
        </div>
      ) }
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a85a3a]">Format</Label>
          <Select
            value={ crokinoleFormat }
            onValueChange={ (value) => onSetFormat(value as CrokinoleFormat) }
          >
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
          { [0, 1].map((teamIndex) => (
            <div key={ `crokinole-team-${ teamIndex }` } className="space-y-2 rounded-xl border border-[#f0d9c4] bg-white p-3">
              <Label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a85a3a]">Team { teamIndex + 1 } Name</Label>
              <Input
                value={ crokinoleTeamNames[teamIndex] }
                onChange={ (event) => onSetTeamName(teamIndex as 0 | 1, event.target.value) }
                className="border-[#e8c4a0] bg-[#fffaf5] text-[#5c2e1a]"
                placeholder={ `Team ${ teamIndex + 1 }` }
              />

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a85a3a]">Primary Player</Label>
                <Select
                  value={ selectedPlayers[teamIndex] ? String(selectedPlayers[teamIndex]?.id) : "" }
                  onValueChange={ (value) => onSetPlayerSlot(teamIndex, value) }
                >
                  <SelectTrigger className="w-full border-[#e8c4a0] bg-white text-xs text-[#5c2e1a]">
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ clearPlayerOptionValue } disabled={ !selectedPlayers[teamIndex] }>
                      Unselect player
                    </SelectItem>
                    <SelectItem value={ addGuestOptionValue }>
                      + Add a guest
                    </SelectItem>
                    { orderedSelectablePlayers.map((member) => {
                      const selectedInOtherSlot = selectedPlayers.some(
                        (existingPlayer, existingIdx) => existingIdx !== teamIndex && existingPlayer?.id === member.id
                      );

                      return (
                        <SelectItem
                          key={ `crokinole-primary-${ teamIndex }-${ member.id }` }
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

              { crokinoleFormat === "doubles" && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a85a3a]">Partner</Label>
                  <Select
                    value={ selectedPlayers[teamIndex + 2] ? String(selectedPlayers[teamIndex + 2]?.id) : "" }
                    onValueChange={ (value) => onSetPlayerSlot(teamIndex + 2, value) }
                  >
                    <SelectTrigger className="w-full border-[#e8c4a0] bg-white text-xs text-[#5c2e1a]">
                      <SelectValue placeholder="Select partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ clearPlayerOptionValue } disabled={ !selectedPlayers[teamIndex + 2] }>
                        Unselect player
                      </SelectItem>
                      <SelectItem value={ addGuestOptionValue }>
                        + Add a guest
                      </SelectItem>
                      { orderedSelectablePlayers.map((member) => {
                        const selectedInOtherSlot = selectedPlayers.some(
                          (existingPlayer, existingIdx) => existingIdx !== teamIndex + 2 && existingPlayer?.id === member.id
                        );

                        return (
                          <SelectItem
                            key={ `crokinole-partner-${ teamIndex }-${ member.id }` }
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
          )) }
        </div>
      </div>
    </div>
  );
}
