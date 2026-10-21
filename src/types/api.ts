import { BatchStatus, FreshnessZone, TransactionStatus, UserRole } from "./database";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "STATE_CONFLICT"
  | "INSUFFICIENT_STOCK"
  | "IDEMPOTENCY_CONFLICT"
  | "BATCH_EXPIRED"
  | "PIN_INVALID"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
    [key: string]: unknown;
  };
}

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

export interface UserProfileResponse {
  id: string;
  name: string;
  role: UserRole;
  phone: string | null;
  location: {
    latitude: number | null;
    longitude: number | null;
  };
  created_at: string;
}

export interface BatchItemResponse {
  id: string;
  factory_id: string;
  factory_name: string;
  quantity_kg: number;
  available_kg: number;
  price_per_kg_idr: number;
  latitude: number;
  longitude: number;
  distance_km?: number;
  prepared_at: string;
  expires_at: string;
  freshness_zone: FreshnessZone;
  status: BatchStatus;
  description?: string | null;
}

export interface TransactionItemResponse {
  id: string;
  batch_id: string;
  farmer_id: string;
  factory_id: string;
  quantity_kg: number;
  unit_price_idr: number;
  total_amount_idr: number;
  status: TransactionStatus;
  payment_mode: "simulation";
  idempotency_key: string;
  created_at: string;
  completed_at?: string | null;
}

export interface ImpactSummaryResponse {
  period: {
    from: string;
    to: string;
  };
  diverted_from_waste_kg: number;
  estimated_co2e_avoided_kg: number;
  estimated_feed_savings_idr: number;
  methodology: {
    co2e_kg_per_kg_material: number;
    feed_savings_idr_per_kg: number;
    label: string;
  };
}
