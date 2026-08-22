import { beforeEach, describe, expect, it } from "vitest";
import { isGoogleProviderConfigured, isSpotifyProviderConfigured } from "./auth/provider-config";

describe("auth provider configuration guards", () => {
  beforeEach(() => {
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.AUTH_GOOGLE_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.AUTH_SPOTIFY_ID;
    delete process.env.AUTH_SPOTIFY_SECRET;
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;
  });

  it("requires both Spotify OAuth values before enabling the provider", () => {
    expect(isSpotifyProviderConfigured()).toBe(false);

    process.env.AUTH_SPOTIFY_ID = "spotify-client-id";
    expect(isSpotifyProviderConfigured()).toBe(false);

    process.env.AUTH_SPOTIFY_SECRET = "spotify-client-secret";
    expect(isSpotifyProviderConfigured()).toBe(true);
  });

  it("requires both Google OAuth values before enabling the provider", () => {
    expect(isGoogleProviderConfigured()).toBe(false);

    process.env.AUTH_GOOGLE_ID = "google-client-id";
    expect(isGoogleProviderConfigured()).toBe(false);

    process.env.AUTH_GOOGLE_SECRET = "google-client-secret";
    expect(isGoogleProviderConfigured()).toBe(true);
  });
});
