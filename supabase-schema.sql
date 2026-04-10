-- ═══════════════════════════════════════════════════════════
-- VaultX Database Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- PROFILES TABLE (permanent user data)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  username text unique,
  phone text,
  role text not null default 'user',          -- 'user' | 'admin'
  balance numeric not null default 0,
  status text not null default 'active',       -- 'active' | 'suspended'
  my_referral_code text unique,
  referred_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security
alter table profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Service role can do everything (for API routes)
create policy "Service role full access"
  on profiles for all
  using (auth.role() = 'service_role');

-- Allow insert during signup (called from API route with user's own ID)
create policy "Allow profile creation"
  on profiles for insert
  with check (auth.uid() = id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ═══════════════════════════════════════════════════════════
-- ADMIN USER SETUP
-- After creating admin@gmail.com in Supabase Auth with password admin1234,
-- run this to give them admin role:
-- ═══════════════════════════════════════════════════════════

-- Step 1: Create admin in Supabase Auth Dashboard manually
-- Email: admin@gmail.com | Password: admin1234 | Confirm email: YES

-- Step 2: Then run this (replace the UUID with the actual admin user ID from Auth):
-- insert into profiles (id, full_name, username, role, my_referral_code)
-- values (
--   'REPLACE_WITH_ADMIN_USER_UUID',
--   'Admin',
--   'admin',
--   'admin',
--   'VX-ADMIN'
-- );

-- ═══════════════════════════════════════════════════════════
-- FUTURE TABLES (will be added with each page)
-- ═══════════════════════════════════════════════════════════

-- seasons, deposits, withdrawals, transactions, referrals,
-- support_tickets, site_settings — coming with each page build
