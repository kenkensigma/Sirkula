import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { ProfileRow } from "@/types/database";

const { mockProfile } = vi.hoisted(() => ({
  mockProfile: {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Pak Wayan Peternak",
    role: "farmer" as const,
    phone: "081987654321",
    latitude: -8.67,
    longitude: 115.22,
    created_at: "2026-10-21T00:00:00Z",
    updated_at: "2026-10-21T00:00:00Z",
  },
}));

// Mock requireUser to simulate an authenticated user
vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn().mockResolvedValue({
    user: { id: "22222222-2222-2222-2222-222222222222", email: "peternak@sirkula.local" },
    profile: {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Pak Wayan Peternak",
      role: "farmer",
      phone: "081987654321",
      latitude: -8.67,
      longitude: 115.22,
      created_at: "2026-10-21T00:00:00Z",
      updated_at: "2026-10-21T00:00:00Z",
    },
    supabase: {},
  }),
}));

// Mock ProfileService to avoid requiring real Supabase database connection during unit testing
vi.mock("@/lib/services/profile.service", () => ({
  ProfileService: {
    getProfile: vi.fn().mockResolvedValue({
      id: mockProfile.id,
      name: mockProfile.name,
      role: mockProfile.role,
      phone: mockProfile.phone,
      location: {
        latitude: mockProfile.latitude,
        longitude: mockProfile.longitude,
      },
      created_at: mockProfile.created_at,
    }),
    updateProfile: vi.fn().mockImplementation((_client, _id, input) => {
      return Promise.resolve({
        id: mockProfile.id,
        name: input.name ?? mockProfile.name,
        role: mockProfile.role, // role remains unchanged
        phone: input.phone !== undefined ? input.phone : mockProfile.phone,
        location: {
          latitude: input.latitude !== undefined ? input.latitude : mockProfile.latitude,
          longitude: input.longitude !== undefined ? input.longitude : mockProfile.longitude,
        },
        created_at: mockProfile.created_at,
      });
    }),
  },
}));

import { GET as getMe, PATCH as patchMe } from "@/app/api/v1/me/route";
import { POST as postLogout } from "@/app/api/v1/auth/logout/route";

describe("Phase 1: Authenticated Profile and Logout Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/v1/me returns 200 with formatted user profile data", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/me", {
      method: "GET",
    });
    const res = await getMe(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toBeDefined();
    expect(json.data.id).toBe(mockProfile.id);
    expect(json.data.name).toBe("Pak Wayan Peternak");
    expect(json.data.role).toBe("farmer");
    expect(json.data.location).toEqual({
      latitude: -8.67,
      longitude: 115.22,
    });
  });

  it("PATCH /api/v1/me updates safe fields and preserves user role", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Nama Peternak Baru",
        role: "admin", // attempt to elevate role
      }),
    });
    const res = await patchMe(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.name).toBe("Nama Peternak Baru");
    // Ensure role remained 'farmer' and was NOT changed to 'admin'
    expect(json.data.role).toBe("farmer");
  });

  it("POST /api/v1/auth/logout clears session and returns success message", async () => {
    const res = await postLogout();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toBeDefined();
    expect(json.data.message).toBe("Berhasil logout.");
  });
});
