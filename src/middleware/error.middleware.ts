import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";

function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

function isZodError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name: string }).name === "ZodError"
  );
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (isZodError(err)) {
    const issues = (err as { errors?: { path: string; message: string }[] }).errors ?? [];
    res.status(400).json({
      message: "Validation failed",
      errors: issues.map((i) => ({ field: i.path, message: i.message })),
    });
    return;
  }

  if (isApiError(err)) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Better Auth throws Error-like objects with a `code` / `status` field
  if (
    typeof err === "object" &&
    err !== null &&
    ("status" in err || "statusCode" in err)
  ) {
    const e = err as { status?: number; statusCode?: number; message?: string; code?: string };
    const status = e.status ?? e.statusCode ?? 400;
    res.status(status).json({
      message: e.message ?? e.code ?? "Authentication error",
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error("[error]", err);
  res.status(500).json({ message: "Internal server error" });
}
