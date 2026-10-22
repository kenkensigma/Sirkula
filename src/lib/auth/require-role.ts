import { ProfileRow, UserRole } from "@/types/database";
import { ApiError } from "@/lib/errors/api-error";

/**
 * Memastikan profil pengguna memiliki role yang diizinkan untuk mengakses resource atau aksi.
 * Jika role tidak memenuhi, melempar ApiError FORBIDDEN (403).
 */
export function requireRole(
  profile: Pick<ProfileRow, "role">,
  allowedRoles: UserRole[]
): void {
  if (!allowedRoles.includes(profile.role)) {
    throw new ApiError(
      "FORBIDDEN",
      `Akses ditolak: role '${profile.role}' tidak memiliki izin untuk melakukan aksi ini.`
    );
  }
}
