import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type HideNoPlayerColumnsToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function HideNoPlayerColumnsToggle({
  checked,
  onCheckedChange,
}: HideNoPlayerColumnsToggleProps) {
  return (
    <div className="mb-3 flex items-center gap-2 text-xs text-[#7b3306]">
      <Checkbox
        id="hide-no-player-columns"
        checked={ checked }
        onCheckedChange={ (value) => onCheckedChange(value === true) }
      />
      <Label htmlFor="hide-no-player-columns" className="cursor-pointer text-xs text-[#7b3306]">
        Hide No-Player Columns
      </Label>
    </div>
  );
}
