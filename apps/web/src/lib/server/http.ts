import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiAuthError } from "./auth";
import { OrderError } from "./orders";

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Generic 4xx error any lib/server/*.ts function can throw for a client-facing validation failure. */
export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

/** Central catch-all for Route Handlers — maps known error types to the right HTTP status. */
export function handleRouteError(error: unknown) {
  if (error instanceof ApiAuthError || error instanceof OrderError || error instanceof AppError) {
    return apiError(error.message, error.status);
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid request body", details: error.flatten() }, { status: 400 });
  }
  console.error(error);
  return apiError("Internal server error", 500);
}
