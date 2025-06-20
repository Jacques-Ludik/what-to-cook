import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, getServerSession, type NextAuthOptions } from "next-auth";
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
//import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";

import { db } from "~/server/db";
//import { env } from "~/env"; // Make sure to import env if you use it

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: PrismaAdapter(db),
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
} satisfies NextAuthOptions;

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 * This is a VERY IMPORTANT piece for the T3 Stack.
 * @see https://next-auth.js.org/configuration/nextjs
 */
/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 * This version works for both App Router (server components) and Pages Router (API routes).
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx?: {
  req: NextApiRequest | GetServerSidePropsContext["req"];
  res: NextApiResponse | GetServerSidePropsContext["res"];
}) => {
  // If ctx is provided (from Pages Router), use it. Otherwise, it's App Router.
  return ctx 
    ? getServerSession(ctx.req, ctx.res, authOptions)
    : getServerSession(authOptions);
};
//export const getServerAuthSession = () => getServerSession(authOptions);
