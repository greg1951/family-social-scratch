import NextAuth from "next-auth";
import Credentials from 'next-auth/providers/credentials';
import Google from "next-auth/providers/google";
import { authValidation } from "./features/auth/services/auth-utils";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import db from "@/components/db/drizzle";
import { accounts, user } from "@/components/db/schema/family-social-schema-tables";
import { findRegisteredFamily } from "@/components/db/sql/queries-family-member";
import type { AdapterAccount } from "@auth/core/adapters";

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

type AuthRecord = {
  email: string;
  family: string;
  password: string;
  token?: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    async signIn({ user: oauthUser, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const cookieStore = await cookies();
      const rawFamilyContext = cookieStore.get(OAUTH_FAMILY_COOKIE)?.value;
      if (!rawFamilyContext || !oauthUser.email) {
        return false;
      }

      let familyContext: OAuthFamilyContext;
      try {
        familyContext = JSON.parse(rawFamilyContext) as OAuthFamilyContext;
      } catch {
        return false;
      }

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
        provider: account.provider,
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
    Credentials({
      credentials: {
        email: {},
        family: {},
        password: {},
        token: {},
      },
      async authorize(credentials) {
        // const { token, email, family, password } = credentials as CustomCredentials;

        const authRecord:AuthRecord = {
          email: credentials.email as string,
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