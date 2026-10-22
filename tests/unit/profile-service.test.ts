import { describe, it, expect } from "vitest";
import { ProfileService } from "@/lib/services/profile.service";
import { ProfileRow } from "@/types/database";

describe("Phase 1: ProfileService", () => {
  const mockProfileRow: ProfileRow = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Pabrik Tahu Barokah",
    role: "factory",
    phone: "081234567890",
    latitude: -8.65,
    longitude: 115.21,
    created_at: "2026-10-21T10:00:00Z",
    updated_at: "2026-10-21T10:00:00Z",
  };

  it("formats ProfileRow correctly to UserProfileResponse according to API specification", () => {
    const formatted = ProfileService.formatProfileResponse(mockProfileRow);

    expect(formatted).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Pabrik Tahu Barokah",
      role: "factory",
      phone: "081234567890",
      location: {
        latitude: -8.65,
        longitude: 115.21,
      },
      created_at: "2026-10-21T10:00:00Z",
    });
  });

  it("handles null phone and location gracefully in response formatting", () => {
    const nullLocationProfile: ProfileRow = {
      ...mockProfileRow,
      phone: null,
      latitude: null,
      longitude: null,
    };

    const formatted = ProfileService.formatProfileResponse(nullLocationProfile);
    expect(formatted.phone).toBeNull();
    expect(formatted.location).toEqual({
      latitude: null,
      longitude: null,
    });
  });
});
