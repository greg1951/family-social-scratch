export function getProviderEnvValue(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function isGoogleProviderConfigured(): boolean {
  return Boolean(getProviderEnvValue("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID"))
    && Boolean(getProviderEnvValue("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET"));
}

export function isAppleProviderConfigured(): boolean {
  return Boolean(getProviderEnvValue("AUTH_APPLE_ID", "APPLE_CLIENT_ID"))
    && Boolean(getProviderEnvValue("AUTH_APPLE_SECRET", "APPLE_CLIENT_SECRET"));
}

export function isSpotifyProviderConfigured(): boolean {
  return Boolean(getProviderEnvValue("AUTH_SPOTIFY_ID", "SPOTIFY_CLIENT_ID"))
    && Boolean(getProviderEnvValue("AUTH_SPOTIFY_SECRET", "SPOTIFY_CLIENT_SECRET"));
}
