-- Creates the 'chat_messages' table
--
-- Columns: id (uuid PK), sender_id (FK → profiles.id), receiver_id (FK → profiles.id),
--          message (text NOT NULL), read_status (bool default false),
--          thread_id (text NOT NULL),  ← booking_id or ticket_id
--          created_at (timestamptz default now())
--
-- Index: on thread_id for fast thread queries
-- Supabase Realtime: enabled on this table for live chat updates
--
-- RLS policies:
--   SELECT/INSERT: only sender or receiver (auth.uid() IN (sender_id, receiver_id))
--   DELETE: only sender
--
-- Satisfies: RQ13
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  read_status boolean NOT NULL DEFAULT false,
  thread_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender and receiver can read messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Sender can insert messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update read status"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);
