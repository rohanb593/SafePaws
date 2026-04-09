-- Seed data for development and testing
-- Run AFTER all schema migrations (001–009) have been applied.
--
-- Creates:
--   3 profiles  : 1 owner (user), 1 minder (minder), 1 admin
--   2 pets      : both owned by the owner profile
--   1 booking   : owner books the minder for pet #1
--   2 listings  : one minder listing, one owner listing
--   3 chat msgs : a short thread between owner and minder
--
-- Fixed UUIDs make it easy to reference in tests / Postman.

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- These rows sit in public.profiles.
-- In a real Supabase project, auth.users rows must exist first (use the
-- Supabase dashboard "Create user" or the auth API). For local dev with
-- `supabase db reset`, the trigger that copies auth.users → profiles fires
-- automatically, so just ensure the UUIDs below are seeded there first.

INSERT INTO public.profiles (
  id, username, display_name, location, preferences, email, phone,
  preferred_communication, role, account_status,
  vet_clinic_name, vet_clinic_phone, vet_clinic_address,
  experience, ratings, pet_info, created_at
) VALUES
  -- Owner
  (
    '00000000-0000-0000-0000-000000000001',
    'alice_owner',
    'Alice Smith',
    'London, UK',
    'Prefers afternoon bookings',
    'alice@example.com',
    '+447700900001',
    'in-app',
    'user',
    'active',
    NULL, NULL, NULL,
    NULL,
    0,
    'I have two dogs and need occasional minding.',
    now() - interval '30 days'
  ),
  -- Minder
  (
    '00000000-0000-0000-0000-000000000002',
    'bob_minder',
    'Bob Jones',
    'London, UK',
    'Available weekends',
    'bob@example.com',
    '+447700900002',
    'in-app',
    'minder',
    'active',
    'City Vet Clinic',
    '+442012345678',
    '10 Vet Street, London',
    '3 years experience with dogs and cats',
    4.7,
    '',
    now() - interval '60 days'
  ),
  -- Admin
  (
    '00000000-0000-0000-0000-000000000003',
    'carol_admin',
    'Carol Admin',
    'London, UK',
    '',
    'carol@example.com',
    NULL,
    'email',
    'admin',
    'active',
    NULL, NULL, NULL,
    NULL,
    0,
    '',
    now() - interval '90 days'
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Pets ─────────────────────────────────────────────────────────────────────
INSERT INTO public.pets (id, owner_id, pet_type, breed, name, created_at)
VALUES
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Dog',
    'Labrador',
    'Buddy',
    now() - interval '20 days'
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Cat',
    'Persian',
    'Whiskers',
    now() - interval '10 days'
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Booking ──────────────────────────────────────────────────────────────────
INSERT INTO public.bookings (
  id, pet_id, requester_id, minder_id, location,
  status, start_time, end_time, is_recurring, recurring_schedule, created_at
)
VALUES
  (
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0001-000000000001',  -- Buddy
    '00000000-0000-0000-0000-000000000001',  -- Alice (owner)
    '00000000-0000-0000-0000-000000000002',  -- Bob (minder)
    '10 Park Lane, London',
    'confirmed',
    now() + interval '2 days',
    now() + interval '2 days' + interval '4 hours',
    false,
    NULL,
    now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Listings ─────────────────────────────────────────────────────────────────
INSERT INTO public.listings (
  id, user_id, location, description, listing_type,
  animal, time, price, rating, created_at
)
VALUES
  -- Bob's minder listing
  (
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'London, UK',
    'Experienced dog and cat minder. Available weekends and evenings.',
    'minder_listing',
    'Dog, Cat',
    'Weekends 9am–6pm',
    15.00,
    4.7,
    now() - interval '55 days'
  ),
  -- Alice's owner listing
  (
    '00000000-0000-0000-0003-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'London, UK',
    'Looking for a reliable minder for my Labrador, Buddy, 2–3 times a week.',
    'owner_listing',
    'Dog',
    'Mon/Wed/Fri afternoons',
    NULL,
    NULL,
    now() - interval '5 days'
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Chat messages ────────────────────────────────────────────────────────────
-- Thread ID is the booking ID so it groups naturally.
INSERT INTO public.chat_messages (
  id, sender_id, receiver_id, message, read_status, thread_id, created_at
)
VALUES
  (
    '00000000-0000-0000-0004-000000000001',
    '00000000-0000-0000-0000-000000000001',  -- Alice
    '00000000-0000-0000-0000-000000000002',  -- Bob
    'Hi Bob, looking forward to the session with Buddy!',
    true,
    '00000000-0000-0000-0002-000000000001',
    now() - interval '12 hours'
  ),
  (
    '00000000-0000-0000-0004-000000000002',
    '00000000-0000-0000-0000-000000000002',  -- Bob
    '00000000-0000-0000-0000-000000000001',  -- Alice
    'Thanks Alice! I''ll be there at 10am sharp. Any special instructions?',
    true,
    '00000000-0000-0000-0002-000000000001',
    now() - interval '11 hours'
  ),
  (
    '00000000-0000-0000-0004-000000000003',
    '00000000-0000-0000-0000-000000000001',  -- Alice
    '00000000-0000-0000-0000-000000000002',  -- Bob
    'Just make sure he gets his walk before noon. He loves the park!',
    false,
    '00000000-0000-0000-0002-000000000001',
    now() - interval '10 hours'
  )
ON CONFLICT (id) DO NOTHING;
