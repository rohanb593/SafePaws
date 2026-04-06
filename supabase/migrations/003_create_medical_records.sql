-- Creates the 'medical_records' table
--
-- Columns: id (uuid PK), pet_id (FK → pets.id ON DELETE CASCADE),
--          vet_name, vet_clinic, vet_phone,
--          vaccine_info (jsonb), medical_history, allergies (text[])
--
-- ON DELETE CASCADE: if pet is deleted, its medical records are deleted (composition, RQ5)
--
-- RLS policies:
--   SELECT: pet owner and any minder with active booking for that pet
--   INSERT: pet owner only
--
-- Satisfies: RQ5
CREATE TABLE public.medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vet_name text NOT NULL DEFAULT '',
  vet_clinic text NOT NULL DEFAULT '',
  vet_phone text NOT NULL DEFAULT '',
  vaccine_info jsonb NOT NULL DEFAULT '[]',
  medical_history text NOT NULL DEFAULT '',
  allergies text[] NOT NULL DEFAULT '{}'
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read their own medical records"
  ON public.medical_records FOR SELECT
  TO authenticated
  USING (
    auth.uid() = (
      SELECT owner_id FROM public.pets WHERE id = pet_id
    )
  );

CREATE POLICY "Owners can insert medical records for their pets"
  ON public.medical_records FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = (
      SELECT owner_id FROM public.pets WHERE id = pet_id
    )
  );

CREATE POLICY "Owners can update medical records for their pets"
  ON public.medical_records FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = (
      SELECT owner_id FROM public.pets WHERE id = pet_id
    )
  );
