import { describe, it, expect } from "vitest";
import { requireRole } from "@/lib/auth/require-role";
import { ApiError } from "@/lib/errors/api-error";

describe("Phase 1: Role-Based Access Control (requireRole)", () => {
  it("allows factory user to access factory-only resource", () => {
    expect(() => {
      requireRole({ role: "factory" }, ["factory"]);
    }).not.toThrow();
  });

  it("allows farmer user to access farmer-only resource", () => {
    expect(() => {
      requireRole({ role: "farmer" }, ["farmer"]);
    }).not.toThrow();
  });

  it("allows admin user when admin is in allowed roles", () => {
    expect(() => {
      requireRole({ role: "admin" }, ["admin", "factory"]);
    }).not.toThrow();
  });

  it("throws 403 ApiError FORBIDDEN when user role is not allowed", () => {
    try {
      requireRole({ role: "farmer" }, ["factory"]);
      expect.fail("Should have thrown ApiError");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe("FORBIDDEN");
      expect(apiErr.statusCode).toBe(403);
      expect(apiErr.message).toContain("Akses ditolak");
    }
  });

  it("throws 403 ApiError FORBIDDEN when factory tries to access admin-only action", () => {
    expect(() => {
      requireRole({ role: "factory" }, ["admin"]);
    }).toThrow(ApiError);
  });
});
