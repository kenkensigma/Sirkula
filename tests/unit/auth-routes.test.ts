import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as getMe, PATCH as patchMe } from "@/app/api/v1/me/route";
import { POST as postSignup } from "@/app/api/v1/auth/signup/route";
import { POST as postLogin } from "@/app/api/v1/auth/login/route";

describe("Phase 1: Backend Route Handlers", () => {
  describe("GET /api/v1/me", () => {
    it("returns 401 UNAUTHENTICATED when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/me", {
        method: "GET",
      });
      const res = await getMe(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("PATCH /api/v1/me", () => {
    it("returns 401 UNAUTHENTICATED when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Nama Baru" }),
      });
      const res = await patchMe(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("POST /api/v1/auth/signup", () => {
    it("returns 400 VALIDATION_ERROR when role is 'admin' or invalid", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
          name: "Test User",
          role: "admin",
        }),
      });
      const res = await postSignup(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.details).toBeDefined();
    });

    it("returns 400 VALIDATION_ERROR on malformed JSON body", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json",
      });
      const res = await postSignup(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("returns 400 VALIDATION_ERROR when email or password is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "invalid-email",
          password: "",
        }),
      });
      const res = await postLogin(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
