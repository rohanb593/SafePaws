-- Optional seed data for local development
-- Insert test users: one PetOwner, one PetMinder, one Admin, one CustomerSupport
-- Insert sample pets, listings, and one pending booking
-- Used only locally — never run against production
-- Test profiles (passwords handled by Supabase Auth — these are profile rows only)
INSERT INTO public.profiles (id, username, display_name, email, phone, location, preferences, role, account_status, ratings, pet_info, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'testowner', 'Test Owner', 'owner@test.com', '+447700000001', 'London', '', 'user', 'active', 0, 'I have a dog and a cat', now()),
  ('00000000-0000-0000-0000-000000000002', 'testminder', 'Test Minder', 'minder@test.com', '+447700000002', 'Manchester', '', 'user', 'active', 4.5, '', now()),
  ('00000000-0000-0000-0000-000000000003', 'testadmin', 'Test Admin', 'admin@test.com', '+447700000003', 'Birmingham', '', 'admin', 'active', 0, '', now());

-- Test pets
INSERT INTO public.pets (id, owner_id, pet_type, breed, name, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Dog', 'Labrador', 'Buddy', now()),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Cat', 'Persian', 'Whiskers', now());

-- Test listings
INSERT INTO public.listings (id, user_id, location, postcode, description, animal, availability, time, price, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000002',
    'Manchester',
    'M1 1AA',
    'Experienced minder available for dogs and cats',
    'Dog',
    '{"days":["Mon","Tue","Wed","Thu","Fri"],"startTime":"09:00","endTime":"17:00"}'::jsonb,
    'Mon, Tue, Wed, Thu, Fri · 09:00–17:00',
    15.00,
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000001',
    'London',
    'E1 6AN',
    'Looking for a minder for my Labrador',
    'Dog',
    '{"days":["Sat","Sun"],"startTime":"10:00","endTime":"16:00"}'::jsonb,
    'Sat, Sun · 10:00–16:00',
    null,
    now()
  );

-- Test booking
INSERT INTO public.bookings (id, pet_id, requester_id, minder_id, location, status, start_time, end_time, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'London', 'confirmed', now() + interval '1 day', now() + interval '2 days', now());

-- Test chat messages
INSERT INTO public.chat_messages (sender_id, receiver_id, message, thread_id, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Hi, are you available this weekend?', '00000000-0000-0000-0000-000000000030', now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Yes I am available!', '00000000-0000-0000-0000-000000000030', now());
