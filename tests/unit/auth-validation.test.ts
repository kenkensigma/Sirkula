import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema } from "@/lib/validation/auth.schema";
import { updateProfileSchema } from "@/lib/validation/profile.schema";

describe("Phase 1: Auth & Profile Validation Schemas", () => {
  describe("signupSchema", () => {
    it("accepts valid factory and farmer signup payloads", () => {
      const validFactory = {
        email: "pabrik@test.com",
        password: "securepassword123",
        name: "Pabrik Tahu Enak",
        role: "factory" as const,
        phone: "081234567890",
        latitude: -8.65,
        longitude: 115.21,
      };
      expect(signupSchema.safeParse(validFactory).success).toBe(true);

      const validFarmer = {
        email: "peternak@test.com",
        password: "password123",
        name: "Pak Wayan",
        role: "farmer" as const,
      };
      expect(signupSchema.safeParse(validFarmer).success).toBe(true);
    });

    it("rejects invalid role such as 'admin' in self-registration", () => {
      const invalidRole = {
        email: "hacker@test.com",
        password: "password123",
        name: "Hacker",
        role: "admin",
      };
      const result = signupSchema.safeParse(invalidRole);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/factory.*farmer/i);
      }
    });

    it("rejects password shorter than 6 characters", () => {
      const shortPass = {
        email: "user@test.com",
        password: "123",
        name: "User",
        role: "farmer",
      };
      expect(signupSchema.safeParse(shortPass).success).toBe(false);
    });

    it("rejects invalid email format", () => {
      const badEmail = {
        email: "not-an-email",
        password: "password123",
        name: "User",
        role: "farmer",
      };
      expect(signupSchema.safeParse(badEmail).success).toBe(false);
    });

    it("validates Indonesian phone number format", () => {
      const validPhone = {
        email: "user@test.com",
        password: "password123",
        name: "User",
        role: "farmer",
        phone: "+6281234567890",
      };
      expect(signupSchema.safeParse(validPhone).success).toBe(true);

      const invalidPhone = {
        email: "user@test.com",
        password: "password123",
        name: "User",
        role: "farmer",
        phone: "12345",
      };
      expect(signupSchema.safeParse(invalidPhone).success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("accepts valid email and password", () => {
      const valid = { email: "user@test.com", password: "mypassword" };
      expect(loginSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects empty password or invalid email", () => {
      expect(loginSchema.safeParse({ email: "invalid", password: "123" }).success).toBe(false);
      expect(loginSchema.safeParse({ email: "user@test.com", password: "" }).success).toBe(false);
    });
  });

  describe("updateProfileSchema", () => {
    it("accepts partial updates for safe fields", () => {
      const updateName = { name: "Nama Baru" };
      expect(updateProfileSchema.safeParse(updateName).success).toBe(true);

      const updateCoordinates = { latitude: -8.65, longitude: 115.21 };
      expect(updateProfileSchema.safeParse(updateCoordinates).success).toBe(true);
    });

    it("rejects out-of-range coordinates", () => {
      const badLat = { latitude: 95.0 };
      expect(updateProfileSchema.safeParse(badLat).success).toBe(false);

      const badLng = { longitude: 200.0 };
      expect(updateProfileSchema.safeParse(badLng).success).toBe(false);
    });

    it("ignores or strips role if provided in payload", () => {
      const payloadWithRole = {
        name: "Nama Baru",
        role: "admin", // privileged field
      };
      const parsed = updateProfileSchema.safeParse(payloadWithRole);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect((parsed.data as Record<string, unknown>).role).toBeUndefined();
      }
    });
  });
});
