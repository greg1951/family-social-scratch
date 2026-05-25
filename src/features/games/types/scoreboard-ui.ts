export interface SelectedPlayer {
  id: number;
  firstName: string;
  lastName: string;
  isGuest: boolean;
}

export interface RoundEntry {
  roundKey: number;
  roundNo: number;
  label: string;
}

export type CrokinoleFormat = "singles" | "doubles";

export type CricketFormat = "singles" | "doubles";