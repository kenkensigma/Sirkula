import { SupabaseClient } from "@supabase/supabase-js";
import { Database, ProfileRow, UserRole } from "@/types/database";
import { UpdateProfileInput } from "@/lib/validation/profile.schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/errors/api-error";

export class ProfileRepository {
  /**
   * Mengambil profil pengguna berdasarkan user ID.
   */
  static async getById(
    client: SupabaseClient<Database>,
    userId: string
  ): Promise<ProfileRow | null> {
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", `Gagal mengambil profil: ${error.message}`);
    }

    return data;
  }

  /**
   * Memperbarui field profil aman milik pengguna.
   * Role dan field privileged dikecualikan secara eksplisit.
   */
  static async updateSafeFields(
    client: SupabaseClient<Database>,
    userId: string,
    input: UpdateProfileInput
  ): Promise<ProfileRow> {
    const updatePayload: Partial<Database["public"]["Tables"]["profiles"]["Update"]> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.phone !== undefined) updatePayload.phone = input.phone;
    if (input.latitude !== undefined) updatePayload.latitude = input.latitude;
    if (input.longitude !== undefined) updatePayload.longitude = input.longitude;

    const { data, error } = await client
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", `Gagal memperbarui profil: ${error.message}`);
    }

    return data;
  }

  /**
   * Membuat profil baru menggunakan Supabase Admin Client.
   * Dibatasi hanya untuk proses registrasi server-side tepercaya.
   */
  static async createProfile(profileData: {
    id: string;
    name: string;
    role: UserRole;
    phone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<ProfileRow> {
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("profiles")
      .insert({
        id: profileData.id,
        name: profileData.name,
        role: profileData.role,
        phone: profileData.phone ?? null,
        latitude: profileData.latitude ?? null,
        longitude: profileData.longitude ?? null,
      })
      .select("*")
      .single();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", `Gagal membuat profil: ${error.message}`);
    }

    return data;
  }
}
