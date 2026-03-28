-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL,
  requester_id uuid NOT NULL,
  minder_id uuid NOT NULL,
  location text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::booking_status,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_schedule text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id),
  CONSTRAINT bookings_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.profiles(id),
  CONSTRAINT bookings_minder_id_fkey FOREIGN KEY (minder_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.calendars (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  available_timing jsonb NOT NULL DEFAULT '[]'::jsonb,
  booked_timing jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT calendars_pkey PRIMARY KEY (id),
  CONSTRAINT calendars_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message text NOT NULL,
  read_status boolean NOT NULL DEFAULT false,
  thread_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT chat_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.favourites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  minder_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT favourites_pkey PRIMARY KEY (id),
  CONSTRAINT favourites_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id),
  CONSTRAINT favourites_minder_id_fkey FOREIGN KEY (minder_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.gps_locations (
  booking_id uuid NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gps_locations_pkey PRIMARY KEY (booking_id),
  CONSTRAINT gps_locations_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);

CREATE TABLE public.listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  location text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  listing_type USER-DEFINED NOT NULL,
  animal text,
  time text,
  price numeric,
  rating numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT listings_pkey PRIMARY KEY (id),
  CONSTRAINT listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.medical_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL UNIQUE,
  vet_name text NOT NULL DEFAULT ''::text,
  vet_clinic text NOT NULL DEFAULT ''::text,
  vet_phone text NOT NULL DEFAULT ''::text,
  vaccine_info jsonb NOT NULL DEFAULT '[]'::jsonb,
  medical_history text NOT NULL DEFAULT ''::text,
  allergies ARRAY NOT NULL DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT medical_records_pkey PRIMARY KEY (id),
  CONSTRAINT medical_records_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id)
);

CREATE TABLE public.pets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  pet_type text NOT NULL,
  breed text NOT NULL DEFAULT ''::text,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pets_pkey PRIMARY KEY (id),
  CONSTRAINT pets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT ''::text,
  location text NOT NULL DEFAULT ''::text,
  preferences text NOT NULL DEFAULT ''::text,
  email text NOT NULL,
  phone text,
  preferred_communication USER-DEFINED NOT NULL DEFAULT 'in-app'::preferred_communication,
  role USER-DEFINED NOT NULL DEFAULT 'user'::user_role,
  account_status USER-DEFINED NOT NULL DEFAULT 'active'::account_status,
  vet_clinic_name text,
  vet_clinic_phone text,
  vet_clinic_address text,
  experience text,
  ratings numeric NOT NULL DEFAULT 0,
  pet_info text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  booking_id uuid,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT ''::text,
  date timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);

CREATE TABLE public.tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  query_type text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::ticket_status,
  priority USER-DEFINED NOT NULL DEFAULT 'medium'::ticket_priority,
  by_user uuid NOT NULL,
  category USER-DEFINED NOT NULL DEFAULT 'general'::ticket_category,
  issue_description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tickets_pkey PRIMARY KEY (id),
  CONSTRAINT tickets_by_user_fkey FOREIGN KEY (by_user) REFERENCES public.profiles(id)
);
