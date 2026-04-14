-- Remove recurring booking fields (single visits only).
ALTER TABLE public.bookings DROP COLUMN IF EXISTS recurring_schedule;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS is_recurring;
