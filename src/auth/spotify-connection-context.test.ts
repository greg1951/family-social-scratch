import { describe, expect, it } from "vitest";

import { createSpotifyConnectionContext, parseSpotifyConnectionContext } from "./spotify-connection-context";

const NOW = 1_800_000_000_000;

describe("Spotify connection context", () => {
  it("round-trips an authenticated user id", () => {
    const value = createSpotifyConnectionContext(42, "test-secret", NOW);

    expect(parseSpotifyConnectionContext(value, "test-secret", NOW)).toEqual({
      userId: 42,
      expiresAt: NOW + 10 * 60 * 1000,
    });
  });

  it("rejects tampered and expired contexts", () => {
    const value = createSpotifyConnectionContext(42, "test-secret", NOW);
    const tamperedValue = `${ value.slice(0, -1) }x`;

    expect(parseSpotifyConnectionContext(tamperedValue, "test-secret", NOW)).toBeNull();
    expect(parseSpotifyConnectionContext(value, "test-secret", NOW + 10 * 60 * 1000)).toBeNull();
  });
});