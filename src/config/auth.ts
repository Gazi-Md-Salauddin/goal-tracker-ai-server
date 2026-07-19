import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { bearer } from "better-auth/plugins";
import type { Db } from "mongodb";
import { env } from "./env.js";

export async function initAuth(db: Db) {
  return betterAuth({
    database: mongodbAdapter(db),
    secret: env.betterAuthSecret,
    baseURL: env.betterAuthUrl,
    trustedOrigins: [env.clientOrigin],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true,
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    plugins: [bearer()],
    advanced: {
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: env.nodeEnv === "production" ? "none" : "lax",
        secure: env.nodeEnv === "production",
      },
    },
  });
}

export type Auth = ReturnType<typeof betterAuth>;
