import { NextResponse } from "next/server";
import { ApiErrorCode, ApiErrorResponse } from "@/types/api";

const STATUS_MAP: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  STATE_CONFLICT: 409,
  INSUFFICIENT_STOCK: 409,
  IDEMPOTENCY_CONFLICT: 409,
  BATCH_EXPIRED: 410,
  PIN_INVALID: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ApiErrorCode,
    message: string,
    details?: Record<string, unknown>,
    overrideStatus?: number
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = overrideStatus ?? STATUS_MAP[code] ?? 500;
    this.details = details;
  }
}

export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
  overrideStatus?: number
): NextResponse<ApiErrorResponse> {
  const status = overrideStatus ?? STATUS_MAP[code] ?? 500;
  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

export function handleApiError(err: unknown): NextResponse<ApiErrorResponse> {
  if (err instanceof ApiError) {
    return createErrorResponse(err.code, err.message, err.details, err.statusCode);
  }

  // Handle PostgreSQL exception codes if bubbled up from RPC
  if (err && typeof err === "object" && "message" in err) {
    const errorMsg = String(err.message);
    if (errorMsg.includes("INSUFFICIENT_STOCK")) {
      return createErrorResponse("INSUFFICIENT_STOCK", "Stok ampas tidak mencukupi.");
    }
    if (errorMsg.includes("BATCH_EXPIRED")) {
      return createErrorResponse("BATCH_EXPIRED", "Batch ampas telah kedaluwarsa.");
    }
    if (errorMsg.includes("IDEMPOTENCY_CONFLICT")) {
      return createErrorResponse("IDEMPOTENCY_CONFLICT", "Idempotency key telah digunakan dengan data berbeda.");
    }
    if (errorMsg.includes("STATE_CONFLICT")) {
      return createErrorResponse("STATE_CONFLICT", "Status transaksi tidak mendukung aksi ini.");
    }
    if (errorMsg.includes("PIN_INVALID")) {
      return createErrorResponse("PIN_INVALID", "PIN verifikasi tidak valid atau telah kedaluwarsa.");
    }
  }

  // Generic internal server error without leaking internals or stack traces
  return createErrorResponse(
    "INTERNAL_ERROR",
    "Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi."
  );
}
