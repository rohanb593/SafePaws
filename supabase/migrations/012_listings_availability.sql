-- Structured weekly availability for listings (search filters use day + time client-side).
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS availability jsonb;

COMMENT ON COLUMN public.listings.availability IS
  '{"days":["Mon",...],"startTime":"HH:mm","endTime":"HH:mm"} — empty days means any day.';
