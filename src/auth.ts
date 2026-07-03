import NextAuth from "next-auth";
import Credentials from 'next-auth/providers/credentials';
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { authValidation } from "./features/auth/services/auth-utils";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import db from "@/components/db/drizzle";
import { accounts, user } from "@/components/db/schema/family-social-schema-tables";
import { findRegisteredFamily } from "@/components/db/sql/queries-family-member";
import type { AdapterAccount } from "@auth/core/adapters";

const OAUTH_PROVIDERS = ["google", "apple"] as const;
type OAuthProvider = typeof OAUTH_PROVIDERS[number];
const APPLE_ENV_KEYS = [
  "AUTH_APPLE_ID",
  "AUTH_APPLE_SECRET",
] as const;

const OAUTH_FAMILY_COOKIE = "oauth_family_context";

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

function isAppleProviderConfigured(): boolean {
  return APPLE_ENV_KEYS.every((key) => {
    const value = process.env[key];
    return typeof value === "string" && value.trim().length > 0;
  });
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
    jwt({token, user: jwtUser}) {
      if (jwtUser) {
        token.id = jwtUser.id;
        token.name = jwtUser.name;
        token.familyId = (jwtUser as { familyId?: number }).familyId;
        token.familyName = (jwtUser as { familyName?: string }).familyName;
      }
      return token;
    },
    session({session, token}) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        (session.user as { familyId?: number }).familyId = token.familyId as number | undefined;
        (session.user as { familyName?: string }).familyName = token.familyName as string | undefined;
        return session;
    }
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
    }),
    ...(isAppleProviderConfigured()
      ? [
          Apple({
            clientId: process.env.AUTH_APPLE_ID as string,
            clientSecret: process.env.AUTH_APPLE_SECRET as string,
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