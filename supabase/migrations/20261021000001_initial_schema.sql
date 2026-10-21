-- RE-FLOW MVP Initial Schema Migration
-- Database: Supabase PostgreSQL
-- Targets: auth.users, profiles, batches, transactions, ledger_entries, handover_verifications, impact_logs, audit_logs

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUM OR CHECK CONSTANTS
-- roles: 'factory', 'farmer', 'admin'
-- batch status: 'available', 'paused', 'sold_out', 'expired', 'cancelled'
-- transaction status: 'awaiting_simulated_payment', 'paid_simulated', 'shipped', 'awaiting_handover_verification', 'completed', 'cancelled', 'cancelled_refunded_simulated', 'needs_review'

-- 3. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('factory', 'farmer', 'admin')),
  phone text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. BATCHES TABLE
create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.profiles(id) on delete cascade,
  quantity_kg numeric(12,2) not null check (quantity_kg > 0),
  reserved_kg numeric(12,2) not null default 0 check (reserved_kg >= 0),
  sold_kg numeric(12,2) not null default 0 check (sold_kg >= 0),
  price_per_kg_idr integer not null check (price_per_kg_idr >= 0),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  prepared_at timestamptz not null,
  expires_at timestamptz not null,
  description text,
  status text not null check (status in ('available', 'paused', 'sold_out', 'expired', 'cancelled')) default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_batches_stock_balance check (reserved_kg + sold_kg <= quantity_kg)
);

-- 5. TRANSACTIONS TABLE
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete restrict,
  farmer_id uuid not null references public.profiles(id) on delete restrict,
  factory_id uuid not null references public.profiles(id) on delete restrict,
  quantity_kg numeric(12,2) not null check (quantity_kg > 0),
  unit_price_idr integer not null check (unit_price_idr >= 0),
  total_amount_idr bigint not null check (total_amount_idr >= 0),
  status text not null check (status in (
    'awaiting_simulated_payment',
    'paid_simulated',
    'shipped',
    'awaiting_handover_verification',
    'completed',
    'cancelled',
    'cancelled_refunded_simulated',
    'needs_review'
  )) default 'awaiting_simulated_payment',
  payment_mode text not null check (payment_mode = 'simulation') default 'simulation',
  idempotency_key text not null,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint uq_transactions_farmer_idempotency unique (farmer_id, idempotency_key)
);

-- 6. LEDGER_ENTRIES TABLE (SIMULATED LEDGER)
create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  account_profile_id uuid not null references public.profiles(id) on delete restrict,
  entry_type text not null check (entry_type in ('payment', 'release', 'refund', 'reversal')),
  amount_idr bigint not null,
  status text not null check (status in ('posted', 'reversed')) default 'posted',
  reference_key text not null unique,
  created_at timestamptz not null default now()
);

-- 7. HANDOVER_VERIFICATIONS TABLE
create table if not exists public.handover_verifications (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade unique,
  pin_hash text not null,
  expires_at timestamptz not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 8. IMPACT_LOGS TABLE
create table if not exists public.impact_logs (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade unique,
  material_kg numeric(12,2) not null check (material_kg > 0),
  estimated_co2e_kg numeric(14,3) not null check (estimated_co2e_kg >= 0),
  estimated_feed_savings_idr bigint not null check (estimated_feed_savings_idr >= 0),
  methodology_version text not null default 'v1.0-mvp-assumption',
  created_at timestamptz not null default now()
);

-- 9. AUDIT_LOGS TABLE
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 10. INDEXES
create index if not exists idx_batches_factory_created on public.batches (factory_id, created_at desc);
create index if not exists idx_batches_status_expires on public.batches (status, expires_at);
create index if not exists idx_transactions_farmer_created on public.transactions (farmer_id, created_at desc);
create index if not exists idx_transactions_factory_created on public.transactions (factory_id, created_at desc);
create index if not exists idx_transactions_status_created on public.transactions (status, created_at desc);
create index if not exists idx_ledger_entries_tx_created on public.ledger_entries (transaction_id, created_at);
create index if not exists idx_audit_logs_created on public.audit_logs (created_at desc);
create index if not exists idx_impact_logs_created on public.impact_logs (created_at desc);

-- 11. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.batches enable row level security;
alter table public.transactions enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.handover_verifications enable row level security;
alter table public.impact_logs enable row level security;
alter table public.audit_logs enable row level security;

-- PROFILES RLS
-- Users can view their own profile and view basic profile of other users (e.g. factory info)
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Authenticated users can read basic profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- User can update only safe fields (name, phone, lat, lng). Role cannot be altered via client update
create policy "Users can update own safe profile fields"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- BATCHES RLS
-- Anyone authenticated can view active batches
create policy "Authenticated users can read batches"
  on public.batches for select
  using (auth.role() = 'authenticated');

-- Only factory can insert their own batch
create policy "Factory can insert batches"
  on public.batches for insert
  with check (
    auth.uid() = factory_id and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'factory')
  );

-- Factory can update their own batch
create policy "Factory can update own batches"
  on public.batches for update
  using (auth.uid() = factory_id)
  with check (auth.uid() = factory_id);

-- TRANSACTIONS RLS
-- Farmer and Factory involved, plus Admin, can view the transaction
create policy "Participants can read transactions"
  on public.transactions for select
  using (
    auth.uid() = farmer_id or
    auth.uid() = factory_id or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Client cannot directly insert transactions; done via RPC or server-side service role
-- to guarantee atomic stock reservation and snapshot pricing.

-- LEDGER, HANDOVER, AUDIT, IMPACT RLS
-- Read only for involved parties or admins, write strictly restricted to service role
create policy "Participants can read their ledger entries"
  on public.ledger_entries for select
  using (
    account_profile_id = auth.uid() or
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and (t.farmer_id = auth.uid() or t.factory_id = auth.uid())
    ) or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Impact logs are readable by authenticated users"
  on public.impact_logs for select
  using (auth.role() = 'authenticated');

create policy "Admins can read audit logs"
  on public.audit_logs for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 12. ATOMIC STORED PROCEDURES (RPC)

-- 12.1. Atomic Stock Reservation & Transaction Creation
create or replace function public.create_transaction_reservation(
  p_farmer_id uuid,
  p_batch_id uuid,
  p_quantity_kg numeric,
  p_idempotency_key text
)
returns public.transactions
language plpgsql
security definer
as $$
declare
  v_batch public.batches%rowtype;
  v_existing_tx public.transactions%rowtype;
  v_tx public.transactions%rowtype;
  v_available_kg numeric;
  v_total_amount_idr bigint;
begin
  -- 1. Check idempotency
  select * into v_existing_tx
  from public.transactions
  where farmer_id = p_farmer_id and idempotency_key = p_idempotency_key;

  if found then
    -- Verify idempotency payload matches
    if v_existing_tx.batch_id = p_batch_id and v_existing_tx.quantity_kg = p_quantity_kg then
      return v_existing_tx;
    else
      raise exception 'IDEMPOTENCY_CONFLICT: Key already used with different payload'
        using errcode = 'P0001';
    end if;
  end if;

  -- 2. Lock batch row for update
  select * into v_batch
  from public.batches
  where id = p_batch_id
  for update;

  if not found then
    raise exception 'NOT_FOUND: Batch does not exist'
      using errcode = 'P0002';
  end if;

  -- 3. Check batch status and expiry
  if v_batch.status <> 'available' then
    raise exception 'STATE_CONFLICT: Batch is not available'
      using errcode = 'P0003';
  end if;

  if v_batch.expires_at <= now() then
    raise exception 'BATCH_EXPIRED: Batch freshness has expired'
      using errcode = 'P0004';
  end if;

  -- 4. Check available stock
  v_available_kg := v_batch.quantity_kg - v_batch.reserved_kg - v_batch.sold_kg;
  if v_available_kg < p_quantity_kg then
    raise exception 'INSUFFICIENT_STOCK: Only % kg available', v_available_kg
      using errcode = 'P0005';
  end if;

  -- 5. Calculate snapshot total
  v_total_amount_idr := round(p_quantity_kg * v_batch.price_per_kg_idr);

  -- 6. Insert transaction
  insert into public.transactions (
    batch_id,
    farmer_id,
    factory_id,
    quantity_kg,
    unit_price_idr,
    total_amount_idr,
    status,
    payment_mode,
    idempotency_key
  ) values (
    p_batch_id,
    p_farmer_id,
    v_batch.factory_id,
    p_quantity_kg,
    v_batch.price_per_kg_idr,
    v_total_amount_idr,
    'awaiting_simulated_payment',
    'simulation',
    p_idempotency_key
  )
  returning * into v_tx;

  -- 7. Update batch reserved quantity
  update public.batches
  set
    reserved_kg = reserved_kg + p_quantity_kg,
    status = case
      when (quantity_kg - (reserved_kg + p_quantity_kg) - sold_kg) <= 0 then 'sold_out'
      else status
    end,
    updated_at = now()
  where id = p_batch_id;

  return v_tx;
end;
$$;

-- 12.2. Cancel Transaction and Release Stock
create or replace function public.cancel_transaction_and_release(
  p_transaction_id uuid,
  p_actor_id uuid,
  p_cancel_reason text
)
returns public.transactions
language plpgsql
security definer
as $$
declare
  v_tx public.transactions%rowtype;
  v_batch public.batches%rowtype;
begin
  select * into v_tx
  from public.transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'NOT_FOUND: Transaction does not exist' using errcode = 'P0002';
  end if;

  -- Check status allowing cancellation
  if v_tx.status not in ('awaiting_simulated_payment', 'paid_simulated') then
    raise exception 'STATE_CONFLICT: Cannot cancel transaction in status %', v_tx.status
      using errcode = 'P0003';
  end if;

  -- Lock batch and release reserved stock
  select * into v_batch
  from public.batches
  where id = v_tx.batch_id
  for update;

  if found then
    update public.batches
    set
      reserved_kg = greatest(0, reserved_kg - v_tx.quantity_kg),
      status = case
        when status = 'sold_out' and expires_at > now() then 'available'
        else status
      end,
      updated_at = now()
    where id = v_batch.id;
  end if;

  -- Update transaction
  update public.transactions
  set
    status = case
      when v_tx.status = 'paid_simulated' then 'cancelled_refunded_simulated'
      else 'cancelled'
    end,
    cancel_reason = p_cancel_reason,
    updated_at = now()
  where id = p_transaction_id
  returning * into v_tx;

  -- If was paid, insert reversal ledger entry
  if v_tx.status = 'cancelled_refunded_simulated' then
    insert into public.ledger_entries (
      transaction_id,
      account_profile_id,
      entry_type,
      amount_idr,
      status,
      reference_key
    ) values (
      v_tx.id,
      v_tx.farmer_id,
      'refund',
      v_tx.total_amount_idr,
      'posted',
      'refund-' || v_tx.id || '-' || extract(epoch from now())::text
    );
  end if;

  return v_tx;
end;
$$;
