export type FamilyFeatureKey =
  | "tv"
  | "movies"
  | "books"
  | "foodies"
  | "music"
  | "poetry"
  | "gallery"
  | "games"
  | "threads";

const FEATURE_KEYWORD_MAP: Array<{ key: FamilyFeatureKey; keywords: string[] }> = [
  { key: "tv", keywords: ["tv"] },
  { key: "movies", keywords: ["movie", "movies"] },
  { key: "books", keywords: ["book", "books"] },
  { key: "foodies", keywords: ["food", "foodie", "foodies", "recipe"] },
  { key: "music", keywords: ["music"] },
  { key: "poetry", keywords: ["poetry", "poem"] },
  { key: "gallery", keywords: ["gallery", "galleries", "photo"] },
  { key: "games", keywords: ["game", "games", "scoreboard"] },
  { key: "threads", keywords: ["thread", "threads"] },
];

export function getFeatureKeyFromReferenceName(name: string): FamilyFeatureKey | null {
  const normalizedName = name.trim().toLowerCase();
  for (const entry of FEATURE_KEYWORD_MAP) {
    if (entry.keywords.some((keyword) => normalizedName.includes(keyword))) {
      return entry.key;
    }
  }

  return null;
}