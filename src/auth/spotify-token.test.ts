import { describe, expect, it, vi } from "vitest";

import { reconcileSpotifyToken, refreshSpotifyAccessToken } from "./spotify-token";

const NOW = 1_800_000_000_000;

describe("reconcileSpotifyToken", () => {
  it("prefers a newly persisted token after reconnect even when the stale session token is populated", () => {
    expect(reconcileSpotifyToken(
      {
        accessToken: "revoked-session-token",
        refreshToken: "old-refresh-token",
        expiresAt: NOW / 1000 + 1800,
      },
      {
        accessToken: "reconnected-access-token",
        refreshToken: "new-refresh-token",
        expiresAt: NOW / 1000 + 3600,
      },
    )).toEqual({
      accessToken: "reconnected-access-token",
      refreshToken: "new-refresh-token",
      expiresAt: NOW / 1000 + 3600,
    });
  });

  it("keeps a newer session token when persistence has not caught up", () => {
    const sessionToken = {
      accessToken: "refreshed-session-token",
      refreshToken: "rotated-refresh-token",
      expiresAt: NOW / 1000 + 3600,
    };

    expect(reconcileSpotifyToken(sessionToken, {
      accessToken: "older-database-token",
      refreshToken: "old-refresh-token",
      expiresAt: NOW / 1000 + 1800,
    })).toEqual(sessionToken);
  });
});

describe("refreshSpotifyAccessToken", () => {
  it("keeps an access token that is not near expiry", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();
    const token = {
      accessToken: "current-access-token",
      refreshToken: "current-refresh-token",
      expiresAt: NOW / 1000 + 3600,
    };

    await expect(refreshSpotifyAccessToken({
      token,
      clientId: "client-id",
      clientSecret: "client-secret",
      now: NOW,
      fetchImplementation,
    })).resolves.toEqual(token);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("refreshes an expired token and retains an unrotated refresh token", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      access_token: "new-access-token",
      expires_in: 3600,
    }), { status: 200 }));

    await expect(refreshSpotifyAccessToken({
      token: {
        accessToken: "expired-access-token",
        refreshToken: "current-refresh-token",
        expiresAt: NOW / 1000 - 1,
      },
      clientId: "client-id",
      clientSecret: "client-secret",
      now: NOW,
      fetchImplementation,
    })).resolves.toEqual({
      accessToken: "new-access-token",
      refreshToken: "current-refresh-token",
      expiresAt: NOW / 1000 + 3600,
    });
  });

  it("refreshes a token when its expiry metadata is missing", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      access_token: "new-access-token",
      expires_in: 3600,
    }), { status: 200 }));

    await expect(refreshSpotifyAccessToken({
      token: {
        accessToken: "unknown-age-access-token",
        refreshToken: "current-refresh-token",
        expiresAt: null,
      },
      clientId: "client-id",
      clientSecret: "client-secret",
      now: NOW,
      fetchImplementation,
    })).resolves.toEqual({
      accessToken: "new-access-token",
      refreshToken: "current-refresh-token",
      expiresAt: NOW / 1000 + 3600,
    });
  });

  it("clears an expired access token when refresh fails", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      error: "invalid_grant",
    }), { status: 400 }));

    await expect(refreshSpotifyAccessToken({
      token: {
        accessToken: "expired-access-token",
        refreshToken: "invalid-refresh-token",
        expiresAt: NOW / 1000 - 1,
      },
      clientId: "client-id",
      clientSecret: "client-secret",
      now: NOW,
      fetchImplementation,
    })).resolves.toEqual({
      accessToken: null,
      refreshToken: "invalid-refresh-token",
      expiresAt: NOW / 1000 - 1,
      error: "RefreshAccessTokenError",
    });
  });
});