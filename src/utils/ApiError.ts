export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = "Bad request", details?: unknown): ApiError {
    return new ApiError(message, 400, true, details);
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(message, 401);
  }

  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(message, 403);
  }

  static notFound(message = "Not found"): ApiError {
    return new ApiError(message, 404);
  }

  static conflict(message = "Conflict", details?: unknown): ApiError {
    return new ApiError(message, 409, true, details);
  }

  static internal(message = "Internal server error"): ApiError {
    return new ApiError(message, 500, false);
  }
}
