import { SupabaseClient } from "@supabase/supabase-js";
import { Database, ProfileRow } from "@/types/database";
import { UserProfileResponse } from "@/types/api";
import { UpdateProfileInput } from "@/lib/validation/profile.schema";
import { ProfileRepository } from "@/lib/repositories/profile.repository";
import { ApiError } from "@/lib/errors/api-error";

export class ProfileService {
  /**
   * Mengubah ProfileRow database menjadi format response API UserProfileResponse.
   */
  static formatProfileResponse(profile: ProfileRow): UserProfileResponse {
    return {
      id: profile.id,
      name: profile.name,
      role: profile.role,
      phone: profile.phone,
      location: {
        latitude: profile.latitude,
        longitude: profile.longitude,
      },
      created_at: profile.created_at,
    };
  }

  /**
   * Mengambil profil pengguna aktif.
   */
  static async getProfile(
    client: SupabaseClient<Database>,
    userId: string
  ): Promise<UserProfileResponse> {
    const profile = await ProfileRepository.getById(client, userId);
    if (!profile) {
      throw new ApiError("NOT_FOUND", "Profil pengguna tidak ditemukan.");
    }
    return this.formatProfileResponse(profile);
  }

  /**
   * Memperbarui field profil aman milik pengguna.
   */
  static async updateProfile(
    client: SupabaseClient<Database>,
    userId: string,
    input: UpdateProfileInput
  ): Promise<UserProfileResponse> {
    const existing = await ProfileRepository.getById(client, userId);
    if (!existing) {
      throw new ApiError("NOT_FOUND", "Profil pengguna tidak ditemukan.");
    }

    const updated = await ProfileRepository.updateSafeFields(client, userId, input);
    return this.formatProfileResponse(updated);
  }
}
