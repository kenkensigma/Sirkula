import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditLogPayload {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  /**
   * Mencatat aksi sensitif ke dalam tabel audit_logs.
   * Catatan audit ditulis melalui admin client agar terhindar dari manipulasi RLS client.
   * DILARANG mencatat credential, password, PIN, token, atau secret ke metadata.
   */
  static async log(payload: AuditLogPayload): Promise<void> {
    try {
      const adminClient = createAdminClient();

      // Sanitasi metadata agar tidak ada field rahasia
      const sanitizedMeta: Record<string, unknown> = {};
      if (payload.metadata) {
        for (const [key, value] of Object.entries(payload.metadata)) {
          if (!/pin|password|secret|token|key/i.test(key)) {
            sanitizedMeta[key] = value;
          }
        }
      }

      await adminClient.from("audit_logs").insert({
        actor_profile_id: payload.actorId ?? null,
        action: payload.action,
        entity_type: payload.entityType,
        entity_id: payload.entityId ?? null,
        metadata: sanitizedMeta,
      });
    } catch {
      // Audit logging should not crash the main transaction flow if failed
      console.error("[AuditService] Failed to write audit log");
    }
  }
}
