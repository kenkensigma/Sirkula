-- RE-FLOW MVP Demo Seed Data
-- Coordinates centered in Denpasar & surrounding areas (-8.65, 115.21)

-- 1. Demo Profiles (Assuming auth users created or mock UUIDs)
-- Note: In Supabase, foreign key references auth.users(id). For manual database setups,
-- insert into auth.users first or use these predefined demo IDs.

DO $$
DECLARE
  v_factory_id uuid := '11111111-1111-1111-1111-111111111111';
  v_farmer_id uuid  := '22222222-2222-2222-2222-222222222222';
  v_admin_id uuid   := '33333333-3333-3333-3333-333333333333';
BEGIN
  -- Insert dummy users into auth.users if they don't exist (Supabase auth schema)
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES
      (v_factory_id, 'pabrik@sirkula.local', '', now(), '{"provider":"email","providers":["email"]}', '{"name":"Pabrik Tahu Sumber Barokah"}', now(), now()),
      (v_farmer_id, 'peternak@sirkula.local', '', now(), '{"provider":"email","providers":["email"]}', '{"name":"Peternakan Pak Wayan"}', now(), now()),
      (v_admin_id, 'admin@sirkula.local', '', now(), '{"provider":"email","providers":["email"]}', '{"name":"Admin Re-Flow"}', now(), now())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 2. Insert Profiles
  INSERT INTO public.profiles (id, name, role, phone, latitude, longitude)
  VALUES
    (v_factory_id, 'Pabrik Tahu Sumber Barokah', 'factory', '081234567890', -8.6500, 115.2100),
    (v_farmer_id, 'Peternakan Pak Wayan', 'farmer', '081987654321', -8.6700, 115.2200),
    (v_admin_id, 'Admin Re-Flow', 'admin', '081122334455', -8.6550, 115.2150)
  ON CONFLICT (id) DO UPDATE SET
    name = excluded.name,
    role = excluded.role,
    latitude = excluded.latitude,
    longitude = excluded.longitude;

  -- 3. Batches with various freshness states:
  -- A. Fresh Green Batch (prepared 2 hours ago, expires in 10 hours)
  INSERT INTO public.batches (
    id, factory_id, quantity_kg, reserved_kg, sold_kg, price_per_kg_idr,
    latitude, longitude, prepared_at, expires_at, description, status
  ) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    v_factory_id,
    300.00,
    0.00,
    0.00,
    850,
    -8.6500,
    115.2100,
    now() - interval '2 hours',
    now() + interval '10 hours',
    'Ampas tahu putih baru selesai pres pagi ini, hangat dan bersih.',
    'available'
  ) ON CONFLICT (id) DO NOTHING;

  -- B. Yellow Freshness Batch (prepared 9 hours ago, expires in 3 hours)
  INSERT INTO public.batches (
    id, factory_id, quantity_kg, reserved_kg, sold_kg, price_per_kg_idr,
    latitude, longitude, prepared_at, expires_at, description, status
  ) VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    v_factory_id,
    150.00,
    0.00,
    0.00,
    750,
    -8.6520,
    115.2150,
    now() - interval '9 hours',
    now() + interval '3 hours',
    'Ampas tahu produksi subuh tadi, kondisi masih bagus untuk pakan hari ini.',
    'available'
  ) ON CONFLICT (id) DO NOTHING;

  -- C. Expired Batch (prepared 14 hours ago, already expired)
  INSERT INTO public.batches (
    id, factory_id, quantity_kg, reserved_kg, sold_kg, price_per_kg_idr,
    latitude, longitude, prepared_at, expires_at, description, status
  ) VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    v_factory_id,
    200.00,
    0.00,
    0.00,
    500,
    -8.6480,
    115.2080,
    now() - interval '14 hours',
    now() - interval '2 hours',
    'Ampas tahu kemarin sore (kadaluwarsa dari pakan segar).',
    'expired'
  ) ON CONFLICT (id) DO NOTHING;

END $$;
