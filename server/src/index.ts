import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";
import { connectMongo, closeMongo } from "./config/db.js";
import { initAuth } from "./config/auth.js";
import { authRoutes } from "./routes/auth.routes.js";
import { apiRoutes } from "./routes/index.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

async function bootstrap(): Promise<void> {
  const db = await connectMongo();
  const auth = await initAuth(db);

  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  if (env.isDev) app.use(morgan("dev"));

  // Better Auth handler — must come BEFORE express.json()
  app.all("/api/auth/*splat", toNodeHandler(auth));

  // Body parser for our own routes
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Health
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Rate limit
  app.use("/api", apiLimiter);

  // Auth routes (sign-up / sign-in / me / sign-out) — wraps Better Auth + issues our JWT
  app.use("/api/auth", authRoutes(auth.api as never));

  // REST API
  app.use("/api", apiRoutes());

  // 404 + error handler
  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(env.port, () => {
    console.info(`[server] listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal: string) => {
    console.info(`[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await closeMongo();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  console.error("[server] fatal startup error:", err);
  process.exit(1);
});
