-- Minders must be able to read pet rows linked to bookings they receive (embeds, JobDetails).
-- The original pets migration comment promised this policy but only owner SELECT existed.

CREATE POLICY "Minders can read pets for their bookings"
  ON public.pets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.pet_id = pets.id
        AND b.minder_id = auth.uid()
    )
  );
