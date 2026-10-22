-- RE-FLOW Phase 1: Auto profile creation trigger & role validation

-- Function to handle new user signup from auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_name text;
begin
  -- Extract and validate role from user metadata.
  -- Only 'factory' or 'farmer' are accepted from self-registration.
  -- 'admin' is never allowed to be self-assigned.
  v_role := new.raw_user_meta_data->>'role';
  if v_role not in ('factory', 'farmer') then
    v_role := 'farmer';
  end if;

  v_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, 'User'), '@', 1)
  );

  insert into public.profiles (
    id,
    name,
    role,
    phone,
    latitude,
    longitude,
    created_at,
    updated_at
  ) values (
    new.id,
    v_name,
    v_role,
    new.raw_user_meta_data->>'phone',
    case
      when new.raw_user_meta_data->>'latitude' is not null
      then (new.raw_user_meta_data->>'latitude')::double precision
      else null
    end,
    case
      when new.raw_user_meta_data->>'longitude' is not null
      then (new.raw_user_meta_data->>'longitude')::double precision
      else null
    end,
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger on auth.users after insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
