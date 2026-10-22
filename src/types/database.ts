export type UserRole = "factory" | "farmer" | "admin";

export type BatchStatus = "available" | "paused" | "sold_out" | "expired" | "cancelled";

export type FreshnessZone = "green" | "yellow" | "pending_decision" | "expired";

export type TransactionStatus =
  | "awaiting_simulated_payment"
  | "paid_simulated"
  | "shipped"
  | "awaiting_handover_verification"
  | "completed"
  | "cancelled"
  | "cancelled_refunded_simulated"
  | "needs_review";

export type PaymentMode = "simulation";

export type LedgerEntryType = "payment" | "release" | "refund" | "reversal";
export type LedgerStatus = "posted" | "reversed";

export type ProfileRow = {
  id: string;
  name: string;
  role: UserRole;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

export type BatchRow = {
  id: string;
  factory_id: string;
  quantity_kg: number;
  reserved_kg: number;
  sold_kg: number;
  price_per_kg_idr: number;
  latitude: number;
  longitude: number;
  prepared_at: string;
  expires_at: string;
  description: string | null;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
};

export type TransactionRow = {
  id: string;
  batch_id: string;
  farmer_id: string;
  factory_id: string;
  quantity_kg: number;
  unit_price_idr: number;
  total_amount_idr: number;
  status: TransactionStatus;
  payment_mode: PaymentMode;
  idempotency_key: string;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type LedgerEntryRow = {
  id: string;
  transaction_id: string;
  account_profile_id: string;
  entry_type: LedgerEntryType;
  amount_idr: number;
  status: LedgerStatus;
  reference_key: string;
  created_at: string;
};

export type HandoverVerificationRow = {
  id: string;
  transaction_id: string;
  pin_hash: string;
  expires_at: string;
  attempt_count: number;
  consumed_at: string | null;
  created_at: string;
};

export type ImpactLogRow = {
  id: string;
  transaction_id: string;
  material_kg: number;
  estimated_co2e_kg: number;
  estimated_feed_savings_idr: number;
  methodology_version: string;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  actor_profile_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at">;
        Update: Partial<Omit<ProfileRow, "id" | "created_at">>;
        Relationships: [];
      };
      batches: {
        Row: BatchRow;
        Insert: Omit<BatchRow, "id" | "reserved_kg" | "sold_kg" | "created_at" | "updated_at"> & {
          reserved_kg?: number;
          sold_kg?: number;
        };
        Update: Partial<Omit<BatchRow, "id" | "created_at">>;
        Relationships: [];
      };
      transactions: {
        Row: TransactionRow;
        Insert: Omit<TransactionRow, "id" | "created_at" | "updated_at" | "completed_at">;
        Update: Partial<Omit<TransactionRow, "id" | "created_at">>;
        Relationships: [];
      };
      ledger_entries: {
        Row: LedgerEntryRow;
        Insert: Omit<LedgerEntryRow, "id" | "created_at">;
        Update: Partial<Omit<LedgerEntryRow, "id" | "created_at">>;
        Relationships: [];
      };
      handover_verifications: {
        Row: HandoverVerificationRow;
        Insert: Omit<HandoverVerificationRow, "id" | "created_at">;
        Update: Partial<Omit<HandoverVerificationRow, "id" | "created_at">>;
        Relationships: [];
      };
      impact_logs: {
        Row: ImpactLogRow;
        Insert: Omit<ImpactLogRow, "id" | "created_at">;
        Update: Partial<Omit<ImpactLogRow, "id" | "created_at">>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: Omit<AuditLogRow, "id" | "created_at">;
        Update: Partial<Omit<AuditLogRow, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_transaction_reservation: {
        Args: {
          p_farmer_id: string;
          p_batch_id: string;
          p_quantity_kg: number;
          p_idempotency_key: string;
        };
        Returns: TransactionRow;
      };
      cancel_transaction_and_release: {
        Args: {
          p_transaction_id: string;
          p_actor_id: string;
          p_cancel_reason: string;
        };
        Returns: TransactionRow;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
