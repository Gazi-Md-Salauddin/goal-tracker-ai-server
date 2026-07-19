import dotenv from "dotenv";

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isDev: (process.env.NODE_ENV ?? "development") === "development",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  mongodbUri: required("MONGODB_URI"),
  mongodbDbName: process.env.MONGODB_DB_NAME ?? "goal_tracker_ai",
  betterAuthSecret: required("BETTER_AUTH_SECRET"),
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:5000",
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
} as const;
