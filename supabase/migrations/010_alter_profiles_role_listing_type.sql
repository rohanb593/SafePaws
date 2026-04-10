-- Align profiles with app expectations: minder role (seed + app) and optional listing_type for navigation.
--
-- If `profiles.role` uses enum `user_role`, add the new label before constraints reference it.
-- If your DB uses plain `text` for `role` (see 001_create_users.sql) and has no `user_role` type,
-- comment out the next line or omit it when applying manually.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'minder';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role::text IN ('user', 'minder', 'admin', 'customer_support'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS listing_type text;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_listing_type_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_listing_type_check
  CHECK (listing_type IS NULL OR listing_type IN ('owner', 'minder'));

COMMENT ON COLUMN public.profiles.listing_type IS
  'When role is minder: owner = OwnerNavigator UI; minder = MinderNavigator UI; null defaults to minder UI.';
