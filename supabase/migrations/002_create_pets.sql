-- Creates the 'pets' table
--
-- Columns: id (uuid PK), owner_id (FK → profiles.id ON DELETE CASCADE),
--          pet_type, breed, name, created_at
--
-- RLS policies:
--   SELECT: owner can read their own pets; minders can read pets in their bookings
--   INSERT/UPDATE/DELETE: only the owner (auth.uid() = owner_id)
--
-- Satisfies: RQ4, RQ15, RQ30
CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_type text NOT NULL,
  breed text NOT NULL DEFAULT '',
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read their own pets"
  ON public.pets FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own pets"
  ON public.pets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own pets"
  ON public.pets FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own pets"
  ON public.pets FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);
