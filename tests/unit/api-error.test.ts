import { describe, it, expect } from "vitest";
import { ApiError, createErrorResponse, handleApiError } from "@/lib/errors/api-error";

describe("API Error Mapping and Handling", () => {
  it("maps ApiError to appropriate HTTP status codes", () => {
    const notFound = new ApiError("NOT_FOUND", "Batch tidak ditemukan");
    expect(notFound.statusCode).toBe(404);

    const validation = new ApiError("VALIDATION_ERROR", "Data tidak valid");
    expect(validation.statusCode).toBe(400);

    const conflict = new ApiError("STATE_CONFLICT", "Status tidak sesuai");
    expect(conflict.statusCode).toBe(409);

    const expired = new ApiError("BATCH_EXPIRED", "Batch sudah expired");
    expect(expired.statusCode).toBe(410);

    const pinErr = new ApiError("PIN_INVALID", "PIN salah");
    expect(pinErr.statusCode).toBe(422);
  });

  it("creates structured JSON response according to API.md contract", async () => {
    const res = createErrorResponse("VALIDATION_ERROR", "Field required", { field: "quantity_kg" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Field required",
        details: { field: "quantity_kg" },
      },
    });
  });

  it("handles unknown errors safely without leaking internal details", async () => {
    const err = new Error("Database connection password=secret leaked!");
    const res = handleApiError(err);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).not.toContain("password=secret");
  });
});
