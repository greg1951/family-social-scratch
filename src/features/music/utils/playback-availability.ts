export function normalizeMusicProviderName(value?: string | null): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getPlaylistPlaybackAvailability({
  selectedProviderName,
  hasSpotifyAccessToken,
  playlistMedia,
}: {
  selectedProviderName: string | null;
  hasSpotifyAccessToken: boolean;
  playlistMedia: Array<{ mediaSource?: string | null; mediaUrl?: string | null }>;
}) {
  const normalizedProviderName = normalizeMusicProviderName(selectedProviderName);
  const isSpotifyProviderSelected = normalizedProviderName.includes("spotify");
  const isAppleMusicProviderSelected = normalizedProviderName.includes("apple") && normalizedProviderName.includes("music");
  const hasSpotifyPlaylistMedia = playlistMedia.some((media) => (media.mediaSource ?? "").toLowerCase() === "spotify");
  const isSpotifyConnected = isSpotifyProviderSelected && hasSpotifyAccessToken;

  if (!normalizedProviderName || (!isSpotifyProviderSelected && !isAppleMusicProviderSelected)) {
    return { canPlay: false, canPause: false, provider: "none" as const };
  }

  if (isAppleMusicProviderSelected) {
    return { canPlay: false, canPause: false, provider: "apple" as const };
  }

  const canPlay = isSpotifyConnected && hasSpotifyPlaylistMedia;
  const canPause = isSpotifyConnected;

  return { canPlay, canPause, provider: "spotify" as const };
}
