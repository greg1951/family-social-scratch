import { createHmac, timingSafeEqual } from "crypto";

export const SPOTIFY_CONNECTION_COOKIE = "spotify_connection_context";
export const SPOTIFY_CONNECTION_TTL_SECONDS = 10 * 60;

type SpotifyConnectionContext = {
  userId: number;
  expiresAt: number;
};

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSpotifyConnectionContext(userId: number, secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({
    userId,
    expiresAt: now + SPOTIFY_CONNECTION_TTL_SECONDS * 1000,
  } satisfies SpotifyConnectionContext)).toString("base64url");

  return `${ payload }.${ signPayload(payload, secret) }`;
}

export function parseSpotifyConnectionContext(value: string | undefined, secret: string, now = Date.now()): SpotifyConnectionContext | null {
  if (!value || !secret) {
    return null;
  }

  const [payload, signature, ...remainder] = value.split(".");
  if (!payload || !signature || remainder.length > 0) {
    return null;
  }

  const expectedSignature = signPayload(payload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const context = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SpotifyConnectionContext;
    if (!Number.isInteger(context.userId) || context.userId <= 0 || !Number.isFinite(context.expiresAt) || context.expiresAt <= now) {
      return null;
    }

    return context;
  } catch {
    return null;
  }
}