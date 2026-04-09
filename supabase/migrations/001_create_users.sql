-- Creates the 'profiles' table linked to Supabase auth.users
--
-- Columns: id (uuid PK, FK → auth.users), username (unique), display_name, location,
--          preferences, email, phone, preferred_communication, role, account_status,
--          vet_clinic_name, vet_clinic_phone, vet_clinic_address, experience,
--          ratings, pet_info, created_at
--
-- RLS policies:
--   SELECT: authenticated users can read all profiles
--   UPDATE: users can only update their own row (auth.uid() = id)
--
-- Satisfies: RQ1, RQ26, RQ28, RQ29, RQ32, NF7 (UK GDPR — RLS enforced)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  location text NOT NULL DEFAULT '',
  preferences text NOT NULL DEFAULT '',
  email text NOT NULL,
  phone text,
  preferred_communication text NOT NULL DEFAULT 'in-app'
    CHECK (preferred_communication IN ('in-app', 'email', 'phone')),
  role text NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin', 'customer_support')),
  account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'banned')),
  vet_clinic_name text,
  vet_clinic_phone text,
  vet_clinic_address text,
  experience text,
  ratings numeric NOT NULL DEFAULT 0,
  pet_info text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
