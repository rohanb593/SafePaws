-- Align `calendars` with `resources/schema.sql`: FK column is `user_id` (not `minder_id`).
-- Idempotent: only renames when the legacy column still exists.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'calendars'
      AND column_name = 'minder_id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'calendars'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.calendars RENAME COLUMN minder_id TO user_id;
  END IF;
END $$;

COMMENT ON COLUMN public.calendars.user_id IS 'Profile id of the minder (one calendar row per user).';
