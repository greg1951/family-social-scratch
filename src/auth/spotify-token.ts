const SPOTIFY_TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const EXPIRY_SKEW_SECONDS = 60;

export type SpotifyTokenState = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  error?: "RefreshAccessTokenError";
};

export async function refreshSpotifyAccessToken({
  token,
  clientId,
  clientSecret,
  now = Date.now(),
  fetchImplementation = fetch,
}: {
  token: SpotifyTokenState;
  clientId: string;
  clientSecret: string;
  now?: number;
  fetchImplementation?: typeof fetch;
}): Promise<SpotifyTokenState> {
  const expiresAtMilliseconds = token.expiresAt ? token.expiresAt * 1000 : null;
  const isAccessTokenUsable = Boolean(
    token.accessToken
    && expiresAtMilliseconds
    && now < expiresAtMilliseconds - EXPIRY_SKEW_SECONDS * 1000,
  );

  if (isAccessTokenUsable) {
    return token;
  }

  if (!token.refreshToken) {
    return { ...token, accessToken: null, error: "RefreshAccessTokenError" };
  }

  try {
    const response = await fetchImplementation(SPOTIFY_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Basic ${ Buffer.from(`${ clientId }:${ clientSecret }`).toString("base64") }`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedToken = await response.json() as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
    };

    if (!response.ok || !refreshedToken.access_token || !refreshedToken.expires_in) {
      return { ...token, accessToken: null, error: "RefreshAccessTokenError" };
    }

    return {
      accessToken: refreshedToken.access_token,
      refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(now / 1000) + refreshedToken.expires_in,
    };
  } catch {
    return { ...token, accessToken: null, error: "RefreshAccessTokenError" };
  }
}