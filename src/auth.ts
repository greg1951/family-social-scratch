import NextAuth from "next-auth";
import Credentials from 'next-auth/providers/credentials';
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Spotify from "next-auth/providers/spotify";
import {
  getProviderEnvValue,
  isAppleProviderConfigured,
  isGoogleProviderConfigured,
  isSpotifyProviderConfigured,
} from "@/auth/provider-config";
import { refreshSpotifyAccessToken } from "@/auth/spotify-token";
import { authValidation } from "./features/auth/services/auth-utils";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { and, eq, desc } from "drizzle-orm";
import db from "@/components/db/drizzle";
import { accounts, user } from "@/components/db/schema/family-social-schema-tables";
import { findRegisteredFamily } from "@/components/db/sql/queries-family-member";
import type { AdapterAccount } from "@auth/core/adapters";

const OAUTH_PROVIDERS = ["google", "apple", "spotify"] as const;
type OAuthProvider = typeof OAUTH_PROVIDERS[number];
function isLocalOAuthEnvironment(): boolean {
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  return process.env.NODE_ENV !== "production" || authUrl.includes("localhost") || authUrl.includes("127.0.0.1") || authUrl.includes("local.");
}

const localOAuthChecks: Array<"none" | "pkce" | "state" | "nonce"> = isLocalOAuthEnvironment()
  ? ["none"]
  : ["pkce"];

const OAUTH_FAMILY_COOKIE = "oauth_family_context";

console.log("[auth][startup] spotify env diagnostics", {
  authSpotifyId: process.env.AUTH_SPOTIFY_ID ?? null,
  authSpotifySecret: process.env.AUTH_SPOTIFY_SECRET ? "present" : null,
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID ?? null,
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET ? "present" : null,
  spotifyProviderConfigured: isSpotifyProviderConfigured(),
  authGoogleConfigured: isGoogleProviderConfigured(),
  authAppleConfigured: isAppleProviderConfigured(),
});

type OAuthFamilyContext = {
  familyName: string;
  familyId?: number;
};

async function upsertOAuthUser(params: {
  email: string;
  familyId: number;
  name?: string | null;
  image?: string | null;
}) {
  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.email, params.email), eq(user.familyId, params.familyId)));

  if (existingUser?.id) {
    return existingUser.id;
  }

  // OAuth-only users do not need a local password, but table requires one.
  const placeholderPassword = `${randomUUID()}:${randomUUID()}`;
  const [insertedUser] = await db
    .insert(user)
    .values({
      email: params.email,
      familyId: params.familyId,
      password: placeholderPassword,
      name: params.name ?? undefined,
      image: params.image ?? undefined,
      emailVerified: new Date(),
    })
    .returning({ id: user.id });

  return insertedUser.id;
}

async function upsertOAuthAccount(params: {
  userId: number;
  provider: string;
  providerAccountId: string;
  type: AdapterAccount["type"];
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
}) {
  // Check for existing account by provider + providerAccountId
  const [existingAccount] = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(
      and(
        eq(accounts.provider, params.provider),
        eq(accounts.providerAccountId, params.providerAccountId)
      )
    );

  if (existingAccount) {
    await db
      .update(accounts)
      .set({
        refresh_token: params.refresh_token ?? undefined,
        access_token: params.access_token ?? undefined,
        expires_at: params.expires_at ?? undefined,
        token_type: params.token_type ?? undefined,
        scope: params.scope ?? undefined,
        id_token: params.id_token ?? undefined,
        session_state: params.session_state ?? undefined,
      })
      .where(
        and(
          eq(accounts.provider, params.provider),
          eq(accounts.providerAccountId, params.providerAccountId)
        )
      );
    return;
  }

  await db.insert(accounts).values({
    userId: params.userId,
    provider: params.provider,
    providerAccountId: params.providerAccountId,
    type: params.type,
    refresh_token: params.refresh_token ?? null,
    access_token: params.access_token ?? null,
    expires_at: params.expires_at ?? null,
    token_type: params.token_type ?? null,
    scope: params.scope ?? null,
    id_token: params.id_token ?? null,
    session_state: params.session_state ?? null,
  });
}

/**
 * For Apple OAuth, the email is only returned on the FIRST sign-in.
 * On subsequent sign-ins, look up the user via the linked account record.
 */
async function findUserByProviderAccount(provider: string, providerAccountId: string) {
  const [linked] = await db
    .select({ userId: accounts.userId })
    .from(accounts)
    .where(
      and(
        eq(accounts.provider, provider),
        eq(accounts.providerAccountId, providerAccountId)
      )
    );
  if (!linked?.userId) return null;

  const [foundUser] = await db
    .select({ id: user.id, email: user.email, familyId: user.familyId, name: user.name })
    .from(user)
    .where(eq(user.id, linked.userId));

  return foundUser ?? null;
}

type AuthRecord = {
  email: string;
  family: string;
  password: string;
  token?: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  callbacks: {
    async signIn({ user: oauthUser, account }) {
      if (!account || !(OAUTH_PROVIDERS as readonly string[]).includes(account.provider)) {
        return true;
      }

      const provider = account.provider as OAuthProvider;

      if (provider === "spotify") {
        console.log("[auth][spotify-callback] incoming values", {
          email: oauthUser.email ?? null,
          providerAccountId: account.providerAccountId ?? null,
          accessTokenPresent: Boolean(account.access_token),
          refreshTokenPresent: Boolean(account.refresh_token),
          expiresAt: account.expires_at ?? null,
          scope: account.scope ?? null,
          tokenType: account.token_type ?? null,
        });

        if (!oauthUser.email) {
          return false;
        }

        const [existingUser] = await db
          .select({ id: user.id, email: user.email, familyId: user.familyId })
          .from(user)
          .where(eq(user.email, oauthUser.email));

        console.log("[auth][spotify-callback] existing user lookup", {
          email: oauthUser.email,
          matchedUser: existingUser ? { id: existingUser.id, email: existingUser.email, familyId: existingUser.familyId } : null,
        });

        if (!existingUser) {
          return false;
        }

        if (account.providerAccountId) {
          await upsertOAuthAccount({
            userId: existingUser.id,
            provider,
            providerAccountId: account.providerAccountId,
            type: "oauth",
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state?.toString() ?? null,
          });
        }

        (oauthUser as { id: string }).id = String(existingUser.id);
        (oauthUser as { familyId: number }).familyId = existingUser.familyId;
        return true;
      }

      const cookieStore = await cookies();
      const rawFamilyContext = cookieStore.get(OAUTH_FAMILY_COOKIE)?.value;

      let familyContext: OAuthFamilyContext;
      try {
        familyContext = JSON.parse(rawFamilyContext ?? "null") as OAuthFamilyContext;
      } catch {
        return false;
      }

      // Apple does not return the email on repeat logins. If email is absent, look
      // up the existing account by providerAccountId to restore user context.
      if (!oauthUser.email) {
        if (provider !== "apple" || !account.providerAccountId) return false;

        const existingUser = await findUserByProviderAccount(provider, account.providerAccountId);
        if (!existingUser) return false;

        (oauthUser as { id: string }).id = String(existingUser.id);
        (oauthUser as { familyId: number }).familyId = existingUser.familyId;
        return true;
      }

      if (!rawFamilyContext) return false;

      const familyResult = await findRegisteredFamily(familyContext.familyName);
      if (!familyResult.success || !familyResult.familyId) {
        return false;
      }

      const familyId = familyResult.familyId;
      const userId = await upsertOAuthUser({
        email: oauthUser.email,
        familyId,
        name: oauthUser.name,
        image: oauthUser.image,
      });

      if (!account.providerAccountId) {
        return false;
      }

      await upsertOAuthAccount({
        userId,
        provider,
        providerAccountId: account.providerAccountId,
        type: "oauth",
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state?.toString() ?? null,
      });

      (oauthUser as { id: string }).id = String(userId);
      (oauthUser as { familyId: number }).familyId = familyId;
      (oauthUser as { familyName: string }).familyName = familyResult.familyName as string;
      cookieStore.delete(OAUTH_FAMILY_COOKIE);

      return true;
    },
    jwt({token, user: jwtUser, account}) {
      if (jwtUser) {
        token.id = jwtUser.id;
        token.name = jwtUser.name;
        token.familyId = (jwtUser as { familyId?: number }).familyId;
        token.familyName = (jwtUser as { familyName?: string }).familyName;
      }

      if (account?.provider === "spotify") {
        token.spotifyAccessToken = account.access_token;
        token.spotifyRefreshToken = account.refresh_token;
        token.spotifyAccessTokenExpiresAt = account.expires_at;
      }

      return token;
    },
    async session({session, token}) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        (session.user as { familyId?: number }).familyId = token.familyId as number | undefined;
        (session.user as { familyName?: string }).familyName = token.familyName as string | undefined;

        let spotifyAccessToken = (token.spotifyAccessToken as string | null | undefined) ?? null;
        let spotifyRefreshToken = (token.spotifyRefreshToken as string | null | undefined) ?? null;
        let spotifyAccessTokenExpiresAt = (token.spotifyAccessTokenExpiresAt as number | null | undefined) ?? null;
        let spotifyAccountUserId = Number(token.id) || null;

        if ((!spotifyAccessToken || !spotifyRefreshToken || !spotifyAccessTokenExpiresAt) && session.user.email) {
          const normalizedEmail = session.user.email.trim().toLowerCase();
          const [userRecord] = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, normalizedEmail));

          if (userRecord?.id) {
            spotifyAccountUserId = userRecord.id;
            const [storedSpotifyAccount] = await db
              .select({
                accessToken: accounts.access_token,
                refreshToken: accounts.refresh_token,
                expiresAt: accounts.expires_at,
              })
              .from(accounts)
              .where(and(eq(accounts.userId, userRecord.id), eq(accounts.provider, "spotify")))
              .orderBy(desc(accounts.expires_at));

            spotifyAccessToken = storedSpotifyAccount?.accessToken ?? spotifyAccessToken;
            spotifyRefreshToken = storedSpotifyAccount?.refreshToken ?? spotifyRefreshToken;
            spotifyAccessTokenExpiresAt = storedSpotifyAccount?.expiresAt ?? spotifyAccessTokenExpiresAt;
          }
        }

        const spotifyClientId = getProviderEnvValue("AUTH_SPOTIFY_ID", "SPOTIFY_CLIENT_ID");
        const spotifyClientSecret = getProviderEnvValue("AUTH_SPOTIFY_SECRET", "SPOTIFY_CLIENT_SECRET");

        if ((spotifyAccessToken || spotifyRefreshToken) && spotifyClientId && spotifyClientSecret) {
          const refreshedSpotifyToken = await refreshSpotifyAccessToken({
            token: {
              accessToken: spotifyAccessToken,
              refreshToken: spotifyRefreshToken,
              expiresAt: spotifyAccessTokenExpiresAt,
            },
            clientId: spotifyClientId,
            clientSecret: spotifyClientSecret,
          });

          const didRefresh = Boolean(
            refreshedSpotifyToken.accessToken
            && refreshedSpotifyToken.accessToken !== spotifyAccessToken,
          );

          spotifyAccessToken = refreshedSpotifyToken.accessToken;
          spotifyRefreshToken = refreshedSpotifyToken.refreshToken;
          spotifyAccessTokenExpiresAt = refreshedSpotifyToken.expiresAt;
          token.spotifyAccessToken = spotifyAccessToken;
          token.spotifyRefreshToken = spotifyRefreshToken;
          token.spotifyAccessTokenExpiresAt = spotifyAccessTokenExpiresAt;

          if (didRefresh && spotifyAccountUserId) {
            await db
              .update(accounts)
              .set({
                access_token: spotifyAccessToken,
                refresh_token: spotifyRefreshToken,
                expires_at: spotifyAccessTokenExpiresAt,
              })
              .where(and(eq(accounts.userId, spotifyAccountUserId), eq(accounts.provider, "spotify")));
          }
        }

        (session as { spotifyAccessToken?: string | null }).spotifyAccessToken = spotifyAccessToken;
        (session as { spotifyRefreshToken?: string | null }).spotifyRefreshToken = spotifyRefreshToken;
        (session as { spotifyAccessTokenExpiresAt?: number | null }).spotifyAccessTokenExpiresAt = spotifyAccessTokenExpiresAt;
        return session;
    }
  },
  providers: [
    ...(isGoogleProviderConfigured()
      ? [
          Google({
            clientId: getProviderEnvValue("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID") as string,
            clientSecret: getProviderEnvValue("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET") as string,
            checks: localOAuthChecks,
          }),
        ]
      : []),
    ...(isAppleProviderConfigured()
      ? [
          Apple({
            clientId: getProviderEnvValue("AUTH_APPLE_ID", "APPLE_CLIENT_ID") as string,
            clientSecret: getProviderEnvValue("AUTH_APPLE_SECRET", "APPLE_CLIENT_SECRET") as string,
            checks: localOAuthChecks,
          }),
        ]
      : []),
    ...(isSpotifyProviderConfigured()
      ? [
          Spotify({
            clientId: getProviderEnvValue("AUTH_SPOTIFY_ID", "SPOTIFY_CLIENT_ID") as string,
            clientSecret: getProviderEnvValue("AUTH_SPOTIFY_SECRET", "SPOTIFY_CLIENT_SECRET") as string,
            checks: localOAuthChecks,
            // Must include `url`: an object-only `authorization` wipes the provider's default
            // endpoint during config merge and falls back to discovery via `issuer` (unset here).
            authorization: {
              url: "https://accounts.spotify.com/authorize",
              params: {
                scope: "user-read-email user-read-private user-modify-playback-state user-read-playback-state",
              },
            },
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: {},
        family: {},
        password: {},
        token: {},
      },
      async authorize(credentials) {
        // const { token, email, family, password } = credentials as CustomCredentials;

        const normalizedEmail = String(credentials.email ?? "").trim().toLowerCase();

        const authRecord:AuthRecord = {
          email: normalizedEmail,
          family: credentials.family as string,
          password: credentials.password as string,
          token: credentials.token as string,
        };

        // console.log('auth->authorize->authRecord', authRecord);

        const validationResult = await authValidation(authRecord);
        // console.log('auth->authorize->validationResult: ', validationResult);
        if (validationResult.error) {
          return null;
        }
        const email = validationResult.email as string;
        const displayName = email?.split("@")[0] ?? email;

        return {
          id: validationResult.id,
          email,
          name: displayName,
          familyId: validationResult.familyId,
          familyName: validationResult.family,
        }
      }
    })
  ],
});