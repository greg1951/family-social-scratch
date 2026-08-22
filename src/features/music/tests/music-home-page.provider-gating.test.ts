import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPlaylistPlaybackAvailability } from '@/features/music/utils/playback-availability';

describe('music playlist playback availability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires Spotify to be selected and the user to have a Spotify session token before enabling playback', () => {
    const result = getPlaylistPlaybackAvailability({
      selectedProviderName: 'Spotify',
      hasSpotifyAccessToken: false,
      playlistMedia: [
        { mediaSource: 'spotify', mediaUrl: 'https://open.spotify.com/track/abc123' },
      ] as Array<{ mediaSource: string; mediaUrl: string }>,
    });

    expect(result.canPlay).toBe(false);
    expect(result.canPause).toBe(false);
    expect(result.provider).toBe('spotify');
  });

  it('enables Spotify playback when Spotify is selected, the session token is attached, and the playlist has Spotify tracks', () => {
    const result = getPlaylistPlaybackAvailability({
      selectedProviderName: 'Spotify',
      hasSpotifyAccessToken: true,
      playlistMedia: [
        { mediaSource: 'spotify', mediaUrl: 'https://open.spotify.com/track/abc123' },
      ] as Array<{ mediaSource: string; mediaUrl: string }>,
    });

    expect(result.canPlay).toBe(true);
    expect(result.canPause).toBe(true);
    expect(result.provider).toBe('spotify');
  });

  it('disables playback when the member selected Apple Music', () => {
    const result = getPlaylistPlaybackAvailability({
      selectedProviderName: 'Apple Music',
      hasSpotifyAccessToken: true,
      playlistMedia: [
        { mediaSource: 'spotify', mediaUrl: 'https://open.spotify.com/track/abc123' },
      ] as Array<{ mediaSource: string; mediaUrl: string }>,
    });

    expect(result.canPlay).toBe(false);
    expect(result.canPause).toBe(false);
    expect(result.provider).toBe('apple');
  });

  it('disables playback when no preferred player is selected', () => {
    const result = getPlaylistPlaybackAvailability({
      selectedProviderName: null,
      hasSpotifyAccessToken: true,
      playlistMedia: [
        { mediaSource: 'spotify', mediaUrl: 'https://open.spotify.com/track/abc123' },
      ] as Array<{ mediaSource: string; mediaUrl: string }>,
    });

    expect(result.canPlay).toBe(false);
    expect(result.canPause).toBe(false);
    expect(result.provider).toBe('none');
  });
});
