import NextAuth from "next-auth";
import Credentials from 'next-auth/providers/credentials';
import { authValidation } from "./features/auth/services/auth-utils";

type AuthRecord = {
  email: string;
  family: string;
  password: string;
  token?: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    jwt({token, user}) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({session, token}) {
        session.user.id = token.id as string;
        return session;
    }
  }, //end callbacks
  providers: [
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
        console.log('auth->authorize->validationResult: ', validationResult);
        if (validationResult.error) {
          return null;
        }
        return {
          id: validationResult.id,
          email: validationResult.email,
          family: validationResult.family,
        }
      }
    })
  ],
});